/**
 * RAILGUN Simple Shield & Balance Test
 *
 * This script demonstrates:
 * 1. Starting the RAILGUN privacy engine
 * 2. Creating a RAILGUN wallet (0zk address)
 * 3. Shielding ERC-20 tokens from a public Ethereum wallet
 * 4. Checking the private balance
 * 5. Performing a private transfer between RAILGUN wallets
 *
 * Run with: bun run src/test-shield.ts
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
  gasEstimateForShield,
  populateShield,
  getRandomBytes,
  walletForID,
  getEngine,
  gasEstimateForUnprovenTransfer,
  populateProvedTransfer,
  generateTransferProof,
  getProver,
  SnarkJSGroth16,
  refreshReceivePOIsForWallet,
  getTXOsReceivedPOIStatusInfoForWallet,
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
import { setTokenBalance } from './utils/set-token-balance';

// ============================================================================
// CONFIGURATION
// ============================================================================

const NETWORK_NAME: NetworkName = NetworkName.EthereumSepolia;
const CHAIN_ID = 11155111; // Sepolia testnet

// Check environment variables
if (!process.env.ETHEREUM_RPC_URL) {
  throw new Error('ETHEREUM_RPC_URL not set in .env file');
}
if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY not set in .env file');
}
if (!process.env.TEST_TOKEN_ADDRESS) {
  throw new Error('TEST_TOKEN_ADDRESS not set in .env file');
}

const RPC_URL = process.env.ETHEREUM_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TOKEN_ADDRESS = process.env.TEST_TOKEN_ADDRESS;

// Amount to shield (e.g., "1000000" for 1 USDC with 6 decimals)
const SHIELD_AMOUNT = process.env.SHIELD_AMOUNT || '1000000'; // 1 USDC

// ============================================================================
// STEP 0: SETUP TOKEN BALANCE ON FORKED NETWORK
// ============================================================================

async function setupTokenBalance(): Promise<void> {
  console.log('\n⚙️  STEP 0: Setting up token balance on forked network...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('Public wallet address:', wallet.address);

  const ethBalance = await provider.getBalance(wallet.address);
  console.log('ETH Balance:', ethers.formatEther(ethBalance), 'ETH');

  if (ethBalance === 0n) {
    throw new Error('❌ No ETH balance! Check your Anvil configuration.');
  }

  // Setup token balance using storage manipulation
  if (TOKEN_ADDRESS) {
    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESS,
      [
        'function balanceOf(address) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function name() view returns (string)'
      ],
      provider
    );

    try {
      const decimals = await tokenContract.decimals();
      const symbol = await tokenContract.symbol();
      const name = await tokenContract.name();

      console.log(`\n🪙 Token: ${name} (${symbol})`);
      console.log('Token Address:', TOKEN_ADDRESS);

      // Set token balance to 1000 tokens (adjust for decimals)
      const desiredBalance = 1000n * (10n ** BigInt(decimals));
      console.log(`\nSetting token balance to: ${ethers.formatUnits(desiredBalance, decimals)} ${symbol}`);

      await setTokenBalance(provider, wallet.address, TOKEN_ADDRESS, desiredBalance);

      // Verify the balance was set
      const tokenBalance = await tokenContract.balanceOf(wallet.address);
      console.log('✓ Current Token Balance:', ethers.formatUnits(tokenBalance, decimals), symbol);

      console.log('\n✅ Wallet and token ready!\n');
    } catch (error: any) {
      console.error('❌ Could not setup token at:', TOKEN_ADDRESS);
      console.error('Error:', error.message);
      throw new Error('Failed to setup token balance. Make sure you are using a forked network (Anvil/Hardhat).');
    }
  } else {
    throw new Error('TEST_TOKEN_ADDRESS not set in .env file');
  }
}

// ============================================================================
// STEP 1: INITIALIZE RAILGUN ENGINE
// ============================================================================

const fileExists = (path: string): Promise<boolean> => {
  return new Promise(resolve => {
    fs.promises
      .access(path)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
};

async function initializeEngine(): Promise<void> {
  console.log('\n🚀 STEP 1: Initializing RAILGUN Engine...\n');

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

  try {
    await startRailgunEngine(
      'payroll tests', // wallet source identifier (max 16 chars, no special chars)
      db,
      true, // shouldDebug
      artifactStore,
      false, // useNativeArtifacts
      false,  // skipMerkletreeScans
      ['https://ppoi-agg.horsewithsixlegs.xyz'], // Test POI aggregator node
      [], // customPOILists - empty array for default lists
    );

    console.log('✅ RAILGUN Engine initialized\n');

    // Setup snarkjs prover for zero-knowledge proofs
    console.log('🔧 Setting up snarkjs prover...');
    getProver().setSnarkJSGroth16(groth16 as SnarkJSGroth16);
    console.log('✅ Prover configured\n');

  } catch (error) {
    console.error('❌ Failed to initialize engine:', error);
    throw error;
  }
}

// ============================================================================
// STEP 2: SETUP NETWORK PROVIDER
// ============================================================================

async function setupProvider(): Promise<void> {
  console.log('🌐 STEP 2: Setting up network provider...\n');

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

  // Load provider into RAILGUN
  const pollingInterval = 10000; // 10 seconds
  await loadProvider(fallbackProviderConfig, NETWORK_NAME, pollingInterval);

  console.log('✅ Provider connected to', NETWORK_NAME, '\n');
}

// ============================================================================
// STEP 3: CREATE RAILGUN WALLET
// ============================================================================

async function createWallet(): Promise<{ id: string; address: string }> {
  console.log('🔐 STEP 3: Creating RAILGUN wallet...\n');

  // Encryption key must be 32 bytes (64 hex characters) for AES-256
  // For testing - in production, generate a secure random key
  const encryptionKey = '0101010101010101010101010101010101010101010101010101010101010101';

  // Get mnemonic from env or generate a new one
  let mnemonic = process.env.RAILGUN_WALLET_MNEMONIC;

  if (!mnemonic) {
    // Generate a new random mnemonic
    const wallet = ethers.Wallet.createRandom();
    mnemonic = wallet.mnemonic!.phrase;
    console.log('🎲 Generated new mnemonic phrase:');
    console.log('   ', mnemonic);
    console.log('   ⚠️  Save this securely! Add to .env as RAILGUN_WALLET_MNEMONIC\n');
  }

  try {
    const walletInfo = await createRailgunWallet(
      encryptionKey,
      mnemonic,
      {} // creationBlockNumbers - empty object means start from current block
    );

    console.log('✅ RAILGUN Wallet Created:');
    console.log('   ID:', walletInfo.id);
    console.log('   Address (0zk):', walletInfo.railgunAddress);
    console.log();

    return {
      id: walletInfo.id,
      address: walletInfo.railgunAddress,
    };
  } catch (error) {
    console.error('❌ Failed to create wallet:', error);
    throw error;
  }
}

// ============================================================================
// STEP 3B: CREATE EMPLOYEE RAILGUN WALLET
// ============================================================================

async function createEmployeeWallet(): Promise<{ id: string; address: string }> {
  console.log('👤 STEP 3B: Creating employee RAILGUN wallet...\n');

  const encryptionKey = '0101010101010101010101010101010101010101010101010101010101010101';

  // Generate a new random mnemonic for employee
  const wallet = ethers.Wallet.createRandom();
  const mnemonic = wallet.mnemonic!.phrase;

  console.log('🎲 Generated employee mnemonic:');
  console.log('   ', mnemonic);
  console.log('   (For testing only - in production, employee provides their own wallet)\n');

  try {
    const walletInfo = await createRailgunWallet(
      encryptionKey,
      mnemonic,
      {} // creationBlockNumbers
    );

    console.log('✅ Employee RAILGUN Wallet Created:');
    console.log('   ID:', walletInfo.id);
    console.log('   Address (0zk):', walletInfo.railgunAddress);
    console.log();

    return {
      id: walletInfo.id,
      address: walletInfo.railgunAddress,
    };
  } catch (error) {
    console.error('❌ Failed to create employee wallet:', error);
    throw error;
  }
}

// ============================================================================
// STEP 4: SHIELD TOKENS
// ============================================================================

async function shieldTokens(railgunAddress: string): Promise<void> {
  console.log('🛡️  STEP 4: Shielding tokens...\n');

  const txidVersion = TXIDVersion.V2_PoseidonMerkle; // Using V2

  // Setup ethers wallet and provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('Public wallet address:', wallet.address);
  console.log('Shielding to RAILGUN address:', railgunAddress);
  console.log('Token:', TOKEN_ADDRESS);
  console.log('Amount:', SHIELD_AMOUNT, '\n');

  // Generate random shield private key (32 bytes)
  const shieldPrivateKey = getRandomBytes(32);

  // Define what we're shielding
  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: TOKEN_ADDRESS,
      amount: BigInt(SHIELD_AMOUNT), // Use BigInt, not amountString
      recipientAddress: railgunAddress,
    },
  ];

  // NFT recipients (empty for now)
  const nftAmountRecipients: any[] = [];

  try {
    // Check token balance first
    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESS,
      ['function balanceOf(address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'],
      wallet
    );

    const balance = await tokenContract.balanceOf(wallet.address);
    console.log(`📊 Current token balance: ${balance.toString()}`);

    if (balance < BigInt(SHIELD_AMOUNT)) {
      throw new Error(`Insufficient token balance. Need ${SHIELD_AMOUNT}, have ${balance.toString()}`);
    }

    // Step 4a: Populate shield transaction first to get the actual contract address
    console.log('📝 Preparing shield transaction...');

    const shieldResult = await populateShield(
      txidVersion,
      NETWORK_NAME,
      shieldPrivateKey,
      erc20AmountRecipients,
      nftAmountRecipients,
      // No gas details - let ethers estimate it automatically
    );

    console.log('   Transaction data prepared');
    console.log('   Shield contract:', shieldResult.transaction.to, '\n');

    // Step 4b: Approve tokens to the ACTUAL shield contract
    const shieldContractAddress = shieldResult.transaction.to!;
    console.log('💰 Approving token spending for shield contract...');
    console.log('   Contract address:', shieldContractAddress);
    console.log('   Amount:', SHIELD_AMOUNT, '\n');

    const approveTx = await tokenContract.approve(shieldContractAddress, SHIELD_AMOUNT);
    console.log('   Approval tx:', approveTx.hash);
    await approveTx.wait();
    console.log('   ✅ Approval confirmed\n');

    // Step 4c: Send shield transaction directly (cookbook approach)
    console.log('\n📤 Sending shield transaction...');

    const tx = await wallet.sendTransaction(shieldResult.transaction);

    console.log('   Transaction hash:', tx.hash);
    console.log('   ⏳ Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('   ✅ Shield transaction confirmed in block:', receipt?.blockNumber);
    console.log('\n🎉 Tokens successfully shielded!\n');

    // Wait a few seconds for the engine to process the new shield
    console.log('⏳ Waiting for RAILGUN engine to process the new shield...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

    // Check total balance (including non-spendable)
    const walletObj = walletForID(employerWalletId);
    const totalBalance = await balanceForERC20Token(
      TXIDVersion.V2_PoseidonMerkle,
      walletObj,
      NETWORK_NAME,
      TOKEN_ADDRESS,
      false, // onlySpendable - FALSE to see all funds including pending POI
    );

    console.log('\n📊 New Shield Summary:');
    console.log('='.repeat(60));
    console.log(`   Token: ${TOKEN_ADDRESS}`);
    console.log(`   Total shielded (including pending): ${(Number(totalBalance) / 1000000).toFixed(6)} USDC`);
    console.log(`   Status: Pending POI validation`);
    console.log('='.repeat(60));
    console.log();

  } catch (error) {
    console.error('❌ Failed to shield tokens:', error);
    throw error;
  }
}

// ============================================================================
// STEP 5: CHECK PRIVATE BALANCE
// ============================================================================

async function checkBalance(walletId: string): Promise<void> {
  console.log('💰 STEP 5: Checking private balance...\n');

  try {
    console.log('🔄 Scanning contract history...');
    console.log('   This will scan the merkletree for all RAILGUN transactions.\n');

    const { chain } = NETWORK_CONFIG[NETWORK_NAME];
    const engine = getEngine();

    // Trigger contract history scan for this specific wallet
    await engine.scanContractHistory(
      chain,
      [walletId], // Only scan for our wallet ID
    );

    console.log('   ✅ Contract history scan triggered\n');

    console.log('⏳ Waiting for balance to appear...');
    console.log('   Polling for up to 2 minutes...\n');

    const wallet = walletForID(walletId);
    const txidVersion = TXIDVersion.V2_PoseidonMerkle;

    // Poll for balance (wait up to 2 minutes)
    let balance = 0n;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 2 seconds = 120 seconds

    while (balance === 0n && attempts < maxAttempts) {
      attempts++;

      balance = await balanceForERC20Token(
        txidVersion,
        wallet,
        NETWORK_NAME,
        TOKEN_ADDRESS,
        true, // onlySpendable - TRUE to only use funds past POI validation period
      );

      if (balance > 0n) {
        break;
      }

      if (attempts % 5 === 0) {
        console.log(`   Attempt ${attempts}/${maxAttempts}... Balance: ${balance}`);
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n📊 Private Balance (Spendable - Past POI 1-hour period):');
    console.log('='.repeat(60));
    console.log(`   Token: ${TOKEN_ADDRESS}`);
    console.log(`   Balance (raw): ${balance.toString()}`);

    // Convert to human-readable format (assuming 6 decimals for USDC)
    const balanceFormatted = Number(balance) / 1000000;
    console.log(`   Balance (USDC): ${balanceFormatted} USDC`);
    console.log('='.repeat(60));
    console.log();

    if (balance === 0n) {
      console.log('⚠️  Spendable balance is 0.');
      console.log('   This means your funds need POI (Proof of Innocence) validation.');
      console.log('   On testnet, POI validation may take time or may not be available.');
      console.log('   Your tokens ARE shielded, but cannot be spent yet without POI.');
    } else {
      console.log('✅ Funds are spendable - POI validation complete!');
    }

  } catch (error) {
    console.error('❌ Failed to check balance:', error);
    throw error;
  }
}

// ============================================================================
// STEP 6: PRIVATE TRANSFER (EMPLOYER → EMPLOYEE)
// ============================================================================

async function privateTransfer(
  employerWalletId: string,
  employeeAddress: string,
  amount: string
): Promise<void> {
  console.log('💸 STEP 6: Private transfer (employer → employee)...\n');

  try {
    const txidVersion = TXIDVersion.V2_PoseidonMerkle;
    const encryptionKey = '0101010101010101010101010101010101010101010101010101010101010101';

    console.log(`Transferring ${Number(amount) / 1000000} USDC privately...`);
    console.log(`From: Employer wallet ${employerWalletId.substring(0, 16)}...`);
    console.log(`To: ${employeeAddress.substring(0, 40)}...\n`);

    // Define the transfer amount and recipient
    const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
      {
        tokenAddress: TOKEN_ADDRESS,
        amount: BigInt(amount),
        recipientAddress: employeeAddress,
      },
    ];

    // Step 6a: Get gas price FIRST (needed for proof generation)
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const feeData = await provider.getFeeData();
    const evmGasType = getEVMGasTypeForTransaction(NETWORK_NAME, true);

    // CRITICAL: When sendWithPublicWallet=true, the proof still needs to know the gas price
    // because minGasPrice is part of boundParamsHash
    const overallBatchMinGasPrice = evmGasType === EVMGasType.Type1
      ? feeData.gasPrice
      : feeData.maxFeePerGas;

    console.log(`\n📊 Gas Price for Proof:`);
    console.log(`   Gas Type: ${evmGasType === EVMGasType.Type1 ? 'Type1 (legacy)' : 'Type2 (EIP-1559)'}`);
    console.log(`   overallBatchMinGasPrice: ${overallBatchMinGasPrice}\n`);

    // Step 6b: Generate proof for the transfer
    console.log('🔐 Generating zero-knowledge proof...');
    console.log('   This proves you have the funds without revealing the amount\n');

    await generateTransferProof(
      txidVersion,
      NETWORK_NAME,
      employerWalletId,
      encryptionKey,
      false, // showSenderAddressToRecipient
      undefined, // memoText
      erc20AmountRecipients,
      [], // nftAmountRecipients
      undefined, // broadcasterFeeERC20AmountRecipient
      true, // sendWithPublicWallet - TRUE = we (public EOA) will sign and send this tx
      overallBatchMinGasPrice, // MUST match the actual gas price that will be used!
      (progress: number, status: string) => {
        console.log(`   Progress: ${(progress * 100).toFixed(1)}% - ${status}`);
      },
    );

    console.log('   ✅ Proof generated\n');

    // Debug: Check what's in the proof cache
    console.log('🔍 Debugging proof details...');
    const proofCache = await import('@railgun-community/wallet').then(m => m as any);
    console.log('   Proof cache keys available:', Object.keys(proofCache).filter(k => k.includes('proof') || k.includes('Proof')));
    console.log();

    // Step 6c: Populate the proved transfer transaction
    console.log('📝 Preparing transfer transaction...');

    const { chain } = NETWORK_CONFIG[NETWORK_NAME];
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const gasDetails: TransactionGasDetails = {
      evmGasType,
      gasEstimate: 200000n, // Estimate for transfer
      maxFeePerGas: evmGasType === EVMGasType.Type2 ? feeData.maxFeePerGas : undefined,
      maxPriorityFeePerGas: evmGasType === EVMGasType.Type2 ? feeData.maxPriorityFeePerGas : undefined,
      gasPrice: evmGasType === EVMGasType.Type1 ? feeData.gasPrice : undefined,
    };

    const transferResult = await populateProvedTransfer(
      txidVersion,
      NETWORK_NAME,
      employerWalletId,
      false, // showSenderAddressToRecipient
      undefined, // memoText
      erc20AmountRecipients,
      [], // nftAmountRecipients
      undefined, // broadcasterFeeERC20AmountRecipient
      true, // sendWithPublicWallet - TRUE = we (public EOA) will sign and send this tx
      overallBatchMinGasPrice, // MUST match what was used in proof generation!
      gasDetails,
    );

    console.log('   Transaction prepared\n');

    // Debug: Check transaction data
    console.log('   Transaction to:', transferResult.transaction.to);
    console.log('   Transaction data length:', transferResult.transaction.data?.length || 0);
    console.log('   Transaction object keys:', Object.keys(transferResult.transaction));

    // Step 6c: Send the transaction
    console.log('📤 Sending private transfer...');

    // Set nonce explicitly
    transferResult.transaction.nonce = await wallet.getNonce('latest');

    // Ensure all required fields are present and remove undefined fields
    const txToSend: any = {
      to: transferResult.transaction.to,
      data: transferResult.transaction.data,
      value: 0n,
      gasLimit: transferResult.transaction.gasLimit,
      nonce: transferResult.transaction.nonce,
      type: transferResult.transaction.type,
    };

    // Add Type 2 (EIP-1559) gas fields if present
    if (transferResult.transaction.maxFeePerGas) {
      txToSend.maxFeePerGas = transferResult.transaction.maxFeePerGas;
    }
    if (transferResult.transaction.maxPriorityFeePerGas) {
      txToSend.maxPriorityFeePerGas = transferResult.transaction.maxPriorityFeePerGas;
    }
    // Add Type 1 (legacy) gas field if present
    if (transferResult.transaction.gasPrice) {
      txToSend.gasPrice = transferResult.transaction.gasPrice;
    }

    console.log('   Final tx data length:', txToSend.data?.length || 0);
    console.log('   Final tx from:', txToSend.from);
    console.log('   Final tx to:', txToSend.to);
    console.log('   Final tx type:', txToSend.type);
    console.log('   Final tx gasPrice:', txToSend.gasPrice);
    console.log('   Final tx gasLimit:', txToSend.gasLimit);
    console.log('   Final tx nonce:', txToSend.nonce);
    console.log('   All tx fields:', Object.keys(txToSend));
    console.log('   Data starts with:', txToSend.data?.substring(0, 66));

    // Try to get better error info by calling the contract directly first
    console.log('\n🔍 Testing transaction call (eth_call) before sending...');
    try {
      await provider.call({
        to: txToSend.to,
        data: txToSend.data,
        from: txToSend.from,
      });
      console.log('   ✅ eth_call succeeded - transaction should work');
    } catch (callError: any) {
      console.log('   ❌ eth_call failed:', callError.message);
      console.log('   This indicates the transaction will revert');
      if (callError.data) {
        console.log('   Revert data:', callError.data);
      }
    }

    const tx = await wallet.sendTransaction(txToSend);
    console.log('   Transaction hash:', tx.hash);
    console.log('   ⏳ Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('   ✅ Transfer confirmed in block:', receipt?.blockNumber);
    console.log('\n🎉 Private transfer successful!\n');

  } catch (error) {
    console.error('❌ Failed to execute private transfer:', error);
    throw error;
  }
}

// ============================================================================
// MAIN TEST FLOW
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔒 RAILGUN PRIVATE PAYROLL TEST');
  console.log('='.repeat(70));

  try {
    // Step 0: Skipped on testnet (use real tokens)
    // await setupTokenBalance(); // Only for local fork

    // Step 1: Initialize RAILGUN engine
    await initializeEngine();

    // Step 2: Setup network provider
    await setupProvider();

    // Step 3: Create employer RAILGUN wallet
    const employerWallet = await createWallet();

    // Step 3B: Create employee RAILGUN wallet
    const employeeWallet = await createEmployeeWallet();

    // Step 4: Check if we already have spendable balance
    console.log('\n📊 Checking for existing spendable balance...');

    // Get the actual wallet object for balance check
    const employerWalletObj = walletForID(employerWallet.id);

    // Check both spendable and total balance for comparison
    const spendableBalance = await balanceForERC20Token(
      TXIDVersion.V2_PoseidonMerkle,
      employerWalletObj,
      NETWORK_NAME,
      TOKEN_ADDRESS,
      true, // onlySpendable
    );

    const totalBalance = await balanceForERC20Token(
      TXIDVersion.V2_PoseidonMerkle,
      employerWalletObj,
      NETWORK_NAME,
      TOKEN_ADDRESS,
      false, // all balance, not just spendable
    );

    const decimals = 6; // USDC has 6 decimals
    console.log(`   Total shielded balance: ${ethers.formatUnits(totalBalance, decimals)} USDC`);
    console.log(`   Spendable balance (POI validated): ${ethers.formatUnits(spendableBalance, decimals)} USDC`);
    console.log(`   Non-spendable (pending POI): ${ethers.formatUnits(totalBalance - spendableBalance, decimals)} USDC`);

    if (spendableBalance === 0n) {
      console.log('\n⚠️  No spendable balance found.');

      if (totalBalance > 0n) {
        console.log('   You have shielded funds, but they are still in POI validation period.');
        console.log('   Wait 1 hour after shielding, then try again.');
        console.log('\n⏰ IMPORTANT: The 1-hour POI validation countdown starts from your MOST RECENT shield.');
        console.log('   Even old shields may not be spendable if POI aggregator lacks historical proofs.');
        console.log();
        process.exit(0);
      } else {
        console.log('   No shielded funds found. Need to shield tokens first.');
        console.log('   (Note: After shielding, wait 1 hour for POI validation before transfers)\n');

        // Step 4: Shield tokens to employer wallet
        await shieldTokens(employerWallet.address);

        console.log('\n⏰ IMPORTANT: Shielded funds require 1-hour POI validation period.');
        console.log('   Please run this script again in 1 hour to test the transfer.');
        console.log();
        process.exit(0);
      }
    } else {
      console.log('   ✅ Using existing spendable balance (past POI validation period)\n');
      console.log('   Skipping shield step...\n');
    }

    console.log('='.repeat(70));
    console.log('✅ STEPS 0-4 COMPLETED');
    console.log('='.repeat(70));
    console.log();

    // Step 4.5: Refresh POI proofs for old shields
    console.log('🔄 STEP 4.5: Refreshing POI proofs for historical shields...\n');
    try {
      console.log('   Checking current POI status of received UTXOs...');
      const poiStatusBefore = await getTXOsReceivedPOIStatusInfoForWallet(
        TXIDVersion.V2_PoseidonMerkle,
        NETWORK_NAME,
        employerWallet.id
      );
      console.log(`   Found ${poiStatusBefore.length} received UTXOs`);

      console.log('   Requesting POI proofs from aggregator for all shields...');
      await refreshReceivePOIsForWallet(
        TXIDVersion.V2_PoseidonMerkle,
        NETWORK_NAME,
        employerWallet.id
      );
      console.log('   ✅ POI refresh complete\n');

      console.log('   Checking updated POI status...');
      const poiStatusAfter = await getTXOsReceivedPOIStatusInfoForWallet(
        TXIDVersion.V2_PoseidonMerkle,
        NETWORK_NAME,
        employerWallet.id
      );

      console.log('\n   UTXO POI Status Details:');
      console.log('   ' + '='.repeat(66));
      poiStatusAfter.forEach((utxo, idx) => {
        console.log(`   UTXO ${idx + 1}:`);
        console.log(`     TxID: ${utxo.strings.txid.substring(0, 20)}...`);
        console.log(`     Tree Position: ${utxo.strings.tree}:${utxo.strings.position}`);
        console.log(`     Blinded Commitment: ${utxo.strings.blindedCommitment.substring(0, 20)}...`);
        console.log(`     POI Status:`, JSON.stringify(utxo.strings.poisPerList, null, 2).split('\n').join('\n     '));
        console.log('');
      });
      console.log('   ' + '='.repeat(66));
      console.log();
    } catch (err) {
      console.log('   ⚠️  POI refresh failed:', err);
      console.log('   Continuing anyway...\n');
    }

    // Step 5: Check employer balance
    await checkBalance(employerWallet.id);

    // Step 6: Private transfer from employer to employee (0.1 USDC)
    await privateTransfer(employerWallet.id, employeeWallet.address, '100000');

    // Step 7: Check employee balance
    console.log('💰 STEP 7: Checking employee balance...\n');
    await checkBalance(employeeWallet.id);

    console.log('='.repeat(70));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log();

    // Exit cleanly
    process.exit(0);

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(70));
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main();
