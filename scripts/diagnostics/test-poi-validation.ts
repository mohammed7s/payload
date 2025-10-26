/**
 * POI Validation Diagnostic Script
 *
 * Tests POI validation for all existing UTXOs to ensure they're actually spendable.
 * Run with: npx ts-node src/test-poi-validation.ts
 */

import 'dotenv/config';
import {
  loadProvider,
  setLoggers,
  startRailgunEngine,
  ArtifactStore,
  walletForID,
  getTXOsReceivedPOIStatusInfoForWallet,
  refreshReceivePOIsForWallet,
  createRailgunWallet,
  setOnUTXOMerkletreeScanCallback,
  getEngine,
} from '@railgun-community/wallet';
import {
  NetworkName,
  FallbackProviderJsonConfig,
  NETWORK_CONFIG,
  TXIDVersion,
  MerkletreeScanStatus,
  MerkletreeScanUpdateEvent,
  poll,
} from '@railgun-community/shared-models';
import leveldown from 'leveldown';
import fs from 'fs';

const NETWORK_NAME: NetworkName = NetworkName.EthereumSepolia;
const RPC_URL = process.env.ETHEREUM_RPC_URL!;
const EMPLOYER_MNEMONIC = process.env.RAILGUN_WALLET_MNEMONIC!;

let currentMerkletreeScanStatus: MerkletreeScanStatus | undefined;

const merkletreeScanCallback = (scanData: MerkletreeScanUpdateEvent): void => {
  const progress = Math.round(scanData.progress * 100);
  console.log(
    `   📊 Merkletree scan: ${progress}% [${scanData.scanStatus}] - Chain: ${scanData.chain?.type}:${scanData.chain?.id}`
  );
  currentMerkletreeScanStatus = scanData.scanStatus;

  // If scan completes, log it clearly
  if (scanData.scanStatus === MerkletreeScanStatus.Complete) {
    console.log('   ✅ Scan status set to COMPLETE');
  }
};

