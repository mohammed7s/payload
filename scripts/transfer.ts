/**
 * RAILGUN Private Transfer Script
 *
 * Transfers shielded tokens privately between RAILGUN wallets.
 *
 * Prerequisites:
 * 1. Run shield.ts first to shield tokens
 * 2. Wait 1 hour for POI validation
 * 3. Then run this script
 *
 * Run with: bun run src/transfer.ts
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import {
  createRailgunWallet,
  loadProvider,
  setLoggers,
  balanceForERC20Token,
  startRailgunEngine,
  ArtifactStore,
  walletForID,
  populateProvedTransfer,
  generateTransferProof,
  getProver,
  SnarkJSGroth16,
  getTXOsReceivedPOIStatusInfoForWallet,
  refreshReceivePOIsForWallet,
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

// Configuration
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
  console.log('🔒 RAILGUN PRIVATE TRANSFER');
  console.log('='.repeat(70));
  console.log();

  // Step 1: Initialize RAILGUN Engine
  console.log('🚀 STEP 1: Initializing RAILGUN Engine...\n');

  setLoggers(
    (msg) => console.log(`[RAILGUN] ${msg}`),
    (error) => console.error(`[RAILGUN ERROR]`, error)
  );

  const db = leveldown('./db');
  const artifactStore = new ArtifactStore(
    fs.promises.readFile,
    async (dir, path, data) => {
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(path, data);
    },
    fileExists,
  );

  await startRailgunEngine(
    'transfer',
    db,
    true,
    artifactStore,
    false,
    false,
    ['https://ppoi-agg.horsewithsixlegs.xyz'],
    [],
  );

  console.log('✅ RAILGUN Engine initialized\n');

  // Setup snarkjs prover
  console.log('🔧 Setting up snarkjs prover...');
  const prover = getProver();
  prover.setSnarkJSGroth16(groth16 as SnarkJSGroth16);
  console.log('✅ Prover configured\n');

  // Step 2: Setup provider
  console.log('🌐 STEP 2: Setting up network provider...\n');

  const chainId = NETWORK_CONFIG[NETWORK_NAME].chain.id;
  const fallbackProviderConfig: FallbackProviderJsonConfig = {
    chainId,
    providers: [
      {
        provider: RPC_URL,
        priority: 1,
        weight: 2,
      },
    ],
  };

  const pollingInterval = 10000;
  await loadProvider(fallbackProviderConfig, NETWORK_NAME, pollingInterval);

  console.log('✅ Provider connected to', NETWORK_NAME, '\n');

  // Step 3: Load RAILGUN wallets
  console.log('🔐 STEP 3: Loading RAILGUN wallets...\n');

  const encryptionKey = '0101010101010101010101010101010101010101010101010101010101010101';

  // Load employer wallet
  const employerWallet = await createRailgunWallet(
    encryptionKey,
    EMPLOYER_MNEMONIC,
    {},
  );

  console.log('✅ Employer wallet loaded:');
  console.log(`   ID: ${employerWallet.id.substring(0, 20)}...`);
  console.log(`   Address: ${employerWallet.railgunAddress.substring(0, 45)}...\n`);

  // Create employee wallet for testing
  // TODO: In production, employee provides their own 0zk address
  const employeeMnemonic = 'test test test test test test test test test test test junk';
  const employeeWallet = await createRailgunWallet(
    encryptionKey,
    employeeMnemonic,
    {},
  );

  console.log('✅ Employee wallet (test):');
  console.log(`   Address: ${employeeWallet.railgunAddress}\n`);

  // Step 4: Check balances and POI status
  console.log('📊 STEP 4: Checking balances and POI status...\n');

  const employerWalletObj = walletForID(employerWallet.id);
  const txidVersion = TXIDVersion.V2_PoseidonMerkle;

  const spendableBalance = await balanceForERC20Token(
    txidVersion,
    employerWalletObj,
    NETWORK_NAME,
    TOKEN_ADDRESS,
    true, // onlySpendable
  );

  const totalBalance = await balanceForERC20Token(
    txidVersion,
    employerWalletObj,
    NETWORK_NAME,
    TOKEN_ADDRESS,
    false, // all balance
  );

  const decimals = 6; // USDC
  console.log('Current Balance:');
  console.log(`   Total shielded: ${ethers.formatUnits(totalBalance, decimals)} USDC`);
  console.log(`   Spendable (POI validated): ${ethers.formatUnits(spendableBalance, decimals)} USDC`);
  console.log(`   Pending POI: ${ethers.formatUnits(totalBalance - spendableBalance, decimals)} USDC\n`);

  if (spendableBalance === 0n) {
    console.log('❌ ERROR: No spendable balance!');
    console.log();

    if (totalBalance > 0n) {
      console.log('You have shielded funds, but they are still in POI validation.');
      console.log('Wait 1 hour after your most recent shield, then try again.');
    } else {
      console.log('No shielded funds found. Run shield.ts first to shield tokens.');
    }

    console.log();
    process.exit(1);
  }

  // Step 4.5: Refresh POI proofs
  console.log('🔄 Refreshing POI proofs from aggregator...');
  try {
    await refreshReceivePOIsForWallet(
      txidVersion,
      NETWORK_NAME,
      employerWallet.id
    );
    console.log('✅ POI proofs refreshed\n');
  } catch (error) {
    console.warn('⚠️  POI refresh failed (continuing anyway):', error);
  }

  // Check POI status
  const poiStatus = await getTXOsReceivedPOIStatusInfoForWallet(
    txidVersion,
    NETWORK_NAME,
    employerWallet.id
  );

  let validUTXOs = 0;
  for (const utxo of poiStatus) {
    if (utxo.strings.poisPerList) {
      const statuses = Object.values(utxo.strings.poisPerList);
      if (statuses.every(s => s === 'Valid')) {
        validUTXOs++;
      }
    }
  }

  console.log(`POI Status: ${validUTXOs}/${poiStatus.length} UTXOs have valid POI proofs\n`);

  // Step 5: Prepare transfer
  console.log('💸 STEP 5: Preparing private transfer...\n');

  const amount = 100000n; // 0.1 USDC
  console.log(`Transferring ${ethers.formatUnits(amount, decimals)} USDC privately...`);
  console.log(`From: ${employerWallet.railgunAddress.substring(0, 45)}...`);
  console.log(`To:   ${employeeWallet.railgunAddress.substring(0, 45)}...\n`);

  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: TOKEN_ADDRESS,
      amount,
      recipientAddress: employeeWallet.railgunAddress,
    },
  ];

  // Step 5a: Get gas price FIRST (needed for proof)
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const feeData = await provider.getFeeData();
  const evmGasType = getEVMGasTypeForTransaction(NETWORK_NAME, true);

  // CRITICAL: minGasPrice is part of boundParamsHash in the proof
  const overallBatchMinGasPrice = evmGasType === EVMGasType.Type1
    ? feeData.gasPrice
    : feeData.maxFeePerGas;

  console.log(`📊 Gas Price for Proof:`);
  console.log(`   Type: ${evmGasType === EVMGasType.Type1 ? 'Type1 (legacy)' : 'Type2 (EIP-1559)'}`);
  console.log(`   overallBatchMinGasPrice: ${overallBatchMinGasPrice}\n`);

  // Step 5b: Generate ZK proof
  console.log('🔐 Generating zero-knowledge proof...');
  console.log('   This may take 1-2 minutes...\n');

  await generateTransferProof(
    txidVersion,
    NETWORK_NAME,
    employerWallet.id,
    encryptionKey,
    false, // showSenderAddressToRecipient
    undefined, // memoText
    erc20AmountRecipients,
    [], // nftAmountRecipients
    undefined, // broadcasterFeeERC20AmountRecipient
    true, // sendWithPublicWallet
    overallBatchMinGasPrice,
    (progress: number, status: string) => {
      if (progress === 0 || progress === 0.5 || progress === 1) {
        console.log(`   Progress: ${(progress * 100).toFixed(0)}% - ${status}`);
      }
    },
  );

  console.log('   ✅ Proof generated\n');

  // Step 5c: Populate transaction
  console.log('📝 Preparing transaction...\n');

  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const gasDetails: TransactionGasDetails = {
    evmGasType,
    gasEstimate: 200000n,
    maxFeePerGas: evmGasType === EVMGasType.Type2 ? feeData.maxFeePerGas : undefined,
    maxPriorityFeePerGas: evmGasType === EVMGasType.Type2 ? feeData.maxPriorityFeePerGas : undefined,
    gasPrice: evmGasType === EVMGasType.Type1 ? feeData.gasPrice : undefined,
  };

  const transferResult = await populateProvedTransfer(
    txidVersion,
    NETWORK_NAME,
    employerWallet.id,
    false, // showSenderAddressToRecipient
    undefined, // memoText
    erc20AmountRecipients,
    [], // nftAmountRecipients
    undefined, // broadcasterFeeERC20AmountRecipient
    true, // sendWithPublicWallet
    overallBatchMinGasPrice,
    gasDetails,
  );

  console.log('   ✅ Transaction prepared\n');

  // Step 6: Send transaction
  console.log('📤 STEP 6: Sending private transfer...\n');

  const txToSend: any = {
    to: transferResult.transaction.to,
    data: transferResult.transaction.data,
    value: 0n,
    gasLimit: transferResult.transaction.gasLimit,
    nonce: await wallet.getNonce('latest'),
    type: transferResult.transaction.type,
  };

  // Add gas fields
  if (transferResult.transaction.maxFeePerGas) {
    txToSend.maxFeePerGas = transferResult.transaction.maxFeePerGas;
  }
  if (transferResult.transaction.maxPriorityFeePerGas) {
    txToSend.maxPriorityFeePerGas = transferResult.transaction.maxPriorityFeePerGas;
  }
  if (transferResult.transaction.gasPrice) {
    txToSend.gasPrice = transferResult.transaction.gasPrice;
  }

  console.log('Transaction details:');
  console.log(`   To: ${txToSend.to}`);
  console.log(`   Data length: ${txToSend.data?.length || 0} bytes`);
  console.log(`   Gas limit: ${txToSend.gasLimit}`);
  console.log();

  // Pre-flight check with eth_call
  console.log('🔍 Testing transaction (eth_call pre-flight check)...');
  try {
    await provider.call({
      to: txToSend.to,
      data: txToSend.data,
      from: wallet.address,
    });
    console.log('   ✅ Pre-flight check passed\n');
  } catch (callError: any) {
    console.log('   ❌ Pre-flight check FAILED:', callError.message);
    console.log('   Transaction will likely revert if sent.');
    console.log();
    process.exit(1);
  }

  const tx = await wallet.sendTransaction(txToSend);
  console.log(`   Transaction hash: ${tx.hash}`);
  console.log('   ⏳ Waiting for confirmation...\n');

  const receipt = await tx.wait();

  if (receipt?.status === 1) {
    console.log('   ✅ Transfer confirmed in block:', receipt.blockNumber);
    console.log('\n🎉 PRIVATE TRANSFER SUCCESSFUL!\n');
    console.log('='.repeat(70));
    console.log('✅ TRANSFER COMPLETE');
    console.log('='.repeat(70));
    console.log();
  } else {
    console.log('   ❌ Transaction reverted');
    console.log();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Transfer failed:', error);
  console.log();
  process.exit(1);
});
