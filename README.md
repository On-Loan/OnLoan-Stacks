# OnLoan — Peer-to-Peer Lending on Stacks

> Multi-asset lending and borrowing powered by Clarity smart contracts, sBTC, USDCx, STX, and real-time Pyth oracle pricing.

![Stacks](https://img.shields.io/badge/Stacks-Blockchain-orange)
![Clarity](https://img.shields.io/badge/Smart%20Contracts-Clarity-orange)
![sBTC](https://img.shields.io/badge/sBTC-Bitcoin%20Peg-F7931A)
![MVP](https://img.shields.io/badge/Stage-MVP-yellow)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

---

## What is OnLoan?

**OnLoan** is a decentralized peer-to-peer lending protocol built on the [Stacks blockchain](https://www.stacks.co/). It enables users to:

- **Lend USDCx, sBTC, or STX** into lending pools and earn yield
- **Borrow USDCx** by depositing **sBTC** or **STX** as collateral
- **See real-time quotes** — instantly preview how much USDCx you'll receive based on your collateral, powered by Pyth oracle
- **Manage positions** with transparent, on-chain collateral ratios and automated liquidation

All protocol logic lives in **Clarity smart contracts** — there is no backend server. The architecture is **frontend + smart contracts only**, making the protocol fully trustless and auditable.

### Supported Assets

| Asset | Role | Standard | Contract |
|-------|------|----------|----------|
| **sBTC** | Collateral & Lendable | SIP-010 | `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token` |
| **USDCx** | Primary Lendable & Borrowable | SIP-010 | Stacks-native USDC |
| **STX** | Collateral & Lendable | Native | Stacks native token |

### Design Philosophy

OnLoan draws inspiration from [Zest Protocol](https://www.zestprotocol.com/) — the leading lending protocol built for Bitcoin on Stacks — and improves upon areas where user experience and flexibility can be enhanced:

| Area | Zest Protocol | OnLoan (Improvements) |
|------|--------------|----------------------|
| Collateral types | BTC-focused | sBTC + STX multi-collateral |
| Lendable assets | BTC-centric | USDCx, sBTC, and STX |
| Liquidation | Basic threshold liquidation | Graduated liquidation with grace periods |
| Oracle | Single-source pricing | Pyth Network multi-source aggregated feeds |
| UX | Functional, finance-forward | Orange-themed, lovable, mobile-first design |
| Architecture | Backend-assisted | Pure frontend + Clarity (no backend) |
| Pool management | Rigid pool structures | Flexible multi-asset pools with configurable terms |
| Onboarding | Dashboard-only | Landing page → Dashboard conversion flow |

### Visual Identity

OnLoan uses a warm **orange-dominant** color palette with a **lovable, approachable** design aesthetic inspired by Zest's clean DeFi interface, but with friendlier onboarding and mobile-first responsive design. Think approachable DeFi — not intimidating finance dashboards.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js SPA)                  │
│                                                            │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────────┐   │
│  │ Landing Page│  │   Dashboard   │  │  Mobile Views  │   │
│  │ (marketing) │  │ (lend/borrow) │  │  (responsive)  │   │
│  └─────────────┘  └───────────────┘  └────────────────┘   │
│                                                            │
│  Stacks.js (@stacks/connect, @stacks/transactions)        │
│  Leather / Xverse Wallet  •  Pyth SDK  •  TailwindCSS     │
└───────────────────────┬──────────────────────────────────┘
                        │ Contract Calls / Read-Only Queries
                        │
┌───────────────────────▼──────────────────────────────────┐
│                  Stacks Blockchain                        │
│                                                           │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │ lending-    │  │  collateral-  │  │  liquidation-  │  │
│  │ pool.clar   │  │  manager.clar │  │  engine.clar   │  │
│  └──────┬──────┘  └───────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
│  ┌──────▼─────────────────▼───────────────────▼────────┐ │
│  │               onloan-core.clar                       │ │
│  │    (Governance, Access Control, Asset Registry)      │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │                                  │
│  ┌─────────────────────▼───────────────────────────────┐ │
│  │            pyth-oracle-adapter.clar                  │ │
│  │      (Pyth Network Price Feed Integration)          │ │
│  │      BTC/USD • STX/USD price feeds                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Tokens: sBTC (SIP-010) • USDCx (SIP-010) • STX (native) │
└───────────────────────────────────────────────────────────┘
```

---

## Key Features (MVP Scope)

### Landing Page
- Protocol overview with clear value proposition
- Live protocol stats (TVL, total borrowed, total lenders)
- Quick-start call-to-action → Dashboard
- Mobile-responsive hero, features section, and footer

### Dashboard
- **Lend** — Deposit USDCx, sBTC, or STX into lending pools and earn yield
- **Borrow** — Deposit sBTC or STX collateral, instantly preview how much USDCx you can borrow (Pyth-powered), and execute
- **Positions** — View and manage active lending and borrowing positions with health factor gauges
- **Liquidate** — Browse liquidatable positions and execute for profit

### Lending
- Deposit USDCx, sBTC, or STX into asset-specific lending pools
- Earn yield from borrower interest payments
- Withdraw deposits + accrued interest
- View pool utilization and APY per asset

### Borrowing
- Deposit sBTC or STX as collateral
- **Real-time quote preview**: see exactly how much USDCx you'll get before committing
- Configurable loan-to-value (LTV) ratios per collateral type
- Repay loans partially or fully
- Reclaim collateral after repayment

### Collateral & Liquidation
- Real-time collateral value via Pyth Network oracle (BTC/USD, STX/USD)
- Health factor monitoring per position
- Graduated liquidation: warning → partial liquidation → full liquidation
- Liquidator incentives (discount on seized collateral)

### Oracle Integration
- Pyth Network price feeds for BTC/USD and STX/USD
- Staleness checks on price data
- Confidence interval validation
- Fallback handling for oracle downtime

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Stacks (Bitcoin L2) |
| **Smart Contracts** | Clarity |
| **sBTC** | `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token` (SIP-010) |
| **Frontend** | Next.js 14+ with App Router / React 18+ |
| **Styling** | TailwindCSS + custom orange design system |
| **Wallets** | Leather & Xverse (via `@stacks/connect`) |
| **SDK** | Stacks.js (`@stacks/transactions`, `@stacks/connect`, `@stacks/network`) |
| **sBTC Bridge** | `sbtc` npm package (for deposit/withdraw flows) |
| **Oracle** | Pyth Network |
| **Contract Testing** | Clarinet 3.x + `@stacks/clarinet-sdk` + Vitest |
| **Frontend Testing** | Vitest + React Testing Library |
| **Fuzz Testing** | fast-check (property-based) |
| **Deployment** | Clarinet (contracts), Vercel (frontend) |

---

## Project Structure

```
OnLoan-Stacks/
├── contracts/                       # Clarity smart contracts
│   ├── onloan-core.clar            # Core: governance, asset registry, access control
│   ├── lending-pool.clar           # Multi-asset lending pools: deposits, interest
│   ├── collateral-manager.clar     # Collateral management: sBTC + STX, health factors
│   ├── liquidation-engine.clar     # Graduated liquidation execution
│   ├── pyth-oracle-adapter.clar    # Pyth Network price feed wrapper
│   └── traits/
│       ├── sip-010-trait.clar      # SIP-010 fungible token trait
│       ├── oracle-trait.clar       # Oracle adapter trait (swappable)
│       └── pool-trait.clar         # Lending pool trait
│
├── frontend/                        # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout + wallet providers
│   │   │   ├── page.tsx            # Landing page (marketing)
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx      # Dashboard shell (sidebar/nav)
│   │   │       ├── page.tsx        # Dashboard overview
│   │   │       ├── lend/page.tsx   # Lending interface
│   │   │       ├── borrow/page.tsx # Borrowing + quote preview
│   │   │       ├── positions/page.tsx # Position management
│   │   │       └── liquidate/page.tsx # Liquidation opportunities
│   │   │
│   │   ├── components/
│   │   │   ├── landing/            # Landing page sections
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── Stats.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   └── CTA.tsx
│   │   │   ├── ui/                 # Design system (orange theme)
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   └── Select.tsx
│   │   │   ├── dashboard/          # Dashboard chrome
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── MobileNav.tsx
│   │   │   │   └── StatsBar.tsx
│   │   │   ├── lending/
│   │   │   │   ├── DepositForm.tsx
│   │   │   │   ├── WithdrawForm.tsx
│   │   │   │   ├── PoolStats.tsx
│   │   │   │   └── AssetPoolCard.tsx
│   │   │   ├── borrowing/
│   │   │   │   ├── CollateralDeposit.tsx
│   │   │   │   ├── BorrowQuotePreview.tsx  # Real-time Pyth quote
│   │   │   │   ├── BorrowForm.tsx
│   │   │   │   ├── RepayForm.tsx
│   │   │   │   ├── HealthFactorGauge.tsx
│   │   │   │   └── LTVBar.tsx
│   │   │   ├── positions/
│   │   │   │   ├── PositionCard.tsx
│   │   │   │   ├── PositionList.tsx
│   │   │   │   └── PositionDetails.tsx
│   │   │   ├── liquidation/
│   │   │   │   ├── LiquidatableList.tsx
│   │   │   │   └── LiquidateAction.tsx
│   │   │   └── common/
│   │   │       ├── Navbar.tsx
│   │   │       ├── WalletConnect.tsx   # Leather + Xverse
│   │   │       ├── Footer.tsx
│   │   │       ├── TransactionToast.tsx
│   │   │       ├── PriceDisplay.tsx    # Live Pyth price ticker
│   │   │       ├── AssetIcon.tsx       # sBTC / USDCx / STX icons
│   │   │       └── MobileBottomNav.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useWallet.ts           # Wallet connection (Leather/Xverse)
│   │   │   ├── useDeposit.ts          # Lending deposit transaction
│   │   │   ├── useWithdraw.ts         # Lending withdrawal
│   │   │   ├── useBorrow.ts           # Borrow execution
│   │   │   ├── useRepay.ts            # Loan repayment
│   │   │   ├── useCollateral.ts       # Collateral deposit/withdraw
│   │   │   ├── useLiquidate.ts        # Liquidation execution
│   │   │   ├── usePoolData.ts         # Read-only pool stats
│   │   │   ├── usePosition.ts         # Read-only position data
│   │   │   ├── useOraclePrice.ts      # Pyth oracle price data
│   │   │   ├── useHealthFactor.ts     # Health factor calculation
│   │   │   └── useBorrowQuote.ts      # Real-time borrow preview
│   │   │
│   │   ├── lib/
│   │   │   ├── stacks.ts             # Network config + helpers
│   │   │   ├── contracts.ts          # Contract call builders using Cl helpers
│   │   │   ├── pyth.ts               # Pyth oracle SDK + REST API
│   │   │   ├── tokens.ts             # sBTC, USDCx, STX token metadata
│   │   │   ├── formatting.ts         # Number/currency formatting
│   │   │   └── constants.ts          # Contract addresses, feed IDs, config
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── public/
│   │   ├── logo.svg
│   │   ├── og-image.png
│   │   └── icons/
│   │       ├── sbtc.svg
│   │       ├── usdcx.svg
│   │       └── stx.svg
│   │
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── package.json
│
├── tests/                            # Contract tests (Clarinet SDK + Vitest)
│   ├── onloan-core.test.ts
│   ├── lending-pool.test.ts
│   ├── collateral-manager.test.ts
│   ├── liquidation-engine.test.ts
│   ├── pyth-oracle-adapter.test.ts
│   ├── integration/
│   │   ├── borrow-lifecycle.test.ts
│   │   ├── liquidation-flow.test.ts
│   │   ├── multi-asset-pool.test.ts
│   │   └── oracle-failure.test.ts
│   ├── fuzz/
│   │   ├── interest-calculation.test.ts
│   │   ├── health-factor.test.ts
│   │   ├── liquidation-amounts.test.ts
│   │   └── ltv-boundaries.test.ts
│   └── helpers/
│       └── test-utils.ts
│
├── settings/
│   └── Devnet.toml
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   └── GENERATION_PROMPT.md
│
├── Clarinet.toml
├── package.json                      # Root: Clarinet SDK + Vitest
├── vitest.config.ts                  # Root Vitest config for contract tests
├── tsconfig.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## Quick Start

### Prerequisites

- [Clarinet](https://github.com/stx-labs/clarinet) **v3.x** (`brew install clarinet`)
- [Node.js](https://nodejs.org/) v18+
- [Leather](https://leather.io/) or [Xverse](https://www.xverse.app/) wallet browser extension

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/OnLoan-Stacks.git
cd OnLoan-Stacks

# Install root dependencies (Clarinet SDK + Vitest for contract tests)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Add sBTC contract requirement (if not already in Clarinet.toml)
clarinet requirements add SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit

# Verify all contracts compile
clarinet check

# Run contract tests
npm test

# Start local devnet (wallets auto-funded with sBTC + STX)
clarinet devnet start

# In another terminal, start the frontend
cd frontend && npm run dev
```

### First-Time Flow

1. Open `http://localhost:3000` — you'll land on the **marketing landing page**
2. Click **Launch App** → routes to `/dashboard`
3. Connect your **Leather** or **Xverse** wallet
4. Your devnet wallet is pre-funded with sBTC and STX
5. Try **Lend** — deposit USDCx into a pool
6. Try **Borrow** — deposit STX collateral, see the real-time USDCx quote, borrow
7. Check **Positions** — monitor health factor

---

## Smart Contract Overview

### `onloan-core.clar`
Protocol-level constants, error codes, access control (contract owner, authorized callers), governance parameters (LTV ratios per collateral type, interest rates, liquidation thresholds), and the asset registry mapping supported tokens.

### `lending-pool.clar`
Manages multi-asset lending pools (USDCx, sBTC, STX). Handles lender deposits, withdrawal requests, interest accrual calculations, and pool utilization tracking per asset. Interest rates adjust based on utilization curves.

### `collateral-manager.clar`
Handles sBTC and STX collateral deposits and withdrawals. Tracks per-user, per-collateral-type positions. Calculates health factors using Pyth oracle prices with asset-specific LTV ratios. Enforces minimum collateral requirements before allowing borrowing.

### `liquidation-engine.clar`
Monitors position health factors. When a position falls below the liquidation threshold, enables liquidators to seize collateral at a discount. Uses graduated liquidation (partial → full) to give borrowers a chance to add collateral.

### `pyth-oracle-adapter.clar`
Wraps Pyth Network price feeds (BTC/USD, STX/USD) for use by other contracts. Validates price freshness (staleness checks), confidence intervals, and provides a clean interface via the `oracle-trait`.

---

## Wallet & sBTC Integration

### Wallet Support

OnLoan supports **Leather** and **Xverse** — the two major Stacks wallets — via `@stacks/connect`:

```typescript
import { showConnect } from "@stacks/connect";

showConnect({
  appDetails: { name: "OnLoan", icon: "/logo.svg" },
  onFinish: () => { /* wallet connected */ },
});
```

### sBTC

sBTC is a SIP-010 token that maintains a **1:1 peg with Bitcoin**. On devnet, wallets are automatically funded with sBTC when you run `clarinet devnet start` after adding the sBTC requirement.

```clarity
;; Reference sBTC in your contracts
(define-constant sbtc-token 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)

;; Transfer sBTC using standard SIP-010
(contract-call? sbtc-token transfer amount tx-sender recipient none)
```

For production sBTC bridging (BTC → sBTC), use the [`sbtc` npm package](https://www.npmjs.com/package/sbtc).

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARC
HITECTURE.md) | Smart contract design, multi-asset data flow, and security model |
| [Testing](docs/TESTING.md) | Testing with Clarinet SDK + Vitest, fuzz tests, frontend tests |
| [Deployment](docs/DEPLOYMENT.md) | Deployment playbook for testnet/mainnet + security checklist |
| [Generation Prompt](docs/GENERATION_PROMPT.md) | Complete specification for developers building the MVP |
| [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md) | Frontend design system, UX flows, and product roadmap |

---

## Security Considerations

This is an **MVP** — it has not been audited. Key security measures in place:

- [x] Reentrancy protection via Clarity's design (no reentrancy by default)
- [x] Integer overflow protection (Clarity native)
- [x] Oracle staleness checks with Pyth confidence validation
- [x] Access control on admin functions
- [x] Health factor checks before every borrow operation
- [x] Post-conditions on all token transfers (user asset protection)
- [x] Asset-specific LTV ratios (sBTC vs STX risk profiles)
- [ ] Formal audit (planned post-MVP)
- [ ] Bug bounty program (planned post-MVP)

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full security checklist.

---

## CI

GitHub Actions (`ci.yml`) runs on every push/PR to `main`:
- **Smart Contracts**: `clarinet check` + 79 contract tests (unit, integration, fuzz)
- **Frontend**: Lint → Type-check → Vitest tests → Next.js build

Frontend is deployed automatically via Vercel on push to `main`.

---

## Testnet Deployment

All contracts are deployed on **Stacks testnet**:

| Contract | Address |
|----------|--------|
| `onloan-core` | `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.onloan-core` |
| `lending-pool` | `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.lending-pool` |
| `collateral-manager` | `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.collateral-manager` |
| `liquidation-engine` | `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.liquidation-engine` |
| `pyth-oracle-adapter` | `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.pyth-oracle-adapter` |

sBTC dependency (testnet): `ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token`

### Environment Variables

| Variable | Description | Testnet Value |
|----------|-------------|---------------|
| `NEXT_PUBLIC_CONTRACT_DEPLOYER` | Deployer STX address | `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV` |
| `NEXT_PUBLIC_NETWORK` | Network target | `testnet` |
| `NEXT_PUBLIC_STACKS_API_URL` | Stacks API endpoint | `https://api.testnet.hiro.so` |
| `NEXT_PUBLIC_SBTC_CONTRACT` | sBTC token contract | `ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token` |
| `NEXT_PUBLIC_PYTH_ENDPOINT` | Pyth Hermes API URL | `https://hermes.pyth.network` |

---

## Contributing

OnLoan is a proprietary codebase. To contribute:

1. Read the [Architecture doc](docs/ARCHITECTURE.md) and [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)
2. Check open issues for `good-first-issue` labels
3. Follow the testing guide in [TESTING.md](docs/TESTING.md)
4. Submit PRs against the `develop` branch

All contributions are subject to review and the project's contributor license agreement.

---

<p align="center">
  <strong>OnLoan</strong> — Lending made lovable, powered by Bitcoin.
</p>