const pollUntilMerkletreeScanned = async (): Promise<void> => {
  console.log('   ⏳ Waiting for merkletree scan to complete...\n');

  let callbackCalled = false;
  const originalCallback = currentMerkletreeScanStatus;

  const status = await poll(
    async () => {
      if (currentMerkletreeScanStatus !== undefined && !callbackCalled) {
        callbackCalled = true;
        console.log('   📞 Scan callback was called!');
      }
      return currentMerkletreeScanStatus;
    },
    (status) => status === MerkletreeScanStatus.Complete,
    500, // Poll every 500ms
    180, // 90 seconds timeout (180 * 500ms)
  );

  if (!callbackCalled) {
    console.log('   ❌ WARNING: Scan callback was NEVER called!');
    console.log('   This means the scan completed before the wallet was created,');
    console.log('   or the callback wasn\'t properly registered.\n');
  }

  if (status !== MerkletreeScanStatus.Complete) {
    throw new Error('Merkletree scan timed out after 90 seconds');
  }
  console.log('   ✅ Merkletree scan complete!\n');
};

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
  console.log('🔍 RAILGUN POI VALIDATION DIAGNOSTIC');
  console.log('='.repeat(70));
  console.log();

  // Initialize RAILGUN Engine
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
    'poi diagnostic',
    db,
    true,
    artifactStore,
    false,
    false,
    ['https://ppoi-agg.horsewithsixlegs.xyz'],
    [],
  );

  console.log('✅ RAILGUN Engine initialized\n');

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

  // Set up merkletree scan callback BEFORE loading provider
  setOnUTXOMerkletreeScanCallback(merkletreeScanCallback);

  const pollingInterval = 10000;
  await loadProvider(fallbackProviderConfig, NETWORK_NAME, pollingInterval);

  console.log('✅ Provider connected to', NETWORK_NAME, '\n');

  // Load wallet
  console.log('🔐 Loading employer wallet...\n');

  // Encryption key must be 32 bytes (64 hex characters) for AES-256
  const encryptionKey = '0101010101010101010101010101010101010101010101010101010101010101';

  // Scan from 2 days ago to find historical UTXOs
  const creationBlockNumbers = {
    [NetworkName.EthereumSepolia]: 9475000, // ~2 days ago
  };

  const employerWallet = await createRailgunWallet(
    encryptionKey,
    EMPLOYER_MNEMONIC,
    creationBlockNumbers, // Scan from historical block to find all UTXOs
  );

  console.log(`✅ Wallet loaded:`);
  console.log(`   Wallet ID: ${employerWallet.id.substring(0, 20)}...`);
  console.log(`   0zk Address: ${employerWallet.railgunAddress}`);
  console.log();

  // Get wallet object
  const walletObj = walletForID(employerWallet.id);

  // Trigger the blockchain scan
  console.log('⏳ Triggering blockchain scan...');
  console.log('   Starting from block 9,475,000 to current block\n');

  const { chain } = NETWORK_CONFIG[NETWORK_NAME];
  getEngine().scanContractHistory(
    chain,
    undefined, // walletIdFilter - scan all wallets
  );

  // Wait for merkletree scan to complete
  console.log('⏳ Waiting for scan to complete...\n');

  await pollUntilMerkletreeScanned();

  console.log('='.repeat(70));
  console.log('📋 STEP 1: Get Current POI Status for All UTXOs');
  console.log('='.repeat(70));
  console.log();

  const poiStatusBefore = await getTXOsReceivedPOIStatusInfoForWallet(
    TXIDVersion.V2_PoseidonMerkle,
    NETWORK_NAME,
    employerWallet.id
  );

  console.log(`Found ${poiStatusBefore.length} UTXOs in wallet\n`);

  // Display detailed POI status for each UTXO
  for (let i = 0; i < poiStatusBefore.length; i++) {
    const utxo = poiStatusBefore[i];
    console.log(`UTXO ${i + 1}:`);
    console.log(`  TxID: ${utxo.strings.txid.substring(0, 30)}...`);
    console.log(`  Tree Position: ${utxo.strings.tree}:${utxo.strings.position}`);
    console.log(`  Blinded Commitment: ${utxo.strings.blindedCommitment.substring(0, 30)}...`);
    console.log(`  POI Status:`, JSON.stringify(utxo.strings.poisPerList, null, 4));

    // Analyze POI status
    if (!utxo.strings.poisPerList) {
      console.log(`  ❌ NO POI DATA - This UTXO has no POI proofs!`);
    } else {
      const listKeys = Object.keys(utxo.strings.poisPerList);
      let allValid = true;

      for (const key of listKeys) {
        const status = utxo.strings.poisPerList[key];
        console.log(`  List ${key.substring(0, 8)}...: ${status}`);

        if (status !== 'Valid') {
          allValid = false;
          console.log(`    ⚠️  Status is "${status}" - NOT VALID!`);
        }
      }

      if (allValid) {
        console.log(`  ✅ POI Status: ALL VALID - This UTXO should be spendable`);
      } else {
        console.log(`  ❌ POI Status: NOT ALL VALID - This UTXO may not be spendable`);
      }
    }
    console.log();
  }

  console.log('='.repeat(70));
  console.log('🔄 STEP 2: Refresh POI Proofs from Aggregator');
  console.log('='.repeat(70));
  console.log();

  console.log('Requesting POI proofs from aggregator...');

  try {
    await refreshReceivePOIsForWallet(
      TXIDVersion.V2_PoseidonMerkle,
      NETWORK_NAME,
      employerWallet.id
    );
    console.log('✅ POI refresh completed\n');
  } catch (error) {
    console.error('❌ POI refresh failed:', error);
    console.log('\nThis could mean:');
    console.log('1. POI aggregator is down or unreachable');
    console.log('2. Network connectivity issues');
    console.log('3. Invalid wallet or chain configuration\n');
  }

  console.log('='.repeat(70));
  console.log('📊 STEP 3: Check POI Status After Refresh');
  console.log('='.repeat(70));
  console.log();

  const poiStatusAfter = await getTXOsReceivedPOIStatusInfoForWallet(
    TXIDVersion.V2_PoseidonMerkle,
    NETWORK_NAME,
    employerWallet.id
  );

  let validCount = 0;
  let invalidCount = 0;
  let missingCount = 0;

  for (let i = 0; i < poiStatusAfter.length; i++) {
    const utxo = poiStatusAfter[i];

    if (!utxo.strings.poisPerList) {
      missingCount++;
      console.log(`UTXO ${i + 1} (${utxo.strings.tree}:${utxo.strings.position}): ❌ NO POI DATA`);
    } else {
      const listKeys = Object.keys(utxo.strings.poisPerList);
      let allValid = true;

      for (const key of listKeys) {
        if (utxo.strings.poisPerList[key] !== 'Valid') {
          allValid = false;
          break;
        }
      }

      if (allValid) {
        validCount++;
        console.log(`UTXO ${i + 1} (${utxo.strings.tree}:${utxo.strings.position}): ✅ ALL VALID`);
      } else {
        invalidCount++;
        console.log(`UTXO ${i + 1} (${utxo.strings.tree}:${utxo.strings.position}): ⚠️  INVALID/PENDING`);
        console.log(`   Status:`, utxo.strings.poisPerList);
      }
    }
  }

  console.log();
  console.log('='.repeat(70));
  console.log('📈 POI VALIDATION SUMMARY');
  console.log('='.repeat(70));
  console.log();
  console.log(`Total UTXOs: ${poiStatusAfter.length}`);
  console.log(`✅ Valid (spendable): ${validCount}`);
  console.log(`⚠️  Invalid/Pending: ${invalidCount}`);
  console.log(`❌ Missing POI data: ${missingCount}`);
  console.log();

  if (validCount === poiStatusAfter.length) {
    console.log('🎉 ALL UTXOs have valid POI proofs!');
    console.log('   These should be spendable on-chain (if past 1-hour time lock).');
  } else {
    console.log('⚠️  Some UTXOs do NOT have valid POI proofs!');
    console.log('   These cannot be spent until POI validation completes.');

    if (invalidCount > 0) {
      console.log('\n   Invalid/Pending UTXOs may be:');
      console.log('   - Still in 1-hour POI validation period');
      console.log('   - Blocked by POI aggregator (sanctioned address)');
      console.log('   - Having POI proof generation issues');
    }

    if (missingCount > 0) {
      console.log('\n   Missing POI data could mean:');
      console.log('   - POI aggregator doesn\'t have historical data for old shields');
      console.log('   - UTXOs created before POI aggregator was configured');
      console.log('   - Need to submit legacy transaction proofs');
    }
  }

  console.log();
  console.log('='.repeat(70));
  console.log('🔬 STEP 4: Detailed Analysis of Problem UTXOs');
  console.log('='.repeat(70));
  console.log();

  // Find the newest UTXOs (lowest tree positions = most recent)
  const sortedUTXOs = [...poiStatusAfter].sort((a, b) =>
    a.strings.position - b.strings.position
  );

  console.log('Newest 3 UTXOs (most likely to be selected for spending):');
  console.log();

  for (let i = 0; i < Math.min(3, sortedUTXOs.length); i++) {
    const utxo = sortedUTXOs[i];
    console.log(`${i + 1}. Tree Position ${utxo.strings.tree}:${utxo.strings.position}`);
    console.log(`   TxID: ${utxo.strings.txid}`);
    console.log(`   Commitment: ${utxo.strings.blindedCommitment}`);

    if (!utxo.strings.poisPerList) {
      console.log(`   POI Status: ❌ MISSING`);
      console.log(`   → This UTXO CANNOT be spent!`);
    } else {
      const status = Object.values(utxo.strings.poisPerList)[0];
      console.log(`   POI Status: ${status}`);

      if (status === 'Valid') {
        console.log(`   → This UTXO should be spendable (if > 1 hour old)`);
      } else {
        console.log(`   → This UTXO CANNOT be spent yet!`);
        console.log(`   → Status "${status}" means it's not ready`);
      }
    }
    console.log();
  }

  console.log('='.repeat(70));
  console.log('✅ POI DIAGNOSTIC COMPLETE');
  console.log('='.repeat(70));
  console.log();

  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Diagnostic failed:', error);
  process.exit(1);
});
