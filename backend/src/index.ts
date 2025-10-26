/**
 * RAILGUN Payroll Backend API
 *
 * Handles RAILGUN wallet operations on server side
 * Frontend uses MetaMask for Ethereum transactions
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { railgunService } from './railgun-service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RAILGUN Payroll Backend API' });
});

// ============================================================================
// RAILGUN Wallet API Endpoints
// ============================================================================

/**
 * Create a new RAILGUN wallet for user
 *
 * POST /api/railgun/wallet/create
 * Body: {
 *   userId: string,
 *   ethereumAddress: string (from MetaMask),
 *   password: string
 * }
 */
app.post('/api/railgun/wallet/create', async (req, res) => {
  try {
    const { userId, ethereumAddress, password } = req.body;

    if (!userId || !ethereumAddress || !password) {
      return res.status(400).json({
        error: 'Missing required fields: userId, ethereumAddress, password',
      });
    }

    const wallet = await railgunService.createWalletForUser(
      userId,
      ethereumAddress,
      password
    );

    res.json({
      success: true,
      wallet: {
        railgunWalletId: wallet.railgunWalletId,
        railgunAddress: wallet.railgunAddress,
        mnemonic: wallet.mnemonic, // IMPORTANT: User must save this!
      },
    });
  } catch (error: any) {
    console.error('Error creating wallet:', error);
    res.status(500).json({
      error: error.message || 'Failed to create RAILGUN wallet',
    });
  }
});

/**
 * Import existing RAILGUN wallet for user
 *
 * POST /api/railgun/wallet/import
 * Body: {
 *   userId: string,
 *   ethereumAddress: string,
 *   mnemonic: string,
 *   password: string
 * }
 */
app.post('/api/railgun/wallet/import', async (req, res) => {
  try {
    const { userId, ethereumAddress, mnemonic, password } = req.body;

    if (!userId || !ethereumAddress || !mnemonic || !password) {
      return res.status(400).json({
        error: 'Missing required fields: userId, ethereumAddress, mnemonic, password',
      });
    }

    const wallet = await railgunService.importWalletForUser(
      userId,
      ethereumAddress,
      mnemonic,
      password
    );

    res.json({
      success: true,
      wallet: {
        railgunWalletId: wallet.railgunWalletId,
        railgunAddress: wallet.railgunAddress,
      },
    });
  } catch (error: any) {
    console.error('Error importing wallet:', error);
    res.status(500).json({
      error: error.message || 'Failed to import RAILGUN wallet',
    });
  }
});

/**
 * Get user's RAILGUN wallet info
 *
 * GET /api/railgun/wallet/:userId
 */
app.get('/api/railgun/wallet/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await railgunService.getUserWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        error: 'User does not have a RAILGUN wallet',
      });
    }

    res.json({
      success: true,
      wallet: {
        railgunWalletId: wallet.railgunWalletId,
        railgunAddress: wallet.railgunAddress,
        ethereumAddress: wallet.ethereumAddress,
      },
    });
  } catch (error: any) {
    console.error('Error getting wallet:', error);
    res.status(500).json({
      error: error.message || 'Failed to get RAILGUN wallet',
    });
  }
});

/**
 * Check if user has a RAILGUN wallet
 *
 * GET /api/railgun/wallet/:userId/exists
 */
app.get('/api/railgun/wallet/:userId/exists', async (req, res) => {
  try {
    const { userId } = req.params;
    const exists = await railgunService.hasWallet(userId);

    res.json({
      success: true,
      exists,
    });
  } catch (error: any) {
    console.error('Error checking wallet:', error);
    res.status(500).json({
      error: error.message || 'Failed to check wallet',
    });
  }
});

/**
 * Connect wallet - Get or create RAILGUN wallet for Ethereum address
 *
 * This is the main endpoint the frontend calls when user connects wallet.
 * It will auto-create a RAILGUN wallet if the user doesn't have one.
 *
 * POST /api/railgun/connect
 * Body: {
 *   ethereumAddress: string (from MetaMask)
 * }
 */
app.post('/api/railgun/connect', async (req, res) => {
  try {
    const { ethereumAddress } = req.body;

    if (!ethereumAddress) {
      return res.status(400).json({
        error: 'Missing required field: ethereumAddress',
      });
    }

    // Check if user already has a wallet
    let user = await railgunService.getUserWalletByAddress(ethereumAddress);

    if (!user) {
      // Auto-create wallet using Ethereum address as both userId and password
      console.log(`🆕 Auto-creating RAILGUN wallet for ${ethereumAddress}...`);

      const wallet = await railgunService.createWalletForUser(
        ethereumAddress, // Use Ethereum address as userId
        ethereumAddress,
        ethereumAddress  // Use Ethereum address as password (simple for now)
      );

      user = await railgunService.getUserWalletByAddress(ethereumAddress);
    }

    if (!user) {
      return res.status(500).json({
        error: 'Failed to create or retrieve RAILGUN wallet',
      });
    }

    res.json({
      success: true,
      wallet: {
        railgunWalletId: user.railgunWalletId,
        railgunAddress: user.railgunAddress,
        ethereumAddress: user.ethereumAddress,
      },
      message: user.createdAt.getTime() > Date.now() - 5000
        ? 'New RAILGUN wallet created'
        : 'Existing RAILGUN wallet loaded',
    });
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({
      error: error.message || 'Failed to connect wallet',
    });
  }
});

