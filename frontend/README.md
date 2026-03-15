# OnLoan — Frontend

Next.js application for the OnLoan lending and borrowing protocol on Stacks.

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

See `.env.example` for all required variables. Key settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_NETWORK` | `testnet` or `mainnet` |
| `NEXT_PUBLIC_CONTRACT_DEPLOYER` | Deployer STX address |
| `NEXT_PUBLIC_STACKS_API_URL` | Stacks API endpoint |
| `NEXT_PUBLIC_SBTC_CONTRACT` | sBTC token contract address |
| `NEXT_PUBLIC_USDCX_CONTRACT` | USDCx token contract address |
| `NEXT_PUBLIC_PYTH_ENDPOINT` | Pyth Hermes API URL |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Landing page
│   └── dashboard/        # Dashboard pages (lend, borrow, positions, liquidate)
├── components/
│   ├── landing/          # Landing page sections (Hero, Stats, Features, etc.)
│   ├── dashboard/        # Sidebar, Header, MobileNav
│   ├── lending/          # Deposit and withdraw forms
│   ├── borrowing/        # Collateral deposit, borrow quote, borrow form
│   ├── positions/        # Position cards and lists
│   ├── liquidation/      # Liquidation UI
│   └── ui/               # Design system (Button, Card, Input, etc.)
├── hooks/                # React hooks for contract interactions
│   ├── useBalances.ts    # Wallet balance fetching
│   ├── useBorrow.ts      # Borrow transaction flow
│   ├── useBorrowQuote.ts # Real-time borrow quote with Pyth fallback
│   ├── useDeposit.ts     # Lending deposit
│   └── ...
├── lib/
│   ├── constants.ts      # Contract addresses, asset configs
│   ├── format.ts         # Number/currency formatting
│   └── stacks.ts         # Network configuration
└── providers/            # Wallet and network context providers
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

39 tests covering components and hooks using Vitest + React Testing Library.

## Build

```bash
npm run build
```
