/**
 * RAILGUN Service for Node.js Backend
 *
 * This service handles all RAILGUN operations on the server side
 * where we have native bindings and more memory available.
 */

import {
  startRailgunEngine,
  createRailgunWallet,
  loadProvider,
  setLoggers,
  getProver,
  populateShield,
  getRandomBytes,
  walletForID,
  balanceForERC20Token,
  refreshReceivePOIsForWallet,
  getEngine,
} from '@railgun-community/wallet';

import {
  NetworkName,
  NETWORK_CONFIG,
  FallbackProviderJsonConfig,
  TXIDVersion,
  RailgunERC20AmountRecipient,
} from '@railgun-community/shared-models';

import { groth16 } from 'snarkjs';
import leveldown from 'leveldown';
import fs from 'fs';
import path from 'path';
import { prisma } from './db';

const WALLET_DB_PATH = path.join(__dirname, '../data/railgun-wallet.db');
const ARTIFACTS_PATH = path.join(__dirname, '../artifacts');

class RailgunBackendService {
  private engineInitialized = false;
  private networkName = NetworkName.EthereumSepolia;

  /**
   * Initialize RAILGUN engine (call once on server start)
   */
  async initEngine(): Promise<void> {
    if (this.engineInitialized) {
      console.log('⚠️  RAILGUN engine already initialized');
      return;
    }

    console.log('🚀 Initializing RAILGUN engine...');

    // Setup logging
    setLoggers(
      (msg) => console.log(`[RAILGUN] ${msg}`),
      (error) => console.error(`[RAILGUN ERROR]`, error)
    );

    // Ensure directories exist
    const dataDir = path.dirname(WALLET_DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(ARTIFACTS_PATH)) {
      fs.mkdirSync(ARTIFACTS_PATH, { recursive: true });
    }

    // Create leveldown database
    const db = leveldown(WALLET_DB_PATH);

    // Create artifact store
    const artifactStore = {
      readFile: async (filePath: string) => {
        const fullPath = path.join(ARTIFACTS_PATH, filePath);
        if (fs.existsSync(fullPath)) {
          return fs.promises.readFile(fullPath);
        }
        return Buffer.from('');
      },
      writeFile: async (dir: string, filePath: string, data: Buffer) => {
        const fullDir = path.join(ARTIFACTS_PATH, dir);
        if (!fs.existsSync(fullDir)) {
          fs.mkdirSync(fullDir, { recursive: true });
        }
        const fullPath = path.join(fullDir, filePath);
        await fs.promises.writeFile(fullPath, data);
      },
      fileExists: async (filePath: string) => {
        const fullPath = path.join(ARTIFACTS_PATH, filePath);
        return fs.existsSync(fullPath);
      },
    };

    // Start RAILGUN engine
    await startRailgunEngine(
      'payrollapi', // Must be <16 chars, alphanumeric only
      db as any,
      true, // shouldDebug
      artifactStore as any,
      false, // useNativeArtifacts
      false, // skipMerkletreeScans
      ['https://ppoi-agg.horsewithsixlegs.xyz'], // POI aggregator
      [], // customPOILists
    );

    console.log('✅ RAILGUN engine started');

    // Setup snarkjs prover
    getProver().setSnarkJSGroth16(groth16 as any);
    console.log('✅ Snarkjs prover configured');

    this.engineInitialized = true;
    console.log('✅ RAILGUN engine fully initialized');
  }

  /**
   * Setup network provider
   */
  async setupProvider(rpcUrl: string): Promise<void> {
    console.log('🌐 Setting up network provider...');

    const chainId = NETWORK_CONFIG[this.networkName].chain.id;

    const fallbackProviderConfig: FallbackProviderJsonConfig = {
      chainId,
      providers: [
        {
          provider: rpcUrl,
          priority: 1,
          weight: 2,
        },
      ],
    };

    await loadProvider(fallbackProviderConfig, this.networkName, 10000);
    console.log('✅ Provider connected');

    // Automatically trigger blockchain scan to find historical UTXOs
    console.log('🔍 Triggering blockchain scan for historical UTXOs...');
    const { chain } = NETWORK_CONFIG[this.networkName];
    getEngine().scanContractHistory(
      chain,
      undefined, // walletIdFilter - scan all wallets
    );
    console.log('✅ Blockchain scan triggered (running in background)');
  }

  /**
   * Create a new RAILGUN wallet for a user
   */
  async createWalletForUser(
    userId: string,
    ethereumAddress: string,
    password: string
  ): Promise<{
    railgunWalletId: string;
    railgunAddress: string;
    mnemonic: string;
  }> {
    if (!this.engineInitialized) {
      throw new Error('RAILGUN engine not initialized');
    }

    console.log(`🔐 Creating RAILGUN wallet for user ${userId}...`);

    // Check if user already has a wallet (by ID or Ethereum address)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { ethereumAddress: ethereumAddress }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User already has a RAILGUN wallet');
    }