/**
 * Generate shield transaction
 *
 * Frontend will:
 * 1. First approve tokens using MetaMask
 * 2. Then call this endpoint to get shield transaction data
 * 3. Finally sign and send the shield transaction with MetaMask
 *
 * POST /api/railgun/shield
 * Body: {
 *   userId: string,
 *   tokenAddress: string,
 *   amount: string (e.g., "1000000" for 1 USDC with 6 decimals)
 * }
 */
app.post('/api/railgun/shield', async (req, res) => {
  try {
    const { userId, tokenAddress, amount } = req.body;

    if (!userId || !tokenAddress || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: userId, tokenAddress, amount',
      });
    }

    const result = await railgunService.generateShieldTransaction(
      userId,
      tokenAddress,
      amount
    );

    res.json({
      success: true,
      transaction: result.transaction,
      shieldPrivateKey: result.shieldPrivateKey,
      message: 'Shield transaction prepared. Send this transaction with MetaMask.',
    });
  } catch (error: any) {
    console.error('Error generating shield transaction:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate shield transaction',
    });
  }
});

/**
 * Get shielded balance for a token
 *
 * GET /api/railgun/balance/:userId/:tokenAddress
 */
app.get('/api/railgun/balance/:userId/:tokenAddress', async (req, res) => {
  try {
    const { userId, tokenAddress } = req.params;

    const balance = await railgunService.getShieldedBalance(userId, tokenAddress);

    res.json({
      success: true,
      balance,
    });
  } catch (error: any) {
    console.error('Error getting balance:', error);
    res.status(500).json({
      error: error.message || 'Failed to get shielded balance',
    });
  }
});

/**
 * Refresh POI (Proof of Innocence) proofs for user's wallet
 * This fetches latest POI data from aggregator for all UTXOs
 *
 * POST /api/railgun/poi/refresh/:userId
 */
app.post('/api/railgun/poi/refresh/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await railgunService.refreshPOIForUser(userId);

    res.json({
      success: true,
      message: 'POI proofs refreshed successfully',
    });
  } catch (error: any) {
    console.error('Error refreshing POI:', error);
    res.status(500).json({
      error: error.message || 'Failed to refresh POI proofs',
    });
  }
});

/**
 * Trigger blockchain scan for historical UTXOs
 * This should be called after wallet creation or when reconnecting
 *
 * POST /api/railgun/scan
 */
app.post('/api/railgun/scan', async (req, res) => {
  try {
    await railgunService.triggerBlockchainScan();

    res.json({
      success: true,
      message: 'Blockchain scan triggered',
    });
  } catch (error: any) {
    console.error('Error triggering scan:', error);
    res.status(500).json({
      error: error.message || 'Failed to trigger blockchain scan',
    });
  }
});

// ============================================================================
// Error handling
// ============================================================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
});

// ============================================================================
// Server startup
// ============================================================================

async function startServer() {
  try {
    console.log('🚀 Starting RAILGUN Payroll Backend...\n');

    // Initialize RAILGUN engine
    console.log('📦 Initializing RAILGUN engine...');
    await railgunService.initEngine();

    // Setup provider
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    console.log(`📡 Connecting to RPC: ${rpcUrl}...`);
    await railgunService.setupProvider(rpcUrl);

    // Load existing wallets from database
    await railgunService.loadExistingWallets();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n✅ Backend API running on http://localhost:${PORT}`);
      console.log(`\n📚 Available endpoints:`);
      console.log(`   GET  /health`);
      console.log(`   POST /api/railgun/connect               ⭐ Use this for wallet connection`);
      console.log(`   POST /api/railgun/wallet/create`);
      console.log(`   POST /api/railgun/wallet/import`);
      console.log(`   GET  /api/railgun/wallet/:userId`);
      console.log(`   GET  /api/railgun/wallet/:userId/exists`);
      console.log(`   POST /api/railgun/shield`);
      console.log(`   GET  /api/railgun/balance/:userId/:tokenAddress`);
      console.log(`   POST /api/railgun/poi/refresh/:userId`);
      console.log(`   POST /api/railgun/scan`);
      console.log(`\n🎉 Ready to accept requests!\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
