/**
 * Transaction Data Diagnostic Script
 *
 * Investigates why transaction data is empty when submitted.
 * Run with: npx ts-node src/test-transaction-data.ts
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import {
  loadProvider,
  setLoggers,
  startRailgunEngine,
  ArtifactStore,
  walletForID,
  populateProvedTransfer,
  generateTransferProof,
  getProver,
  SnarkJSGroth16,
  createRailgunWallet,
} from '@railgun-community/wallet';
import { groth16 } from 'snarkjs';
import {
  NetworkName,
  FallbackProviderJsonConfig,
  NETWORK_CONFIG,
  RailgunERC20AmountRecipient,
  EVMGasType,
  TransactionGasDetails,
  TXIDVersion,
  getEVMGasTypeForTransaction,
} from '@railgun-community/shared-models';
import leveldown from 'leveldown';
import fs from 'fs';

const NETWORK_NAME: NetworkName = NetworkName.EthereumSepolia;
const RPC_URL = process.env.ETHEREUM_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const TOKEN_ADDRESS = process.env.TEST_TOKEN_ADDRESS!;
const EMPLOYER_MNEMONIC = process.env.RAILGUN_WALLET_MNEMONIC!;

const fileExists = (path: string): Promise<boolean> => {
  return new Promise(resolve => {
    fs.promises
      .access(path)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
};

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 TRANSACTION DATA DIAGNOSTIC');
  console.log('='.repeat(70));
  console.log();

  // Initialize
  console.log('🚀 Initializing RAILGUN Engine...\n');

  // Setup logging
  setLoggers(
    (msg) => console.log(`[RAILGUN] ${msg}`),
    (error) => console.error(`[RAILGUN ERROR]`, error)
  );

  // LevelDB for storing encrypted wallet data
  const db = leveldown('./db');

  // Artifact store (like cookbook)
  const artifactStore = new ArtifactStore(
    fs.promises.readFile,
    async (dir, path, data) => {
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(path, data);
    },
    fileExists,
  );

  await startRailgunEngine(
    'tx diagnostic',
    db,
    true,
    artifactStore,
    false,
    false,
    ['https://ppoi-agg.horsewithsixlegs.xyz'],
    [],
  );

  console.log('✅ RAILGUN Engine initialized\n');

  // Setup snarkjs prover for zero-knowledge proofs
  console.log('🔧 Setting up snarkjs prover...');
  const prover = getProver();
  prover.setSnarkJSGroth16(groth16 as SnarkJSGroth16);
  console.log('✅ Prover configured\n');

  // Setup provider
  console.log('🌐 Setting up network provider...\n');

  const chainId = NETWORK_CONFIG[NETWORK_NAME].chain.id;

  const fallbackProviderConfig: FallbackProviderJsonConfig = {
    chainId,
    providers: [
      {
        provider: RPC_URL,
        priority: 1,
        weight: 2, // Must be >= 2 for fallback quorum
      },
    ],
  };

  const pollingInterval = 10000;
  await loadProvider(fallbackProviderConfig, NETWORK_NAME, pollingInterval);

  console.log('✅ Provider connected to', NETWORK_NAME, '\n');

  // Load wallets
  console.log('🔐 Loading wallets...\n');

  // Encryption key must be 32 bytes (64 hex characters) for AES-256
  const encryptionKey = '0101010101010101010101010101010101010101010101010101010101010101';

  const employerWallet = await createRailgunWallet(
    encryptionKey,
    EMPLOYER_MNEMONIC,
    {}, // creationBlockNumbers
  );

  // Create employee wallet for testing
  const employeeWallet = await createRailgunWallet(
    encryptionKey,
    'test test test test test test test test test test test junk', // Test mnemonic
    {},
  );

  console.log(`Employer wallet: ${employerWallet.id.substring(0, 20)}...`);
  console.log(`Employee wallet: ${employeeWallet.railgunAddress.substring(0, 45)}...\n`);

  // Prepare public wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const publicWallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('='.repeat(70));
  console.log('📝 STEP 1: Generate ZK Proof');
  console.log('='.repeat(70));
  console.log();

  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: TOKEN_ADDRESS,
      amount: BigInt('100000'), // 0.1 USDC
      recipientAddress: employeeWallet.railgunAddress,
    },
  ];

  console.log('Generating proof for 0.1 USDC transfer...');

  try {
    await generateTransferProof(
      TXIDVersion.V2_PoseidonMerkle,
      NETWORK_NAME,
      employerWallet.id,
      encryptionKey,
      false, // showSenderAddressToRecipient
      undefined, // memoText
      erc20AmountRecipients,
      [], // nftAmountRecipients
      undefined, // broadcasterFeeERC20AmountRecipient
      false, // sendWithPublicWallet
      undefined, // overallBatchMinGasPrice
      (progress) => {
        if (progress === 0 || progress === 0.5 || progress === 1) {
          console.log(`   Progress: ${(progress * 100).toFixed(0)}%`);
        }
      }
    );

    console.log('✅ Proof generated successfully\n');
  } catch (error) {
    console.error('❌ Proof generation failed:', error);
    console.log('\nThis could mean:');
    console.log('- Insufficient balance');
    console.log('- No spendable UTXOs');
    console.log('- POI validation issues');
    process.exit(1);
  }

  console.log('='.repeat(70));
  console.log('📦 STEP 2: Populate Transaction Data');
  console.log('='.repeat(70));
  console.log();

  // Get gas estimate
  const feeData = await provider.getFeeData();
  const evmGasType = getEVMGasTypeForTransaction(NETWORK_NAME, false); // false = using RAILGUN wallet (not public)

  const gasDetails: TransactionGasDetails = {
    evmGasType,
    gasEstimate: 250000n,
    maxFeePerGas: evmGasType === EVMGasType.Type2 ? feeData.maxFeePerGas ?? undefined : undefined,
    maxPriorityFeePerGas: evmGasType === EVMGasType.Type2 ? feeData.maxPriorityFeePerGas ?? undefined : undefined,
    gasPrice: evmGasType === EVMGasType.Type1 ? feeData.gasPrice ?? undefined : undefined,
  };

  console.log('Populating transaction...');

  let transferResult;
  try {
    transferResult = await populateProvedTransfer(
      TXIDVersion.V2_PoseidonMerkle,
      NETWORK_NAME,
      employerWallet.id,
      false, // showSenderAddressToRecipient
      undefined, // memoText
      erc20AmountRecipients,
      [], // nftAmountRecipients
      undefined, // broadcasterFeeERC20AmountRecipient
      false, // sendWithPublicWallet
      undefined, // overallBatchMinGasPrice
      gasDetails
    );

    console.log('✅ Transaction populated\n');
  } catch (error) {
    console.error('❌ Transaction population failed:', error);
    process.exit(1);
  }

  console.log('='.repeat(70));
  console.log('🔬 STEP 3: Inspect Transaction Data');
  console.log('='.repeat(70));
  console.log();

  console.log('Transaction Object Analysis:');
  console.log('-'.repeat(70));
  console.log();

  console.log('Transaction fields present:', Object.keys(transferResult.transaction));
  console.log();

  console.log('Field Details:');
  console.log(`  to: ${transferResult.transaction.to}`);
  console.log(`  data: ${transferResult.transaction.data ? 'PRESENT' : 'MISSING'}`);
  console.log(`  data type: ${typeof transferResult.transaction.data}`);
  console.log(`  data length: ${transferResult.transaction.data?.length || 0} characters`);
  console.log(`  data (first 100 chars): ${transferResult.transaction.data?.substring(0, 100) || 'EMPTY'}`);
  console.log(`  gasLimit: ${transferResult.transaction.gasLimit?.toString()}`);
  console.log(`  type: ${transferResult.transaction.type}`);
  console.log(`  maxFeePerGas: ${transferResult.transaction.maxFeePerGas?.toString()}`);
  console.log(`  maxPriorityFeePerGas: ${transferResult.transaction.maxPriorityFeePerGas?.toString()}`);
  console.log();

  if (!transferResult.transaction.data || transferResult.transaction.data === '0x') {
    console.log('❌ CRITICAL: Transaction data is EMPTY or "0x"!');
    console.log('   This explains why the transaction reverts.');
    console.log('   The RAILGUN contract receives no instructions.');
    console.log();
    console.log('   Possible causes:');
    console.log('   1. Proof generation succeeded but data population failed');
    console.log('   2. Bug in RAILGUN SDK');
    console.log('   3. Incompatible SDK versions');
    process.exit(1);
  }

  console.log('✅ Transaction data is present and populated');
  console.log();

  console.log('='.repeat(70));
  console.log('🧪 STEP 4: Test Data Preservation Through Workflow');
  console.log('='.repeat(70));
  console.log();

  // Test 1: Copy transaction object
  const txCopy1 = { ...transferResult.transaction };
  console.log('Test 1: Shallow copy');
  console.log(`  Data preserved: ${txCopy1.data ? 'YES' : 'NO'}`);
  console.log(`  Data length: ${txCopy1.data?.length || 0}`);
  console.log();

  // Test 2: Add nonce
  const nonce = await publicWallet.getNonce('latest');
  const txWithNonce = {
    ...transferResult.transaction,
    nonce: nonce,
  };
  console.log('Test 2: After adding nonce');
  console.log(`  Data preserved: ${txWithNonce.data ? 'YES' : 'NO'}`);
  console.log(`  Data length: ${txWithNonce.data?.length || 0}`);
  console.log();

  // Test 3: Add from field
  const txWithFrom = {
    ...transferResult.transaction,
    from: publicWallet.address,
  };
  console.log('Test 3: After adding "from" field');
  console.log(`  Data preserved: ${txWithFrom.data ? 'YES' : 'NO'}`);
  console.log(`  Data length: ${txWithFrom.data?.length || 0}`);
  console.log();

  // Test 4: Both nonce and from
  const txFinal = {
    ...transferResult.transaction,
    nonce: nonce,
    from: publicWallet.address,
  };
  console.log('Test 4: After adding both nonce and "from"');
  console.log(`  Data preserved: ${txFinal.data ? 'YES' : 'NO'}`);
  console.log(`  Data length: ${txFinal.data?.length || 0}`);
  console.log();

  if (!txFinal.data || txFinal.data === '0x') {
    console.log('❌ Data was LOST during transaction preparation!');
    console.log('   This is the bug causing the revert.');
  } else {
    console.log('✅ Data preserved through all transformations');
  }

  console.log('='.repeat(70));
  console.log('📤 STEP 5: Serialize Transaction (What Would Be Sent)');
  console.log('='.repeat(70));
  console.log();

  // Try to serialize the transaction as ethers would
  console.log('Serializing transaction as ethers.js would...');
  console.log();

  try {
    const serialized = ethers.Transaction.from(txFinal).unsignedSerialized;
    console.log(`✅ Serialization successful`);
    console.log(`   Serialized length: ${serialized.length} bytes`);
    console.log(`   First 200 chars: ${serialized.substring(0, 200)}`);
    console.log();
  } catch (error) {
    console.error('❌ Serialization failed:', error);
    console.log('   This could indicate invalid transaction format');
    console.log();
  }

  console.log('='.repeat(70));
  console.log('🎯 STEP 6: Test Actual Submission (DRY RUN)');
  console.log('='.repeat(70));
  console.log();

  console.log('Testing what happens during actual sendTransaction call...');
  console.log();

  // Create the exact transaction object we send in test-shield.ts
  const txToSend = {
    to: transferResult.transaction.to,
    data: transferResult.transaction.data,
    value: 0n,
    gasLimit: transferResult.transaction.gasLimit,
    maxFeePerGas: transferResult.transaction.maxFeePerGas,
    maxPriorityFeePerGas: transferResult.transaction.maxPriorityFeePerGas,
    type: 2,
    chainId: chainId,
    nonce: nonce,
  };

  console.log('Transaction object to send:');
  console.log(`  to: ${txToSend.to}`);
  console.log(`  data: ${txToSend.data ? `${txToSend.data.length} chars` : 'MISSING'}`);
  console.log(`  data (first 100): ${txToSend.data?.substring(0, 100)}`);
  console.log(`  value: ${txToSend.value}`);
  console.log(`  gasLimit: ${txToSend.gasLimit}`);
  console.log(`  maxFeePerGas: ${txToSend.maxFeePerGas}`);
  console.log(`  maxPriorityFeePerGas: ${txToSend.maxPriorityFeePerGas}`);
  console.log(`  type: ${txToSend.type}`);
  console.log(`  chainId: ${txToSend.chainId}`);
  console.log(`  nonce: ${txToSend.nonce}`);
  console.log();

  // Test signing
  console.log('Testing transaction signing...');
  try {
    const signedTx = await publicWallet.signTransaction(txToSend);
    console.log('✅ Transaction signed successfully');
    console.log(`   Signed tx length: ${signedTx.length} bytes`);
    console.log(`   First 200 chars: ${signedTx.substring(0, 200)}`);
    console.log();

    // Parse signed transaction to verify data is still there
    const parsedTx = ethers.Transaction.from(signedTx);
    console.log('Parsed signed transaction:');
    console.log(`  to: ${parsedTx.to}`);
    console.log(`  data: ${parsedTx.data ? `${parsedTx.data.length} chars` : 'MISSING'}`);
    console.log(`  data (first 100): ${parsedTx.data?.substring(0, 100)}`);
    console.log();

    if (!parsedTx.data || parsedTx.data === '0x') {
      console.log('❌ CRITICAL: Data disappeared during signing!');
    } else {
      console.log('✅ Data preserved through signing process');
    }
  } catch (error) {
    console.error('❌ Signing failed:', error);
  }

  console.log();
  console.log('='.repeat(70));
  console.log('✅ TRANSACTION DATA DIAGNOSTIC COMPLETE');
  console.log('='.repeat(70));
  console.log();

  console.log('RECOMMENDATION:');
  if (txFinal.data && txFinal.data.length > 100) {
    console.log('Transaction data is being generated correctly.');
    console.log('The issue is likely in how we call wallet.sendTransaction().');
    console.log();
    console.log('Next steps:');
    console.log('1. Check if ethers.Wallet expects different transaction format');
    console.log('2. Try sending with provider.broadcastTransaction() instead');
    console.log('3. Review RAILGUN cookbook examples for correct submission');
  } else {
    console.log('Transaction data is NOT being generated.');
    console.log('The issue is in proof generation or transaction population.');
    console.log();
    console.log('Next steps:');
    console.log('1. Check RAILGUN SDK version compatibility');
    console.log('2. Verify all required inputs are provided');
    console.log('3. Review SDK documentation for changes');
  }

  console.log();
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Diagnostic failed:', error);
  process.exit(1);
});
