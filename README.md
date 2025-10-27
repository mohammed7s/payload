# Payload - Private Payroll

A privacy-first payroll system using RAILGUN on Ethereum Sepolia testnet.

 **🚀 [Live Demo](https://payload-privacy.netlify.app/)**

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
yarn install
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


## Resources

- **RAILGUN Documentation**: [https://docs.railgun.org/](https://docs.railgun.org/)
- **RAILGUN SDK Guide**: [https://docs.railgun.org/developer-guide/cookbook/](https://docs.railgun.org/developer-guide/cookbook/)
- **Proof of Innocence**: [https://docs.railgun.org/wiki/learn/privacy-system/proof-of-innocence](https://docs.railgun.org/wiki/learn/privacy-system/proof-of-innocence)

## Notes
- This is a testnet-only implementation
- Wallets are managed by backend in this model which is not secure at all


### 📋 Next Steps
- Implement client side wallet management
- Add auth/security to app 