    // Generate encryption key from password
    const encryptionKey = this.deriveEncryptionKey(password);

    // Generate mnemonic
    const { Wallet } = await import('ethers');
    const ethersWallet = Wallet.createRandom();
    const mnemonic = ethersWallet.mnemonic!.phrase;

    // Create RAILGUN wallet
    const walletInfo = await createRailgunWallet(
      encryptionKey,
      mnemonic,
      undefined, // creationBlockNumbers
    );

    // Encrypt mnemonic for storage (simple base64 for now, use proper encryption in production)
    const encryptedMnemonic = Buffer.from(mnemonic).toString('base64');

    // Store wallet info in database
    await prisma.user.create({
      data: {
        id: userId,
        ethereumAddress,
        railgunWalletId: walletInfo.id,
        railgunAddress: walletInfo.railgunAddress,
        encryptionKey,
        encryptedMnemonic,
      }
    });

    console.log(`✅ RAILGUN wallet created for user ${userId}: ${walletInfo.railgunAddress}`);

    return {
      railgunWalletId: walletInfo.id,
      railgunAddress: walletInfo.railgunAddress,
      mnemonic, // Return to user ONCE (they must save it!)
    };
  }

  /**
   * Import existing RAILGUN wallet for a user
   */
  async importWalletForUser(
    userId: string,
    ethereumAddress: string,
    mnemonic: string,
    password: string
  ): Promise<{
    railgunWalletId: string;
    railgunAddress: string;
  }> {
    if (!this.engineInitialized) {
      throw new Error('RAILGUN engine not initialized');
    }

    console.log(`🔐 Importing RAILGUN wallet for user ${userId}...`);

    // Check if user already has a wallet
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { ethereumAddress: ethereumAddress }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User already has a RAILGUN wallet');
    }

    const encryptionKey = this.deriveEncryptionKey(password);

    const walletInfo = await createRailgunWallet(
      encryptionKey,
      mnemonic,
      undefined,
    );

    // Encrypt mnemonic for storage
    const encryptedMnemonic = Buffer.from(mnemonic).toString('base64');

    // Store wallet info in database
    await prisma.user.create({
      data: {
        id: userId,
        ethereumAddress,
        railgunWalletId: walletInfo.id,
        railgunAddress: walletInfo.railgunAddress,
        encryptionKey,
        encryptedMnemonic,
      }
    });

    console.log(`✅ RAILGUN wallet imported for user ${userId}: ${walletInfo.railgunAddress}`);

    return {
      railgunWalletId: walletInfo.id,
      railgunAddress: walletInfo.railgunAddress,
    };
  }

  /**
   * Get user's RAILGUN wallet info by userId
   */
  async getUserWallet(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId }
    });
  }

  /**
   * Get user's RAILGUN wallet info by Ethereum address
   */
  async getUserWalletByAddress(ethereumAddress: string) {
    return await prisma.user.findUnique({
      where: { ethereumAddress }
    });
  }

  /**
   * Check if user has a RAILGUN wallet by userId
   */
  async hasWallet(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    return !!user;
  }

  /**
   * Check if user has a RAILGUN wallet by Ethereum address
   */
  async hasWalletByAddress(ethereumAddress: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { ethereumAddress }
    });
    return !!user;
  }

  /**
   * Generate shield transaction for user
   * This prepares the transaction data - frontend will sign it with MetaMask
   */
  async generateShieldTransaction(
    userId: string,
    tokenAddress: string,
    amount: string, // Amount as string (e.g., "1000000" for 1 USDC with 6 decimals)
  ): Promise<{
    transaction: any;
    shieldPrivateKey: string;
  }> {
    if (!this.engineInitialized) {
      throw new Error('RAILGUN engine not initialized');
    }

    console.log(`🛡️  Generating shield transaction for user ${userId}...`);

    // Get user's RAILGUN wallet from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.railgunAddress) {
      throw new Error('User does not have a RAILGUN wallet');
    }

    const txidVersion = TXIDVersion.V2_PoseidonMerkle;

    // Generate random shield private key (32 bytes)
    const shieldPrivateKey = getRandomBytes(32);

    // Define what we're shielding
    const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
      {
        tokenAddress,
        amount: BigInt(amount),
        recipientAddress: user.railgunAddress,
      },
    ];

    // NFT recipients (empty for now)
    const nftAmountRecipients: any[] = [];

    console.log('   Preparing shield transaction...');
    console.log('   Token:', tokenAddress);
    console.log('   Amount:', amount);
    console.log('   Recipient RAILGUN address:', user.railgunAddress);

    // Populate shield transaction
    const shieldResult = await populateShield(
      txidVersion,
      this.networkName,
      shieldPrivateKey,
      erc20AmountRecipients,
      nftAmountRecipients,
    );

    console.log('✅ Shield transaction prepared');
    console.log('   Shield contract:', shieldResult.transaction.to);

    return {
      transaction: shieldResult.transaction,
      shieldPrivateKey: Buffer.from(shieldPrivateKey).toString('hex'),
    };
  }

  /**
   * Get shielded balance for a specific token
   */
  async getShieldedBalance(
    userId: string,
    tokenAddress: string
  ): Promise<{
    balance: string;
    balanceFormatted: string;
    symbol: string;
  }> {
    if (!this.engineInitialized) {
      throw new Error('RAILGUN engine not initialized');
    }

    console.log(`📊 Getting shielded balance for user ${userId}...`);

    // Get user's RAILGUN wallet from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.railgunWalletId) {
      throw new Error('User does not have a RAILGUN wallet');
    }

    const txidVersion = TXIDVersion.V2_PoseidonMerkle;

    // Auto-refresh POI proofs to get latest validation status
    try {
      await refreshReceivePOIsForWallet(
        txidVersion,
        this.networkName,
        user.railgunWalletId
      );
      console.log('   ✅ POI proofs refreshed');
    } catch (err) {
      console.log('   ⚠️  POI refresh failed (continuing anyway):', err);
    }

    // Get wallet object
    const wallet = walletForID(user.railgunWalletId);

    // Get balance (including non-spendable/pending POI)
    const balance = await balanceForERC20Token(
      txidVersion,
      wallet,
      this.networkName,
      tokenAddress,
      false, // onlySpendable - FALSE to see all funds including pending POI
    );

    // Format balance (assuming 6 decimals for USDC)
    const balanceFormatted = (Number(balance) / 1000000).toFixed(6);

    console.log(`✅ Balance: ${balanceFormatted} USDC`);

    return {
      balance: balance.toString(),
      balanceFormatted,
      symbol: 'USDC', // TODO: Get actual symbol from token contract
    };
  }

  /**
   * Refresh POI (Proof of Innocence) proofs for all UTXOs in wallet
   * This fetches the latest POI data from the aggregator
   */
  async refreshPOIForUser(userId: string): Promise<void> {
    console.log(`🔄 Refreshing POI proofs for user ${userId}...`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.railgunWalletId) {
      throw new Error('User does not have a RAILGUN wallet');
    }

    const txidVersion = TXIDVersion.V2_PoseidonMerkle;

    await refreshReceivePOIsForWallet(
      txidVersion,
      this.networkName,
      user.railgunWalletId
    );

    console.log(`✅ POI refresh completed for user ${userId}`);
  }

  /**
   * Trigger blockchain scan to find historical UTXOs
   * This should be called after wallet creation to scan for existing UTXOs
   */
  async triggerBlockchainScan(): Promise<void> {
    console.log('🔍 Triggering blockchain scan for historical UTXOs...');

    const { chain } = NETWORK_CONFIG[this.networkName];
    getEngine().scanContractHistory(
      chain,
      undefined, // walletIdFilter - scan all wallets
    );

    console.log('✅ Blockchain scan triggered');
  }

  /**
   * Load all existing wallets from database into RAILGUN engine
   * This should be called after engine initialization
   */
  async loadExistingWallets(): Promise<void> {
    console.log('🔄 Loading existing wallets from database...');

    const users = await prisma.user.findMany({
      where: {
        railgunWalletId: { not: null },
        encryptedMnemonic: { not: null },
      }
    });

    if (users.length === 0) {
      console.log('   No existing wallets to load');
      return;
    }

    for (const user of users) {
      try {
        if (!user.encryptedMnemonic || !user.encryptionKey) {
          console.log(`   ⚠️  Skipping user ${user.id}: missing mnemonic or encryption key`);
          continue;
        }

        // Decrypt mnemonic
        const mnemonic = Buffer.from(user.encryptedMnemonic, 'base64').toString('utf-8');

        // Load wallet into RAILGUN engine
        await createRailgunWallet(
          user.encryptionKey,
          mnemonic,
          undefined, // creationBlockNumbers
        );

        console.log(`   ✅ Loaded wallet for ${user.ethereumAddress}`);
      } catch (err) {
        console.log(`   ⚠️  Failed to load wallet for ${user.id}:`, err);
      }
    }

    console.log(`✅ Loaded ${users.length} wallets from database`);
  }

  /**
   * Derive encryption key from password
   * TODO: Use proper PBKDF2 in production
   */
  private deriveEncryptionKey(password: string): string {
    const hash = Array.from(password)
      .reduce((hash, char) => {
        return ((hash << 5) - hash) + char.charCodeAt(0);
      }, 0)
      .toString(16)
      .padStart(64, '0')
      .slice(0, 64);

    return hash;
  }
}

export const railgunService = new RailgunBackendService();
