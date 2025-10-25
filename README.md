# Payload - Private Payroll

A privacy-first payroll system using RAILGUN on Ethereum Sepolia testnet.

## Project Structure

```
payload/
├── frontend/          # Next.js 14 app (Employer & Individual portals)
├── scripts/           # RAILGUN testing & operational scripts
├── shared/            # Shared TypeScript types
├── docs/              # Specifications and architecture docs
└── db/                # Local RAILGUN database (merkletree & wallet data)
```

## What This Does

Privacy-first payroll system that allows employers to pay employees using zero-knowledge proofs, keeping amounts and identities private on-chain.

## Features

- Shield ERC-20 tokens (make them private on RAILGUN)
- Check private balances with POI validation status
- Transfer tokens privately between RAILGUN wallets
- All transactions use zero-knowledge proofs to maintain privacy

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create `.env` file (see `.env.example`)

3. Get testnet tokens:
   - Get Sepolia ETH from a faucet
   - Get test USDC (address in `.env.example`)

## Quick Start

### Frontend (Web App)

```bash
cd frontend
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Scripts (Testing)

```bash
# Shield tokens
yarn ts-node scripts/test-shield.ts

# Transfer privately (wait 1 hour after shielding)
yarn ts-node scripts/transfer.ts
```

## How It Works

1. **Shielding**: Regular ERC-20 tokens are deposited into RAILGUN, creating private "notes" that only you can decrypt
2. **POI Validation**: RAILGUN uses a 1-hour validation period to ensure funds are not from sanctioned addresses
3. **Private Transfer**: Zero-knowledge proofs allow you to transfer without revealing amounts or identities on-chain
4. **Employee Receives**: Employee's RAILGUN wallet detects and decrypts the incoming private note

## Current Status

### ✅ Completed
- Frontend UI with Employer & Individual portals
- Wallet connection (wagmi + MetaMask)
- Landing page, navigation, routing
- Test scripts for RAILGUN operations (shield, transfer)
- Shared type definitions
- Placeholder pages for all routes

### 🚧 In Progress
- RAILGUN client-side integration
- Shield/Unshield functionality
- Employee management CRUD

### 📋 Next Steps
- Connect RAILGUN SDK to frontend
- Implement shield/unshield buttons
- Build employee management page with add/edit/delete
- Real-time balance updates from RAILGUN
- Private transfer flow for payroll processing

## Key Concepts

- **0zk address**: RAILGUN's private address format (starts with `0zk1`)
- **POI (Private Proof of Innocence)**: Privacy-preserving compliance mechanism
- **UTXO**: Unspent Transaction Output - similar to Bitcoin's model
- **boundParamsHash**: Hash that binds the ZK proof to specific transaction parameters

## Troubleshooting

### "No spendable balance"
Wait 1 hour after shielding for POI validation to complete.

### "Invalid Snark Proof"
Ensure `overallBatchMinGasPrice` matches between proof generation and transaction submission.

### Background sync errors
These are warnings about historical blockchain data and can be ignored. The script will exit cleanly with `process.exit(0)`.

## Notes

- This is a testnet-only implementation
- Never commit your `.env` file or private keys
- The employee wallet in this test uses a standard test mnemonic - in production, employees provide their own 0zk addresses
