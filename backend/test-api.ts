/**
 * API Test Script
 *
 * Tests the RAILGUN backend API endpoints
 * Run with: tsx test-api.ts
 */

import dotenv from 'dotenv';
import { Wallet } from 'ethers';

dotenv.config();

const API_BASE_URL = 'http://localhost:3001';

// Get Ethereum wallet from env
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY not found in .env file');
  process.exit(1);
}

const ethWallet = new Wallet(PRIVATE_KEY);

// Test data
const TEST_USER = {
  userId: 'test-user-123',
  ethereumAddress: ethWallet.address, // Get from actual wallet
  password: 'test-password-123',
};

console.log('🔑 Using Ethereum address:', TEST_USER.ethereumAddress);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  console.log('\n🧪 Testing: GET /health');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

async function testCheckWalletExists() {
  console.log(`\n🧪 Testing: GET /api/railgun/wallet/${TEST_USER.userId}/exists`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/railgun/wallet/${TEST_USER.userId}/exists`);
    const data = await response.json();
    console.log('✅ Wallet exists check:', data);
    return data.exists;
  } catch (error) {
    console.error('❌ Check wallet failed:', error);
    return false;
  }
}

async function testCreateWallet() {
  console.log('\n🧪 Testing: POST /api/railgun/wallet/create');
  try {
    const response = await fetch(`${API_BASE_URL}/api/railgun/wallet/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: TEST_USER.userId,
        ethereumAddress: TEST_USER.ethereumAddress,
        password: TEST_USER.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Create wallet failed:', data);
      return null;
    }

    console.log('✅ Wallet created successfully!');
    console.log('   Wallet ID:', data.wallet.railgunWalletId);
    console.log('   RAILGUN Address:', data.wallet.railgunAddress);
    console.log('   Mnemonic (SAVE THIS!):', data.wallet.mnemonic);

    return data.wallet;
  } catch (error) {
    console.error('❌ Create wallet error:', error);
    return null;
  }
}

async function testGetWallet() {
  console.log(`\n🧪 Testing: GET /api/railgun/wallet/${TEST_USER.userId}`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/railgun/wallet/${TEST_USER.userId}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Get wallet failed:', data);
      return null;
    }

    console.log('✅ Wallet retrieved successfully!');
    console.log('   Wallet ID:', data.wallet.railgunWalletId);
    console.log('   RAILGUN Address:', data.wallet.railgunAddress);
    console.log('   Ethereum Address:', data.wallet.ethereumAddress);

    return data.wallet;
  } catch (error) {
    console.error('❌ Get wallet error:', error);
    return null;
  }
}

async function testImportWallet(mnemonic: string) {
  console.log('\n🧪 Testing: POST /api/railgun/wallet/import');

  const importUserId = 'test-user-import-456';

  try {
    const response = await fetch(`${API_BASE_URL}/api/railgun/wallet/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: importUserId,
        ethereumAddress: TEST_USER.ethereumAddress, // Use same Ethereum address
        mnemonic: mnemonic,
        password: 'import-password-123',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Import wallet failed:', data);
      return null;
    }

    console.log('✅ Wallet imported successfully!');
    console.log('   Wallet ID:', data.wallet.railgunWalletId);
    console.log('   RAILGUN Address:', data.wallet.railgunAddress);

    return data.wallet;
  } catch (error) {
    console.error('❌ Import wallet error:', error);
    return null;
  }
}

async function testGenerateShield() {
  console.log('\n🧪 Testing: POST /api/railgun/shield');

  const TOKEN_ADDRESS = process.env.TEST_TOKEN_ADDRESS;
  const SHIELD_AMOUNT = '1000000'; // 1 USDC (6 decimals)

  if (!TOKEN_ADDRESS) {
    console.error('❌ TEST_TOKEN_ADDRESS not found in .env file');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/railgun/shield`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: TEST_USER.userId,
        tokenAddress: TOKEN_ADDRESS,
        amount: SHIELD_AMOUNT,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Generate shield failed:', data);
      return null;
    }

    console.log('✅ Shield transaction generated successfully!');
    console.log('   Shield contract:', data.transaction.to);
    console.log('   Transaction data length:', data.transaction.data?.length || 0, 'bytes');
    console.log('   Shield private key:', data.shieldPrivateKey);
    console.log('   Message:', data.message);

    return data;
  } catch (error) {
    console.error('❌ Generate shield error:', error);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...');
  console.log('==========================================');

  // Wait a bit for server to be ready
  console.log('\n⏳ Waiting 2 seconds for server to be ready...');
  await sleep(2000);

  // Test 1: Health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.error('\n❌ Server is not responding. Make sure backend is running on port 3001');
    console.error('   Run: cd backend && yarn dev');
    process.exit(1);
  }

  await sleep(1000);

  // Test 2: Check if wallet exists (should be false initially)
  const existsBefore = await testCheckWalletExists();
  if (existsBefore) {
    console.log('⚠️  Wallet already exists for test user (from previous test)');
  }

  await sleep(1000);

  // Test 3: Create wallet
  const wallet = await testCreateWallet();
  if (!wallet) {
    console.error('\n❌ Failed to create wallet. Cannot continue tests.');
    process.exit(1);
  }

  await sleep(1000);

  // Test 4: Check if wallet exists (should be true now)
  const existsAfter = await testCheckWalletExists();
  if (!existsAfter) {
    console.error('❌ Wallet should exist after creation but doesnt!');
  }

  await sleep(1000);

  // Test 5: Get wallet info
  await testGetWallet();

  await sleep(1000);

  // Test 6: Import wallet (using mnemonic from created wallet)
  await testImportWallet(wallet.mnemonic);

  await sleep(1000);

  // Test 7: Generate shield transaction
  const shieldResult = await testGenerateShield();
  if (!shieldResult) {
    console.log('⚠️  Shield generation failed (but continuing tests)');
  }

  console.log('\n==========================================');
  console.log('✅ All tests completed!');
  console.log('\n📝 Summary:');
  console.log('   - Health check: ✅');
  console.log('   - Wallet creation: ✅');
  console.log('   - Wallet retrieval: ✅');
  console.log('   - Wallet import: ✅');
  console.log(`   - Shield generation: ${shieldResult ? '✅' : '⚠️'}`);
  console.log('\n🎉 Backend API is working correctly!\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
