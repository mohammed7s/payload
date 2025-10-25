# RAILGUN Private Payroll System - Architecture Specification

**Version:** 1.0
**Date:** October 2024
**Architecture Pattern:** Non-Custodial Web Application (Option 1B)

---

## Table of Contents
1. [Overview](#overview)
2. [Security Model](#security-model)
3. [System Architecture](#system-architecture)
4. [Wallet Management](#wallet-management)
5. [User Flows](#user-flows)
6. [Technical Stack](#technical-stack)
7. [API Specification](#api-specification)
8. [Database Schema](#database-schema)
9. [Deployment Strategy](#deployment-strategy)
10. [Security Considerations](#security-considerations)

---

## 1. Overview

### Purpose
A privacy-preserving payroll system that allows employers to pay employees using RAILGUN's private transfers while maintaining regulatory compliance through POI (Proof of Innocence) validation.

### Core Principles
- **Non-Custodial:** Users control their own private keys at all times
- **Privacy-First:** Payment amounts and recipients are hidden on-chain
- **Compliance-Ready:** POI validation ensures funds aren't from sanctioned addresses
- **User-Friendly:** Simple web interface, no terminal commands required

### Key Features
- Private payroll distribution (employer → employees)
- Shield tokens from public wallet to RAILGUN
- Real-time balance tracking
- Transaction history (encrypted, client-side only)
- Multi-employee batch payments
- Automated POI validation

---

## 2. Security Model

### Key Custody Model: NON-CUSTODIAL

**Employer Keys:**
- ✅ Stored encrypted in browser's localStorage
- ✅ Never transmitted to backend server
- ✅ Decrypted only when user enters password
- ✅ Used only for signing transactions client-side

**Backend Server:**
- ❌ Never sees private keys or mnemonics
- ✅ Can see public RAILGUN addresses
- ✅ Maintains shared merkletree data (public information)
- ✅ Provides unsigned transaction data

**Security Trade-offs:**
| Aspect | Non-Custodial (Our Choice) | Custodial Alternative |
|--------|---------------------------|----------------------|
| Key Control | User holds keys | Server holds keys |
| Recovery | User must backup mnemonic | Server can recover |
| Liability | User responsibility | Company liability |
| Regulation | Minimal compliance | Heavy regulation |
| UX Complexity | Higher (key management) | Lower (just password) |

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EMPLOYER'S BROWSER                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Frontend (Next.js/React)                              │ │
│  │                                                         │ │
│  │  Components:                                           │ │
│  │  - Dashboard (balance, history)                        │ │
│  │  - Payment UI (single/batch)                           │ │
│  │  - Wallet Manager (create/import)                      │ │
│  │  - Transaction Status Monitor                          │ │
│  │                                                         │ │
│  │  RAILGUN SDK (Browser):                                │ │
│  │  - Wallet operations (sign transactions)               │ │
│  │  - ZK proof generation                                 │ │
│  │  - UTXO decryption                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Browser Storage (Encrypted)                           │ │
│  │  - RAILGUN mnemonic (AES-256 encrypted)                │ │
│  │  - User password hash                                  │ │
│  │  - Transaction history (encrypted)                     │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬───────────────────────────────────┬─┘
                        │                                   │
                        │ HTTPS API Calls                   │ Web3 RPC
                        │ (No keys transmitted!)            │
                        ▼                                   ▼
        ┌───────────────────────────┐        ┌──────────────────────┐
        │   Backend API Server      │        │  Ethereum RPC        │
        │   (Node.js + Express)     │        │  (Sepolia/Mainnet)   │
        │                           │        │                      │
        │  Services:                │        │  - Submit signed txs │
        │  - Merkletree sync        │        │  - Query events      │
        │  - POI validation         │        │  - Get gas prices    │
        │  - Build unsigned txs     │        └──────────────────────┘
        │  - Balance calculation    │
        │  - Employee management    │
        │                           │
        │  NO PRIVATE KEYS!         │
        └─────────────┬─────────────┘
                      │
                      ▼
        ┌───────────────────────────┐
        │   Database (PostgreSQL)   │
        │                           │
        │  - Merkletree data        │
        │  - POI status cache       │
        │  - Employee addresses     │
        │  - Public tx history      │
        │                           │
        │  NO WALLET KEYS!          │
        └───────────────────────────┘
```

### Data Flow: Payment Transaction

```
1. USER ACTION
   Employer clicks "Pay Employee"
   ↓

2. FRONTEND (Browser)
   - Prompts for password
   - Decrypts RAILGUN mnemonic from localStorage
   - Loads wallet with decrypted mnemonic
   ↓

3. API CALL TO BACKEND
   POST /api/build-payment
   Body: {
     employerRailgunAddress: "0zk1q...",
     employeeRailgunAddress: "0zk1q...",
     amount: "100000000" // 100 USDC (6 decimals)
   }
   ↓

4. BACKEND PROCESSING
   - Validate POI status
   - Check sufficient balance
   - Build unsigned transaction data
   - Calculate gas estimates
   ↓

5. BACKEND RESPONSE
   Returns: {
     unsignedTransaction: {...},
     gasEstimate: "250000",
     proofData: {...}
   }
   ↓

6. FRONTEND (Browser)
   - Generate ZK proof (30-60 seconds, client-side)
   - Sign transaction with employer's key (client-side)
   - Never sends mnemonic/private key anywhere!
   ↓

7. SUBMIT TO BLOCKCHAIN
   - Frontend sends signed tx directly to Ethereum RPC
   - Monitors for confirmation
   ↓

8. CONFIRMATION
   - Backend monitors blockchain for new events
   - Updates merkletree
   - Frontend shows success/failure
```

---

## 4. Wallet Management

### The Two-Wallet System

**Employers use TWO wallets:**

#### Wallet 1: MetaMask (Public Ethereum Wallet)
- **Purpose:** Hold public ERC20 tokens (USDC, DAI, etc.)
- **Technology:** Standard Ethereum wallet (browser extension)
- **Visibility:** Public on-chain (everyone can see balance and transactions)
- **Operations:**
  - Receive salary tokens from company bank/exchange
  - Approve RAILGUN contract to spend tokens
  - Shield tokens (convert public → private)

#### Wallet 2: RAILGUN Wallet (Private Wallet)
- **Purpose:** Hold shielded (private) tokens
- **Technology:** RAILGUN SDK (integrated in our web app)
- **Visibility:** Private on-chain (amounts and recipients hidden)
- **Operations:**
  - Receive shielded tokens
  - Private transfers to employees
  - Unshield tokens (convert private → public)

### Wallet Flow Diagram

```
Company Bank Account
        │
        │ Wire transfer / Stablecoin purchase
        ▼
┌─────────────────────┐
│   MetaMask Wallet   │ ← Employer's PUBLIC wallet
│   (Public ETH)      │
│                     │
│   1000 USDC         │ ← Visible to everyone on-chain
└─────────────────────┘
        │
        │ 1. Approve RAILGUN contract
        │ 2. Shield (public → private)
        │    Transaction visible but amount encrypted
        ▼
┌─────────────────────┐
│  RAILGUN Wallet     │ ← Employer's PRIVATE wallet
│  (Private/Shielded) │    (Created in our web app)
│                     │
│   ??? USDC          │ ← HIDDEN from public
└─────────────────────┘    Only employer can decrypt
        │
        │ Private Transfer
        │ (Amount and recipient HIDDEN)
        ▼
┌─────────────────────┐
│  Employee RAILGUN   │ ← Employee's PRIVATE wallet
│  Wallet             │    (Created by employee)
│                     │
│   ??? USDC          │ ← Only employee can decrypt
└─────────────────────┘
        │
        │ Unshield (private → public)
        │ Employee sends to their own public wallet
        ▼
┌─────────────────────┐
│  Employee MetaMask  │ ← Employee's PUBLIC wallet
│  Wallet             │
│                     │
│   100 USDC          │ ← Now public, can withdraw to bank
└─────────────────────┘
```

### RAILGUN Wallet Creation in Web App

**User Experience:**

```typescript
// First-time user flow
Step 1: "Create RAILGUN Wallet"
  → App generates 12-word mnemonic (client-side)
  → Shows mnemonic to user: "Write this down!"

Step 2: "Secure Your Wallet"
  → User enters encryption password
  → Confirms password

Step 3: Wallet Encrypted and Saved
  → Mnemonic encrypted with password (AES-256)
  → Stored in browser localStorage
  → User can now use wallet

// Returning user flow
Step 1: "Unlock Wallet"
  → User enters password
  → Mnemonic decrypted from localStorage
  → Wallet loaded
```

**Code Implementation:**

```typescript
// lib/wallet/railgun-wallet.ts

import { createRailgunWallet } from '@railgun-community/wallet';
import CryptoJS from 'crypto-js';

// Create new RAILGUN wallet
export async function createNewRailgunWallet(password: string) {
  // Generate mnemonic (client-side, in browser)
  const mnemonic = generateMnemonic(); // 12 words

  // Create RAILGUN wallet from mnemonic
  const wallet = await createRailgunWallet(
    password, // Used for RAILGUN SDK encryption
    mnemonic,
    undefined // No creation block (will scan from genesis)
  );

  // Encrypt mnemonic with user's password for storage
  const encryptedMnemonic = CryptoJS.AES.encrypt(
    mnemonic,
    password
  ).toString();

  // Store encrypted mnemonic in browser
  localStorage.setItem('railgun_wallet', encryptedMnemonic);
  localStorage.setItem('railgun_address', wallet.address);

  return {
    address: wallet.address,
    mnemonic: mnemonic, // Show once to user for backup
  };
}

// Load existing RAILGUN wallet
export async function loadRailgunWallet(password: string) {
  // Get encrypted mnemonic from localStorage
  const encryptedMnemonic = localStorage.getItem('railgun_wallet');
  if (!encryptedMnemonic) {
    throw new Error('No wallet found. Please create one first.');
  }

  // Decrypt mnemonic with user's password
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
  const mnemonic = decryptedBytes.toString(CryptoJS.enc.Utf8);

  if (!mnemonic) {
    throw new Error('Invalid password');
  }

  // Load wallet from mnemonic
  const wallet = await createRailgunWallet(
    password,
    mnemonic,
    undefined
  );

  return wallet;
}
```

### Browser-Based RAILGUN Wallets

**Q: Is there a browser extension for RAILGUN (like MetaMask)?**

**A: Yes! There are two options:**

#### Option A: Railway Wallet (Official RAILGUN Wallet)
- **Type:** Desktop app (Electron) + Mobile app
- **Website:** https://railway.xyz
- **Features:**
  - Full RAILGUN wallet
  - Shield/unshield/transfer
  - Built-in DEX integration
  - POI compliance
- **For our use case:**
  - ❌ Not a browser extension (can't integrate with web app easily)
  - ✅ Could use as reference for UI/UX
  - ❌ Users would need to download separate app

#### Option B: Integrate RAILGUN SDK Directly (Our Approach)
- **Type:** RAILGUN SDK embedded in our web app
- **Technology:** `@railgun-community/wallet` package
- **Features:**
  - We build the UI
  - SDK handles ZK proofs and encryption
  - Wallet keys managed by our app (stored in browser)
- **For our use case:**
  - ✅ Seamless user experience (no external app needed)
  - ✅ Custom UI for payroll workflows
  - ✅ Full control over UX

**Our Recommendation: Option B (Embedded SDK)**

This means we DON'T use an external RAILGUN wallet. Instead:
1. User has MetaMask for public wallet (standard Ethereum)
2. Our web app has RAILGUN SDK built-in
3. User creates RAILGUN wallet within our app
4. Keys stored encrypted in browser (our app manages this)

---

## 5. User Flows

### 5.1 Employer Onboarding

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Connect MetaMask                                 │
│ - User clicks "Connect Wallet"                           │
│ - MetaMask popup appears                                 │
│ - User approves connection                               │
│ - App detects: Employer has 1000 USDC in MetaMask       │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Create RAILGUN Wallet                           │
│ - App: "Create your private wallet for payroll"         │
│ - User clicks "Create RAILGUN Wallet"                   │
│ - App generates 12-word mnemonic (client-side)          │
│ - Shows mnemonic: "⚠️  Write this down! Can't recover"  │
│ - User confirms they saved it                            │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Set Encryption Password                         │
│ - App: "Protect your wallet with a password"            │
│ - User enters password (min 8 chars)                    │
│ - User confirms password                                 │
│ - App encrypts mnemonic and stores in localStorage      │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Shield Tokens (Public → Private)                │
│ - App: "You have 1000 USDC in MetaMask"                 │
│ - App: "Shield to private wallet for payroll?"          │
│ - User enters amount: 500 USDC                           │
│ - App builds shield transaction                          │
│ - MetaMask pops up: "Approve RAILGUN contract"          │
│ - User approves in MetaMask                              │
│ - Shield transaction submitted                           │
│ - App shows: "⏳ Shielding... (0.25% fee = 1.25 USDC)"  │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Wait for POI Validation (1 Hour)                │
│ - App: "✅ Tokens shielded successfully!"               │
│ - App: "⏰ Funds will be spendable in 1 hour"           │
│ - App: "POI validation in progress..."                  │
│ - Shows countdown timer                                  │
│                                                          │
│ (User can close browser and come back later)            │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 6: Ready to Pay Employees                          │
│ - App: "✅ 498.75 USDC available for payroll"          │
│ - Shows dashboard with spendable balance                │
│ - "Add Employees" button now active                     │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Single Employee Payment

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Initiate Payment                                │
│ - Employer on dashboard                                 │
│ - Clicks "Pay Employee"                                 │
│ - Form appears:                                          │
│   - Employee RAILGUN Address: [0zk1q...]               │
│   - Amount: [100] USDC                                  │
│   - Memo (optional): "October Salary"                   │
│ - Clicks "Preview Payment"                              │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Review Payment Details                          │
│ - App shows summary:                                     │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│   To:        0zk1qy8ny82htznm62dv3...                  │
│   Amount:    100 USDC                                   │
│   Gas Fee:   ~0.01 ETH ($0.25)                          │
│   Total:     100 USDC + gas                             │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│ - [Cancel] [Confirm Payment]                            │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Unlock Wallet                                   │
│ - App: "Enter your password to unlock wallet"           │
│ - User enters password                                   │
│ - App decrypts mnemonic from localStorage               │
│ - Loads RAILGUN wallet                                  │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Generate ZK Proof (Client-Side)                 │
│ - App: "🔐 Generating zero-knowledge proof..."          │
│ - Progress bar: [████████░░] 80%                        │
│ - Takes 30-60 seconds                                    │
│ - All happens in browser (heavy computation)            │
│                                                          │
│ (User's browser is proving they have funds without      │
│  revealing which UTXOs they're spending)                 │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Sign & Submit Transaction                       │
│ - App: "✅ Proof generated"                             │
│ - App signs transaction with employer's RAILGUN key     │
│ - App submits signed tx to Ethereum RPC                 │
│ - App: "📤 Transaction submitted"                       │
│ - Shows transaction hash: 0xabc123...                   │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 6: Confirmation                                     │
│ - App monitors blockchain                                │
│ - Shows: "⏳ Waiting for confirmation... (Block 12345)" │
│ - After 1-2 minutes:                                     │
│ - App: "✅ Payment sent successfully!"                  │
│ - App: "Employee will receive funds after 1 hour POI"   │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Batch Payment (Multiple Employees)

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Upload Employee List                            │
│ - Employer clicks "Batch Payment"                       │
│ - Uploads CSV file:                                      │
│                                                          │
│   employee_address,amount,memo                           │
│   0zk1qy8ny82ht...,100,October Salary                  │
│   0zk1qy9abc123...,150,October Salary                  │
│   0zk1qy9def456...,120,October Salary + Bonus          │
│                                                          │
│ - App validates addresses and amounts                    │
│ - Shows preview table                                    │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Review Batch                                    │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Employee       │ Amount │ Memo                    │  │
│ ├──────────────────────────────────────────────────┤  │
│ │ 0zk1qy8ny8... │ 100    │ October Salary          │  │
│ │ 0zk1qy9abc... │ 150    │ October Salary          │  │
│ │ 0zk1qy9def... │ 120    │ October Salary + Bonus  │  │
│ ├──────────────────────────────────────────────────┤  │
│ │ TOTAL          │ 370 USDC                         │  │
│ └──────────────────────────────────────────────────┘  │
│                                                          │
│ - [Cancel] [Process Batch Payment]                      │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Process Payments (One by One)                   │
│ - App processes each payment sequentially                │
│ - For each employee:                                     │
│   1. Generate ZK proof                                   │
│   2. Sign transaction                                    │
│   3. Submit to blockchain                                │
│   4. Wait for confirmation                               │
│                                                          │
│ - Progress: [2/3 payments sent]                          │
│ - Shows live status for each                             │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Batch Complete                                  │
│ - App: "✅ All 3 payments sent successfully!"           │
│ - Shows summary:                                         │
│   - Total sent: 370 USDC                                │
│   - Gas spent: 0.03 ETH ($0.75)                         │
│   - Transactions: [View all]                            │
└─────────────────────────────────────────────────────────┘
```

### 5.4 Employee Receiving Payment

```
┌─────────────────────────────────────────────────────────┐
│ EMPLOYEE SIDE                                            │
│                                                          │
│ STEP 1: Create RAILGUN Wallet                           │
│ - Employee visits our web app                            │
│ - Clicks "I'm an Employee"                              │
│ - Creates RAILGUN wallet (same flow as employer)        │
│ - Gets RAILGUN address: 0zk1qy8ny82ht...               │
│ - Shares address with employer                           │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Receive Payment Notification                    │
│ - App detects incoming payment                           │
│ - Shows notification: "💰 Payment received!"            │
│ - Amount: ??? (encrypted, only employee can see)        │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Unlock to View Balance                          │
│ - Employee enters password                               │
│ - App decrypts UTXOs                                    │
│ - Shows: "✅ You received 100 USDC!"                    │
│ - Note: "Funds spendable in 1 hour (POI validation)"   │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Unshield to Public Wallet (Optional)            │
│ - After 1 hour, employee can unshield                    │
│ - Clicks "Unshield to MetaMask"                         │
│ - Enters MetaMask address                                │
│ - Generates ZK proof                                     │
│ - Submits unshield transaction                           │
│ - USDC appears in MetaMask                              │
│ - Can now withdraw to bank account                       │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Technical Stack

### Frontend

**Framework:** Next.js 14 (App Router)
- **Why:** Server-side rendering, excellent DX, Vercel deployment
- **Alternative:** Vite + React (faster dev server, but manual SSR setup)

**UI Library:** Tailwind CSS + shadcn/ui
- **Why:** Beautiful components, accessible, customizable
- **Components needed:**
  - Dashboard cards
  - Data tables (transaction history)
  - Forms (payment, wallet creation)
  - Modals (confirmations)
  - Toast notifications

**State Management:** Zustand
- **Why:** Lightweight, TypeScript-first, simpler than Redux
- **Stores:**
  - `useWalletStore` - Wallet state (locked/unlocked, address)
  - `useBalanceStore` - Balance, UTXOs
  - `useTransactionStore` - Pending/confirmed transactions

**RAILGUN Integration:**
```typescript
// Dependencies
"@railgun-community/wallet": "^10.5.1"
"@railgun-community/shared-models": "^7.5.0"
"@railgun-community/engine": "^9.4.0"
"snarkjs": "^0.6.10"
"ethers": "^6.13.1"
```

**Encryption:** crypto-js
- For encrypting mnemonic in localStorage

### Backend

**Framework:** Express.js (Node.js)
- **Why:** Battle-tested, large ecosystem, good TypeScript support
- **Alternative:** Fastify (faster), tRPC (type-safe)

**Database:** PostgreSQL
- **Why:** Robust, ACID compliance, excellent JSON support
- **Alternative:** MongoDB (flexible schema, but less ACID guarantees)

**ORM:** Prisma
- **Why:** Type-safe, great DX, auto-migrations
- **Schema:** See section 8

**Hosting:** Railway.app or Render.com
- **Why:** Free tier, easy deployment, auto-scaling
- **Alternative:** AWS/GCP (more complex, more expensive)

**Key Services:**
```typescript
// backend/services/
├── merkletree-sync.ts    // Sync RAILGUN merkletree from blockchain
├── poi-validator.ts      // Check POI status from aggregator
├── transaction-builder.ts // Build unsigned transactions
├── balance-calculator.ts  // Calculate balances from UTXOs
└── gas-estimator.ts      // Estimate gas costs
```

### Infrastructure

**Ethereum RPC:**
- **Mainnet:** Alchemy or Infura (reliable, generous free tier)
- **Testnet (Sepolia):** Public RPC or Alchemy

**POI Aggregator:**
- **Production:** `https://poi.railgun.org` (official)
- **Testing:** `https://ppoi-agg.horsewithsixlegs.xyz`

**File Storage (for artifacts):**
- **Option 1:** Store in repo (200MB+, not ideal)
- **Option 2:** CDN (Cloudflare R2, AWS S3)
- **Recommendation:** Lazy-load from npm package

---

## 7. API Specification

### Authentication
All endpoints require user's RAILGUN address in header:
```
X-RAILGUN-Address: 0zk1qy8xjfdxfesph2jshr67zfd829pwhstdqkxwv5d...
```

### Endpoints

#### POST /api/wallet/create
Create a new RAILGUN wallet (metadata only, keys stay in browser)

**Request:**
```json
{
  "railgunAddress": "0zk1qy8xjfdxfesph2jshr67..."
}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "address": "0zk1qy8xjfdxfesph2jshr67...",
    "createdAt": "2024-10-24T12:00:00Z"
  }
}
```

---

#### GET /api/balance/:railgunAddress
Get balance for a RAILGUN address

**Response:**
```json
{
  "address": "0zk1qy8xjfdxfesph2jshr67...",
  "balances": [
    {
      "tokenAddress": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      "tokenSymbol": "USDC",
      "totalBalance": "1000000000", // 1000 USDC (6 decimals)
      "spendableBalance": "500000000", // 500 USDC
      "pendingBalance": "500000000" // 500 USDC (< 1 hour POI)
    }
  ],
  "lastSyncedBlock": 9482850
}
```

---

#### POST /api/payment/build
Build an unsigned payment transaction

**Request:**
```json
{
  "fromAddress": "0zk1qy8xjfdxfesph2jshr67...",
  "toAddress": "0zk1qy8ny82htznm62dv3479...",
  "tokenAddress": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "amount": "100000000", // 100 USDC
  "memo": "October Salary"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "to": "0xeCFCf3b4eC647c4Ca6D49108b311b7a7C9543fea",
    "data": "0x...", // Unsigned transaction data
    "gasLimit": "250000",
    "maxFeePerGas": "20000000000",
    "maxPriorityFeePerGas": "2000000000"
  },
  "proofInputs": {
    // Data needed for ZK proof generation (client-side)
  },
  "estimatedGasCost": "0.005", // ETH
  "estimatedGasCostUSD": "12.50"
}
```

---

#### POST /api/payment/submit
Record a submitted payment (for history tracking)

**Request:**
```json
{
  "fromAddress": "0zk1qy8xjfdxfesph2jshr67...",
  "toAddress": "0zk1qy8ny82htznm62dv3479...",
  "amount": "100000000",
  "tokenAddress": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "txHash": "0xabc123...",
  "memo": "October Salary"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "payment_123",
    "status": "pending",
    "txHash": "0xabc123...",
    "createdAt": "2024-10-24T12:00:00Z"
  }
}
```

---

#### GET /api/payment/history/:railgunAddress
Get payment history

**Response:**
```json
{
  "payments": [
    {
      "id": "payment_123",
      "direction": "sent",
      "amount": "100000000",
      "tokenSymbol": "USDC",
      "toAddress": "0zk1qy8ny82htznm62...",
      "status": "confirmed",
      "txHash": "0xabc123...",
      "blockNumber": 9482850,
      "timestamp": "2024-10-24T12:00:00Z",
      "memo": "October Salary"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

---

#### POST /api/shield/build
Build a shield transaction (public → private)

**Request:**
```json
{
  "fromAddress": "0x0E6ed89a0c1902a254850d6436f2FC00977dB17f", // MetaMask
  "railgunAddress": "0zk1qy8xjfdxfesph2jshr67...",
  "tokenAddress": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "amount": "500000000" // 500 USDC
}
```

**Response:**
```json
{
  "success": true,
  "approvalTransaction": {
    // First, user must approve RAILGUN contract to spend tokens
    "to": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "data": "0x095ea7b3...", // approve() function call
  },
  "shieldTransaction": {
    // Then, shield the tokens
    "to": "0xeCFCf3b4eC647c4Ca6D49108b311b7a7C9543fea",
    "data": "0x...",
    "value": "0",
    "gasLimit": "300000"
  },
  "fee": "1250000", // 0.25% = 1.25 USDC
  "netAmount": "498750000" // 498.75 USDC after fee
}
```

---

#### GET /api/poi/status/:railgunAddress
Check POI validation status

**Response:**
```json
{
  "address": "0zk1qy8xjfdxfesph2jshr67...",
  "poiStatus": {
    "isValidated": true,
    "validatedAt": "2024-10-24T11:00:00Z",
    "canSpend": true,
    "pendingValidation": false
  },
  "utxos": [
    {
      "position": "0:2383",
      "poiStatus": "Valid",
      "canSpend": true,
      "shieldedAt": "2024-10-24T10:00:00Z",
      "spendableAt": "2024-10-24T11:00:00Z"
    }
  ]
}
```

---

## 8. Database Schema

### PostgreSQL Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User/Wallet Registry (No private keys!)
model Wallet {
  id              String    @id @default(cuid())
  railgunAddress  String    @unique
  createdAt       DateTime  @default(now())
  lastActiveAt    DateTime  @updatedAt

  // Optional: Store public Ethereum address if user connects MetaMask
  ethereumAddress String?

  // Relationships
  sentPayments     Payment[] @relation("SentPayments")
  receivedPayments Payment[] @relation("ReceivedPayments")
  employees        Employee[]

  @@index([railgunAddress])
}

// Employee Records (for employer's reference)
model Employee {
  id              String   @id @default(cuid())
  employerId      String
  employer        Wallet   @relation(fields: [employerId], references: [id])

  railgunAddress  String
  name            String?  // Optional: Employer can add name
  email           String?  // Optional: For notifications

  createdAt       DateTime @default(now())
  active          Boolean  @default(true)

  @@index([employerId])
  @@index([railgunAddress])
}

// Payment Records (Public metadata only, amounts are private)
model Payment {
  id              String   @id @default(cuid())

  fromWalletId    String
  fromWallet      Wallet   @relation("SentPayments", fields: [fromWalletId], references: [id])

  toWalletId      String?  // Nullable if recipient not in our system
  toWallet        Wallet?  @relation("ReceivedPayments", fields: [toWalletId], references: [id])
  toAddress       String   // RAILGUN address (always store this)

  // Transaction details
  txHash          String   @unique
  blockNumber     Int?
  status          PaymentStatus @default(PENDING)

  // Token info
  tokenAddress    String
  tokenSymbol     String   @default("USDC")

  // NOTE: Amount is NOT stored! Privacy!
  // Frontend can decrypt from UTXOs using user's keys

  // Metadata
  memo            String?  // Optional encrypted memo
  createdAt       DateTime @default(now())
  confirmedAt     DateTime?

  @@index([fromWalletId])
  @@index([toWalletId])
  @@index([txHash])
  @@index([status])
}

enum PaymentStatus {
  PENDING      // Submitted to blockchain
  CONFIRMED    // Confirmed on-chain
  FAILED       // Reverted
}

// Merkletree sync status (for backend)
model MerkletreeSyncStatus {
  id              String   @id @default(cuid())
  chainId         Int      @unique
  lastSyncedBlock Int
  lastSyncedAt    DateTime @updatedAt

  @@index([chainId])
}

// POI Status Cache (avoid repeated aggregator queries)
model POIStatusCache {
  id              String   @id @default(cuid())
  blindedCommitment String @unique
  listKey         String
  status          String   // "Valid", "ShieldBlocked", etc.

  cachedAt        DateTime @default(now())
  expiresAt       DateTime // Refresh after 1 hour

  @@index([blindedCommitment])
}
```

---

## 9. Deployment Strategy

### Development Environment

```bash
# Frontend (localhost:3000)
cd frontend
npm install
npm run dev

# Backend (localhost:3001)
cd backend
npm install
npm run dev

# Database (localhost:5432)
docker-compose up -d postgres
```

### Production Deployment

#### Frontend: Vercel
```bash
# Deploy with one command
vercel --prod

# Environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://api.yourapp.com
# NEXT_PUBLIC_CHAIN_ID=1
# NEXT_PUBLIC_POI_AGGREGATOR=https://poi.railgun.org
```

#### Backend: Railway.app
```bash
# Connect GitHub repo
# Railway auto-deploys on push to main branch

# Environment variables in Railway:
# DATABASE_URL=postgresql://...
# ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
# POI_AGGREGATOR_URL=https://poi.railgun.org
# PORT=3001
```

#### Database: Railway PostgreSQL
- Provision PostgreSQL addon in Railway
- Auto-generates DATABASE_URL
- Automatic backups

### Monitoring & Observability

**Error Tracking:** Sentry
- Track frontend errors (proof generation failures, etc.)
- Track backend errors (RPC timeouts, database issues)

**Analytics:** PostHog or Mixpanel
- Track user journeys (onboarding completion rate)
- Monitor payment success rates
- Identify UX bottlenecks

**Uptime Monitoring:** BetterUptime
- Alert if backend goes down
- Monitor RPC endpoint health

---

## 10. Security Considerations

### Frontend Security

**localStorage Encryption:**
```typescript
// NEVER store plaintext mnemonic
❌ localStorage.setItem('mnemonic', mnemonic);

// ALWAYS encrypt first
✅ const encrypted = CryptoJS.AES.encrypt(mnemonic, password);
   localStorage.setItem('wallet', encrypted.toString());
```

**Auto-lock Wallet:**
```typescript
// Lock wallet after 15 minutes of inactivity
let lockTimer;

function resetLockTimer() {
  clearTimeout(lockTimer);
  lockTimer = setTimeout(() => {
    // Clear decrypted keys from memory
    lockWallet();
  }, 15 * 60 * 1000);
}

document.addEventListener('click', resetLockTimer);
document.addEventListener('keypress', resetLockTimer);
```

**Content Security Policy:**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://*.alchemy.com https://poi.railgun.org"
          }
        ]
      }
    ];
  }
};
```

### Backend Security

**Rate Limiting:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

**Input Validation:**
```typescript
import { z } from 'zod';

const paymentSchema = z.object({
  fromAddress: z.string().regex(/^0zk1q[a-z0-9]{104}$/),
  toAddress: z.string().regex(/^0zk1q[a-z0-9]{104}$/),
  amount: z.string().regex(/^\d+$/),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

app.post('/api/payment/build', (req, res) => {
  try {
    const validated = paymentSchema.parse(req.body);
    // Process payment...
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input' });
  }
});
```

**Environment Variables:**
```bash
# .env (NEVER commit to git!)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_API_KEY=your_key_here

# Use in code:
if (!process.env.ALCHEMY_API_KEY) {
  throw new Error('ALCHEMY_API_KEY not set');
}
```

### Attack Vectors & Mitigations

| Attack | Description | Mitigation |
|--------|-------------|------------|
| **XSS** | Inject malicious script to steal keys | Content Security Policy, sanitize all inputs |
| **MITM** | Intercept traffic to steal data | HTTPS only, HSTS headers |
| **Phishing** | Fake website tricks user into entering mnemonic | Educate users, verify domain, use hardware wallets |
| **Brute Force** | Try many passwords | Rate limiting, strong password requirements |
| **Replay Attack** | Resubmit old signed transaction | Nonce verification, timestamp checks |
| **SQL Injection** | Inject malicious SQL | Use Prisma ORM (auto-escapes), validate inputs |

---

## Appendix A: Comparison with Alternatives

### Why RAILGUN vs Other Privacy Solutions?

| Solution | Privacy Level | Compliance | UX | Cost |
|----------|---------------|------------|-----|------|
| **RAILGUN** | High (ZK-SNARKs) | ✅ POI built-in | Medium | 0.25% shield fee |
| Tornado Cash | High (ZK-SNARKs) | ❌ Sanctioned by US | Medium | Fixed pools |
| Aztec | High (ZK-rollup) | ⚠️  Not payroll-focused | Complex | Low gas |
| Zcash | Very High (Shielded pools) | ✅ Regulated | Hard (own chain) | Mining fees |
| Monero | Very High (Ring sigs) | ⚠️  Delisting risk | Medium (own chain) | Low fees |
| Normal transfers | None | ✅ Fully public | Easy | Low gas |

**RAILGUN wins for payroll because:**
1. ✅ Built-in compliance (POI)
2. ✅ Works on Ethereum (existing ecosystem)
3. ✅ Strong privacy (amounts hidden)
4. ✅ Developer-friendly SDK

---

## Appendix B: Cost Analysis

### Per-Transaction Costs

**Shield (Public → Private):**
- Gas: ~200,000 gas × 20 gwei = 0.004 ETH (~$10)
- RAILGUN fee: 0.25% of amount (e.g., $1.25 on $500)
- **Total: ~$11.25 per shield**

**Private Transfer:**
- Gas: ~250,000 gas × 20 gwei = 0.005 ETH (~$12.50)
- RAILGUN fee: $0 (no fee on transfers!)
- **Total: ~$12.50 per transfer**

**Unshield (Private → Public):**
- Gas: ~200,000 gas × 20 gwei = 0.004 ETH (~$10)
- RAILGUN fee: $0
- **Total: ~$10 per unshield**

### Monthly Cost Example (100 Employees)

**Scenario:** Company pays 100 employees monthly

**Option 1: Individual Payments**
- Shield once: $11.25
- 100 transfers: 100 × $12.50 = $1,250
- **Total: $1,261.25/month**

**Option 2: With Batching (Proposed Enhancement)**
- Shield once: $11.25
- 1 batch transfer (100 recipients): ~$50 (optimized)
- **Total: ~$61.25/month** ⭐

**Comparison to Traditional:**
- Bank wire: $25 × 100 = $2,500/month
- Crypto (public): 100 × $2 gas = $200/month (but NO privacy)

**RAILGUN is cost-effective vs traditional finance!**

---

## Appendix C: Roadmap & Future Enhancements

### Phase 1: MVP (Current Scope)
- ✅ Employer wallet creation
- ✅ Shield tokens
- ✅ Single employee payment
- ✅ Employee wallet & receive
- ✅ Transaction history

### Phase 2: Production Features
- 🔲 Batch payments (multiple employees in one tx)
- 🔲 Recurring payments (scheduled payroll)
- 🔲 Multi-token support (DAI, USDT, etc.)
- 🔲 CSV export (for accounting)
- 🔲 Email notifications
- 🔲 Mobile app (React Native)

### Phase 3: Advanced Features
- 🔲 Hardware wallet support (Ledger, Trezor)
- 🔲 Multi-sig employer wallets (require 2/3 approvals)
- 🔲 Compliance dashboard (audit trails)
- 🔲 Tax reporting integration
- 🔲 Employee self-service portal
- 🔲 L2 support (Arbitrum, Optimism)

### Phase 4: Enterprise
- 🔲 Whitelabel solution for payroll companies
- 🔲 API for third-party integrations
- 🔲 Custom POI lists for specific industries
- 🔲 SLA guarantees & support contracts

---

## Appendix D: Testing Strategy

### Unit Tests
```typescript
// Example: Test balance calculation
describe('Balance Calculator', () => {
  it('should calculate spendable balance correctly', async () => {
    const utxos = [
      { value: 100n, poiStatus: 'Valid', shieldedAt: Date.now() - 2 * 60 * 60 * 1000 },
      { value: 50n, poiStatus: 'Valid', shieldedAt: Date.now() - 30 * 60 * 1000 },
    ];

    const balance = await calculateSpendableBalance(utxos);

    expect(balance).toBe(100n); // Only first UTXO is > 1 hour old
  });
});
```

### Integration Tests
```typescript
// Example: Test full payment flow
describe('Payment Flow', () => {
  it('should complete payment from employer to employee', async () => {
    // 1. Shield tokens
    const shieldTx = await shield(employerAddress, 100);
    await shieldTx.wait();

    // 2. Wait for POI validation
    await sleep(60 * 60 * 1000); // 1 hour

    // 3. Send payment
    const payment = await sendPayment(employerAddress, employeeAddress, 50);
    await payment.wait();

    // 4. Verify employee received
    const employeeBalance = await getBalance(employeeAddress);
    expect(employeeBalance).toBe(50n);
  });
});
```

### E2E Tests (Playwright)
```typescript
// Example: Test user journey
test('Employer can pay employee', async ({ page }) => {
  // Visit app
  await page.goto('http://localhost:3000');

  // Create wallet
  await page.click('button:text("Create RAILGUN Wallet")');
  await page.fill('input[name="password"]', 'test1234');
  await page.click('button:text("Create")');

  // Wait for wallet creation
  await page.waitForSelector('text=Wallet Created');

  // Initiate payment
  await page.click('button:text("Pay Employee")');
  await page.fill('input[name="employee"]', '0zk1q...');
  await page.fill('input[name="amount"]', '100');
  await page.click('button:text("Send")');

  // Confirm payment
  await page.waitForSelector('text=Payment Sent');
});
```

---

**END OF SPECIFICATION**

*This document serves as the architectural blueprint for the RAILGUN Private Payroll System. All implementation should follow these specifications to ensure security, privacy, and user experience standards are met.*

---

## Questions or Clarifications?

If you need any section expanded or have questions about the architecture, please ask!
