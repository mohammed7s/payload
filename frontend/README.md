# Payload Frontend

Privacy-first payroll interface built with Next.js 14.

## Tech Stack

- **Next.js 14** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library

## Design Principles

- ⚫ Minimal black and white aesthetic
- 🔐 Cypherpunk/code font (monospace)
- 🎯 Clean, focused UI
- 🚀 Fast and lightweight

## Getting Started

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build
yarn start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
frontend/
├── app/                    # Next.js app router
│   ├── page.tsx           # Landing page
│   ├── employer/          # Employer portal
│   │   ├── page.tsx       # Dashboard
│   │   ├── employees/     # Employee management
│   │   ├── compliance/    # Compliance view
│   │   └── reports/       # Reports
│   └── individual/        # Employee portal (TODO)
├── components/            # Reusable components
│   └── EmployerSidebar.tsx
└── globals.css           # Global styles
```

## Current Features

### ✅ Completed
- Landing page with "Enter App" CTA
- Employer dashboard layout
- Sidebar navigation (Dashboard, Employees, Compliance, Reports)
- Balance display (Ethereum + Shielded)
- Employee table view
- Payroll processing widget (Shield → Transfer flow)
- Token selection (USDC/PYUSD)

### 🚧 In Progress
- Wallet connection (MetaMask/WalletConnect)
- RAILGUN integration
- Employee management page

### 📋 TODO
- Individual/employee view
- Supabase integration for employee directory
- Real-time balance updates
- Transaction history
- POI status indicators
