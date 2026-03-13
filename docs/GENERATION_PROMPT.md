# OnLoan — Generation Prompt (Builder Specification)

> Complete developer specification for building OnLoan, a peer-to-peer lending protocol on Stacks. This document serves as a self-contained prompt/blueprint for generating the entire project — smart contracts, frontend, and infrastructure.

---

## Project Overview

**OnLoan** is a decentralized lending and borrowing protocol built on the Stacks blockchain. It enables users to:

- **Lend** USDCx, sBTC, and STX to earn yield
- **Borrow** USDCx against sBTC or STX collateral
- **Preview** real-time borrow quotes powered by Pyth oracle feeds
- **Liquidate** undercollateralized positions for profit

The protocol follows the design patterns of [Zest Protocol](https://www.zestprotocol.com/) — the leading lending protocol built for Bitcoin on Stacks.

### Core Design Principles

1. **Bitcoin-native**: sBTC (1:1 BTC peg) as primary collateral
2. **Multi-asset**: Support sBTC, STX, and USDCx with per-asset risk parameters
3. **Real-time quotes**: Users see exactly how much USDCx they can borrow as they enter collateral amounts
4. **Mobile-first**: Mobile-friendly design with modern UX patterns
5. **Secure by default**: Clarity's built-in protections + conservative protocol parameters

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contracts** | Clarity (Stacks) |
| **Contract Tooling** | Clarinet 3.x |
| **Contract Testing** | Clarinet SDK (`@stacks/clarinet-sdk`) + Vitest |
| **Frontend** | Next.js 14+ (App Router) |
| **Styling** | Tailwind CSS |
| **Wallet** | Leather + Xverse via `@stacks/connect` |
| **Stacks SDK** | `@stacks/transactions`, `@stacks/network` |
| **sBTC Bridge** | `sbtc` npm package |
| **Oracle** | Pyth Network (BTC/USD, STX/USD) |
| **Deployment** | Vercel (frontend), Clarinet (contracts) |

---

## Supported Assets

| Asset | Type | Lendable | Collateral | LTV | Liquidation Threshold |
|-------|------|----------|------------|-----|----------------------|
| **sBTC** | SIP-010 | Yes | Yes | 75% | 80% |
| **STX** | Native | Yes | Yes | 60% | 70% |
| **USDCx** | SIP-010 | Yes | No | — | — |

### Asset Details

- **sBTC**: SIP-010 fungible token at `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token`. 1:1 peg with Bitcoin. 8 decimal places (satoshi precision). Transfer via SIP-010 `transfer` function.
- **STX**: Native Stacks token. 6 decimal places (micro-STX). Transfer via `stx-transfer?` (NOT SIP-010). Higher volatility → stricter risk parameters (60% LTV vs 75% for sBTC).
- **USDCx**: Stacks-native USDC. SIP-010 fungible token. Primary borrowable asset.

---

## Project Structure

```
OnLoan-Stacks/
├── Clarinet.toml                       # Clarinet 3.x project config
├── package.json                        # Contract test dependencies
├── vitest.config.ts                    # Vitest config for contract tests
├── tsconfig.json                       # TypeScript config
│
├── contracts/
│   ├── traits/
│   │   ├── sip-010-trait.clar          # SIP-010 fungible token trait
│   │   ├── oracle-trait.clar           # Oracle interface trait
│   │   └── pool-trait.clar             # Lending pool trait
│   ├── onloan-core.clar               # Protocol core (ownership, params, asset registry)
│   ├── pyth-oracle-adapter.clar        # Pyth oracle integration
│   ├── lending-pool.clar               # Multi-asset lending pools
│   ├── collateral-manager.clar         # Multi-collateral + borrowing logic
│   └── liquidation-engine.clar         # Liquidation logic
│
├── tests/
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
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   │
│   ├── public/
│   │   ├── onloan-logo.svg
│   │   └── og-image.png
│   │
│   └── src/
│       ├── app/
│       │   ├── layout.tsx              # Root layout (providers, nav)
│       │   ├── page.tsx                # Landing page
│       │   ├── globals.css             # Global styles + Tailwind
│       │   │
│       │   └── dashboard/
│       │       ├── layout.tsx          # Dashboard layout (sidebar, header)
│       │       ├── page.tsx            # Dashboard overview
│       │       ├── lend/
│       │       │   └── page.tsx        # Lending interface
│       │       ├── borrow/
│       │       │   └── page.tsx        # Borrowing + quote preview
│       │       ├── positions/
│       │       │   └── page.tsx        # Active positions management
│       │       └── liquidate/
│       │           └── page.tsx        # Liquidation marketplace
│       │
│       ├── components/
│       │   ├── landing/
│       │   │   ├── Hero.tsx
│       │   │   ├── Features.tsx
│       │   │   ├── HowItWorks.tsx
│       │   │   ├── Stats.tsx
│       │   │   └── CTA.tsx
│       │   ├── dashboard/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   ├── AssetCard.tsx
│       │   │   └── ProtocolStats.tsx
│       │   ├── lending/
│       │   │   ├── DepositForm.tsx
│       │   │   ├── WithdrawForm.tsx
│       │   │   └── PoolTable.tsx
│       │   ├── borrowing/
│       │   │   ├── BorrowForm.tsx
│       │   │   ├── BorrowQuotePreview.tsx  # Real-time USDCx quote
│       │   │   ├── CollateralSelector.tsx   # sBTC / STX toggle
│       │   │   └── RepayForm.tsx
│       │   ├── positions/
│       │   │   ├── PositionCard.tsx
│       │   │   ├── HealthFactorBadge.tsx
│       │   │   └── PositionList.tsx
│       │   ├── liquidation/
│       │   │   ├── LiquidationCard.tsx
│       │   │   └── LiquidationList.tsx
│       │   └── shared/
│       │       ├── ConnectWallet.tsx    # Leather + Xverse
│       │       ├── AssetIcon.tsx
│       │       ├── Modal.tsx
│       │       ├── Tooltip.tsx
│       │       ├── LoadingSpinner.tsx
│       │       └── TransactionToast.tsx
│       │
│       ├── hooks/
│       │   ├── useWallet.ts            # Wallet connection state
│       │   ├── useContractCall.ts      # Generic contract interaction
│       │   ├── useReadOnly.ts          # Read-only contract calls
│       │   ├── useBorrowQuote.ts       # Real-time borrow quote
│       │   ├── usePythPrice.ts         # Pyth oracle price feed
│       │   ├── usePoolStats.ts         # Pool state
│       │   ├── usePositions.ts         # User positions
│       │   └── useLiquidations.ts      # Liquidatable positions
│       │
│       ├── lib/
│       │   ├── stacks.ts              # Stacks network config
│       │   ├── contracts.ts           # Contract addresses + ABIs
│       │   ├── pyth.ts                # Pyth price feed integration
│       │   ├── sbtc.ts                # sBTC bridge helpers
│       │   └── constants.ts           # Protocol constants
│       │
│       ├── providers/
│       │   ├── WalletProvider.tsx
│       │   └── NetworkProvider.tsx
│       │
│       └── types/
│           ├── protocol.ts            # Protocol types
│           ├── assets.ts              # Asset types
│           └── positions.ts           # Position types
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   └── GENERATION_PROMPT.md
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Smart Contract Specifications

### 1. `sip-010-trait.clar`

Standard SIP-010 fungible token trait definition.

```clarity
(define-trait sip-010-trait
  (
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 10) uint))
    (get-decimals () (response uint uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)
```

### 2. `oracle-trait.clar`

```clarity
(define-trait oracle-trait
  (
    (get-price ((string-ascii 10)) (response {price: uint, confidence: uint, timestamp: uint} uint))
  )
)
```

### 3. `onloan-core.clar`

**Purpose**: Protocol ownership, parameter management, asset registry.

**Data Structures**:

```clarity
;; Asset registry — per-asset risk parameters
(define-map asset-config
  (string-ascii 10)
  {
    max-ltv: uint,                 ;; basis points (7500 = 75%)
    liquidation-threshold: uint,    ;; basis points (8000 = 80%)
    liquidation-bonus: uint,        ;; basis points (500 = 5%)
    min-collateral: uint,           ;; minimum collateral in asset units
    is-active: bool,
    is-collateral-enabled: bool,
    is-borrow-enabled: bool
  }
)

;; Protocol parameters
(define-data-var contract-owner principal tx-sender)
(define-data-var protocol-paused bool false)
(define-data-var base-interest-rate uint u200)      ;; 2%
(define-data-var optimal-utilization uint u8000)     ;; 80%
(define-data-var slope1 uint u400)                   ;; 4% below optimal
(define-data-var slope2 uint u7500)                  ;; 75% above optimal
```

**Public Functions**:
- `set-asset-config (asset-id, config)` — Register/update asset (owner only)
- `set-protocol-paused (paused)` — Emergency pause (owner only)
- `set-base-interest-rate (rate)` — Update interest rate
- `transfer-ownership (new-owner)` — Transfer ownership

**Read-Only Functions**:
- `get-asset-config (asset-id)` → `(response asset-config uint)`
- `get-owner ()` → `principal`
- `is-paused ()` → `bool`
- `get-interest-params ()` → interest rate parameters

**Error Codes**:
```clarity
(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-PROTOCOL-PAUSED (err u1001))
(define-constant ERR-ASSET-NOT-FOUND (err u1002))
(define-constant ERR-INVALID-PARAMETER (err u1003))
```

### 4. `pyth-oracle-adapter.clar`

**Purpose**: Wraps Pyth Network feeds, provides normalized price data for sBTC and STX.

**Key Logic**:
- Maps asset IDs (`"sbtc"`, `"stx"`) to Pyth price feed IDs
- Validates price freshness (max staleness: 600 seconds / ~100 blocks)
- Returns price in 8-decimal fixed-point format

**Public Functions**:
- `update-price (asset-id, price-data)` — Submit oracle update

**Read-Only Functions**:
- `get-price (asset-id)` → `{price: uint, confidence: uint, timestamp: uint}`
- `is-price-fresh (asset-id)` → `bool`

**Pyth Feed IDs**:
```
BTC/USD: 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
STX/USD: (Pyth STX/USD feed)
```

### 5. `lending-pool.clar`

**Purpose**: Multi-asset lending pool — manages deposits, withdrawals, and interest for USDCx, sBTC, and STX.

**Data Structures**:

```clarity
;; Per-asset pool state
(define-map pool-state
  (string-ascii 10)
  {
    total-deposits: uint,
    total-borrows: uint,
    reserve-factor: uint,
    last-update-block: uint
  }
)

;; Per-user, per-asset deposit tracking
(define-map lender-deposits
  { lender: principal, asset: (string-ascii 10) }
  { amount: uint, shares: uint }
)
```

**Public Functions**:
- `deposit (amount, asset-id)` — Deposit into pool
  - For USDCx/sBTC: uses SIP-010 `transfer`
  - For STX: uses `stx-transfer?`
- `withdraw (amount, asset-id)` — Withdraw from pool
- `claim-interest (asset-id)` — Claim earned interest

**Read-Only Functions**:
- `get-pool-stats (asset-id)` → `{total-deposits, total-borrows, utilization, apy}`
- `get-lender-balance (lender, asset-id)` → `{deposited, earned-interest}`
- `get-available-liquidity (asset-id)` → `uint`

### 6. `collateral-manager.clar`

**Purpose**: Manages collateral deposits, borrow positions, and the real-time borrow quote feature.

**Data Structures**:

```clarity
(define-map collateral-positions
  { borrower: principal, collateral-asset: (string-ascii 10) }
  {
    collateral-amount: uint,
    borrowed-amount: uint,         ;; USDCx borrowed
    borrow-block: uint,
    last-interest-block: uint
  }
)
```

**Public Functions**:
- `deposit-collateral-sbtc (amount)` — Deposit sBTC as collateral (SIP-010 transfer)
- `deposit-collateral-stx (amount)` — Deposit STX as collateral (`stx-transfer?`)
- `borrow (amount)` — Borrow USDCx against deposited collateral
- `repay (amount, collateral-asset)` — Repay USDCx debt
- `withdraw-collateral (amount, collateral-asset)` — Withdraw collateral after repayment

**Read-Only Functions**:
- `get-borrow-quote (collateral-asset, collateral-amount)` → Quote preview:
  ```clarity
  {
    collateral-value-usd: uint,    ;; Oracle value of collateral
    max-borrowable-usdcx: uint,    ;; Based on asset-specific LTV
    current-ltv: uint,             ;; Current LTV if borrowing max
    health-factor: uint,           ;; Projected health factor
    oracle-price: uint,            ;; Current oracle price used
    asset-ltv-limit: uint          ;; Max LTV for this asset type
  }
  ```
- `get-position (borrower, collateral-asset)` → Position details
- `get-health-factor (borrower, collateral-asset)` → Health factor (10000 = 1.0)

**Borrow Logic**:
```
1. Get collateral amount from position
2. Get oracle price for collateral asset
3. Calculate collateral_value_usd = amount * price
4. Get max_ltv from asset-config (75% for sBTC, 60% for STX)
5. max_borrow = collateral_value_usd * max_ltv / 10000
6. Assert requested_amount <= max_borrow
7. Transfer USDCx from lending pool to borrower
8. Update position
```

### 7. `liquidation-engine.clar`

**Purpose**: Liquidation of undercollateralized positions with graduated tiers.

**Liquidation Tiers**:
```
HF >= 1.0       → Healthy, no liquidation
0.8 <= HF < 1.0 → Partial liquidation (up to 50% of debt)
HF < 0.8        → Full liquidation (up to 100% of debt)
```

**Public Functions**:
- `liquidate-sbtc-position (borrower, repay-amount)` — Liquidate sBTC-collateralized position
- `liquidate-stx-position (borrower, repay-amount)` — Liquidate STX-collateralized position

**Liquidation Logic**:
```
1. Verify position health factor < 1.0
2. Determine max liquidatable based on HF tier
3. Calculate collateral to seize (repay_amount / oracle_price * (1 + bonus))
   - sBTC bonus: 5%
   - STX bonus: 8%
4. Transfer USDCx from liquidator to lending pool
5. Transfer seized collateral from position to liquidator
6. Update borrower position
```

**Read-Only Functions**:
- `get-liquidatable-positions ()` → List of positions below threshold
- `get-liquidation-quote (borrower, collateral-asset, repay-amount)` → Expected seized collateral

---

## Frontend Specifications

### Landing Page (`/`)

Modern, clean design inspired by Zest Protocol. Orange accent color (`#F7931A` — Bitcoin orange).

**Sections**:

1. **Hero** — "Lend & Borrow on Bitcoin" headline, CTA button → `/dashboard`, background with subtle BTC/Stacks visuals
2. **Protocol Stats** — TVL, total lent, total borrowed, number of users (from on-chain data)
3. **Features** — Grid of 4 cards:
   - "Earn Yield" — Lend USDCx, sBTC, or STX
   - "Borrow Against Bitcoin" — Use sBTC as collateral
   - "Real-Time Quotes" — See borrowing power instantly
   - "Secure by Design" — Clarity + Bitcoin security
4. **How It Works** — 3-step flow: Connect Wallet → Deposit → Earn/Borrow
5. **Supported Assets** — sBTC, STX, USDCx cards with current APY
6. **CTA** — "Start Earning" button → `/dashboard`
7. **Footer** — Links, social, docs

**Design System**:
- Background: Dark (`#0A0A0B`)
- Cards: Dark gray (`#141416`) with subtle border
- Accent: Bitcoin orange (`#F7931A`)
- Text: White primary, gray secondary
- Font: Inter or system-ui
- Rounded corners: `rounded-xl` (12px)
- Responsive: Mobile-first, breakpoints at `sm`, `md`, `lg`

### Dashboard Layout (`/dashboard`)

Sidebar navigation with:
- Overview (default)
- Lend
- Borrow
- Positions
- Liquidate

Top header with:
- OnLoan logo
- Network indicator (testnet/mainnet)
- Wallet connect button (Leather/Xverse)
- Connected address

### Dashboard Overview (`/dashboard`)

- Protocol stats cards (TVL, your deposits, your borrows, net APY)
- Asset summary table (all supported assets with APY, your balance)
- Quick actions (Deposit, Borrow, Repay)

### Lend Page (`/dashboard/lend`)

- Pool table showing USDCx, sBTC, STX pools
- Each row: Asset icon, total supplied, APY, your deposit, actions
- Deposit modal: Amount input, asset balance shown, confirm button
- Withdraw modal: Amount input, available to withdraw, confirm

### Borrow Page (`/dashboard/borrow`)

**This is the key differentiator — the real-time quote preview.**

```
┌─────────────────────────────────────┐
│  Borrow USDCx                       │
│                                     │
│  Collateral Type: [sBTC ▼] [STX]   │
│                                     │
│  Collateral Amount: [_________] sBTC│
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  💰 Borrow Quote               │ │
│  │                                 │ │
│  │  Collateral Value:  $5,000.00  │ │
│  │  Oracle Price:      $50,000/BTC│ │
│  │  Max LTV (sBTC):    75%        │ │
│  │  Max Borrowable:    3,750 USDCx│ │
│  │                                 │ │
│  │  ────────────────────────────── │ │
│  │  Borrow Amount: [________] USDCx│ │
│  │  Your LTV:       60.0%         │ │
│  │  Health Factor:   1.25 ●       │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [  Borrow USDCx  ]                │
└─────────────────────────────────────┘
```

**Behavior**:
1. User selects collateral type (sBTC or STX toggle)
2. As user types collateral amount, `get-borrow-quote` is called in real-time
3. Quote preview updates with: collateral USD value, oracle price, max borrowable, projected LTV, health factor
4. Health factor badge changes color: green (>1.5), yellow (1.2-1.5), red (<1.2)
5. User enters desired borrow amount (must be ≤ max borrowable)
6. Submit triggers wallet signing via `@stacks/connect`

**`useBorrowQuote` Hook**:
```typescript
import { useCallback, useEffect, useState } from "react";
import { callReadOnlyFunction, Cl } from "@stacks/transactions";

export function useBorrowQuote(collateralAsset: "sbtc" | "stx", amount: bigint) {
  const [quote, setQuote] = useState<BorrowQuote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (amount <= 0n) { setQuote(null); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await callReadOnlyFunction({
        contractAddress: DEPLOYER,
        contractName: "collateral-manager",
        functionName: "get-borrow-quote",
        functionArgs: [Cl.stringAscii(collateralAsset), Cl.uint(amount)],
        network: NETWORK,
        senderAddress: DEPLOYER,
      });
      setQuote(parseQuoteResult(result));
      setLoading(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [collateralAsset, amount]);

  return { quote, loading };
}
```

### Positions Page (`/dashboard/positions`)

- List of active positions with:
  - Collateral type + amount
  - Borrowed amount (USDCx)
  - Current LTV
  - Health factor with colored badge
  - Accrued interest
  - Actions: Repay, Add Collateral, Withdraw Collateral

### Liquidate Page (`/dashboard/liquidate`)

- Table of liquidatable positions (HF < 1.0)
- Each row: Borrower (truncated), collateral type, debt, HF, bonus, action
- Liquidation modal: Shows expected profit, confirm button

---

## Wallet Integration

### Connection Flow

```typescript
import { AppConfig, UserSession, showConnect } from "@stacks/connect";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

function connectWallet() {
  showConnect({
    appDetails: { name: "OnLoan", icon: "/onloan-logo.svg" },
    redirectTo: "/dashboard",
    onFinish: () => {
      // User connected — Leather or Xverse
      const userData = userSession.loadUserData();
      const address = userData.profile.stxAddress.mainnet; // or .testnet
    },
    userSession,
  });
}
```

### Contract Calls

```typescript
import { openContractCall } from "@stacks/connect";
import { Cl, PostConditionMode } from "@stacks/transactions";

// Example: Deposit sBTC collateral
async function depositSbtcCollateral(amount: bigint) {
  await openContractCall({
    contractAddress: DEPLOYER,
    contractName: "collateral-manager",
    functionName: "deposit-collateral-sbtc",
    functionArgs: [Cl.uint(amount)],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      // SIP-010 transfer post-condition for sBTC
    ],
    onFinish: (data) => { /* tx submitted */ },
    onCancel: () => { /* user cancelled */ },
  });
}
```

---

## Oracle Integration (Pyth)

### Frontend: Fetching Prices

```typescript
const PYTH_ENDPOINT = "https://hermes.pyth.network";
const BTC_USD_FEED = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

async function getBtcPrice(): Promise<number> {
  const res = await fetch(`${PYTH_ENDPOINT}/v2/updates/price/latest?ids[]=${BTC_USD_FEED}`);
  const data = await res.json();
  const priceData = data.parsed[0].price;
  return Number(priceData.price) * Math.pow(10, priceData.expo);
}
```

### Smart Contract: Using Oracle

```clarity
;; In collateral-manager, when calculating borrow capacity:
(let (
  (price-data (try! (contract-call? .pyth-oracle-adapter get-price "sbtc")))
  (price (get price price-data))
  (collateral-value (* collateral-amount price))
  (asset-config (try! (contract-call? .onloan-core get-asset-config "sbtc")))
  (max-ltv (get max-ltv asset-config))
  (max-borrow (/ (* collateral-value max-ltv) u10000))
)
```

---

## Interest Rate Model

Kinked (two-slope) interest rate model:

```
If utilization <= optimal_utilization (80%):
  rate = base_rate + (utilization / optimal) * slope1

If utilization > optimal_utilization (80%):
  rate = base_rate + slope1 + ((utilization - optimal) / (1 - optimal)) * slope2
```

**Default Parameters**:
- Base rate: 2%
- Optimal utilization: 80%
- Slope1: 4% (gentle increase below optimal)
- Slope2: 75% (steep increase above optimal — incentivizes deposits)

---

## Implementation Roadmap

### Phase 1: Smart Contracts (Core)
1. Create Clarinet project: `clarinet new onloan`
2. Add sBTC requirement: `clarinet requirements add SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit`
3. Implement trait contracts (`sip-010-trait`, `oracle-trait`, `pool-trait`)
4. Implement `onloan-core.clar` — asset registry, ownership, parameters
5. Implement `pyth-oracle-adapter.clar` — price feeds with staleness checks
6. Implement `lending-pool.clar` — multi-asset deposit/withdraw
7. Implement `collateral-manager.clar` — collateral, borrowing, `get-borrow-quote`
8. Implement `liquidation-engine.clar` — graduated liquidation

### Phase 2: Contract Testing
1. Set up Vitest + Clarinet SDK
2. Write unit tests for each contract
3. Write integration tests (borrow lifecycle, liquidation flow)
4. Write fuzz tests with fast-check
5. Achieve 100% coverage on public functions

### Phase 3: Frontend — Landing Page
1. Init Next.js 14 App Router project in `frontend/`
2. Configure Tailwind CSS with dark theme + orange accent
3. Build landing page sections (Hero, Features, How It Works, Stats, CTA)
4. Responsive design, mobile-first
5. Connect `/dashboard` routing

### Phase 4: Frontend — Dashboard
1. Dashboard layout with sidebar navigation
2. Wallet connection (Leather + Xverse via `@stacks/connect`)
3. Dashboard overview page with protocol stats
4. Lending page — deposit/withdraw modals
5. Borrowing page — **real-time borrow quote preview** (key feature)
6. Positions page — active position management
7. Liquidation page — liquidatable positions marketplace

### Phase 5: Integration
1. Connect frontend to smart contracts
2. Integrate Pyth oracle for real-time price display
3. Post-condition configuration for all transactions
4. Transaction status toasts
5. Error handling and loading states

### Phase 6: Testing & Polish
1. Frontend component tests
2. E2E testing on devnet
3. Mobile responsiveness audit
4. Performance optimization
5. Accessibility review

### Phase 7: Deployment
1. Deploy contracts to testnet
2. Deploy frontend to Vercel
3. Community testing period
4. Security audit
5. Mainnet deployment

---

## Error Codes Reference

| Code | Constant | Meaning |
|------|----------|---------|
| 1000 | `ERR-NOT-AUTHORIZED` | Caller is not the contract owner |
| 1001 | `ERR-PROTOCOL-PAUSED` | Protocol is paused |
| 1002 | `ERR-ASSET-NOT-FOUND` | Unknown asset ID |
| 1003 | `ERR-INVALID-PARAMETER` | Invalid parameter value |
| 2000 | `ERR-INVALID-AMOUNT` | Amount is zero or negative |
| 2001 | `ERR-INSUFFICIENT-BALANCE` | Not enough funds |
| 2002 | `ERR-POOL-EMPTY` | Lending pool has no liquidity |
| 3000 | `ERR-BELOW-MIN-COLLATERAL` | Below minimum collateral |
| 3001 | `ERR-EXCEEDS-MAX-LTV` | Borrow exceeds max LTV |
| 3002 | `ERR-ORACLE-STALE` | Oracle price is stale |
| 3003 | `ERR-ORACLE-LOW-CONFIDENCE` | Oracle confidence too low |
| 3004 | `ERR-NO-POSITION` | No active position found |
| 4000 | `ERR-POSITION-HEALTHY` | Cannot liquidate healthy position |
| 4001 | `ERR-EXCEEDS-LIQUIDATION-CAP` | Liquidation amount too large |

---

## Key Clarity Patterns

### SIP-010 Transfer (sBTC/USDCx)

```clarity
(try! (contract-call? .sbtc-token transfer amount tx-sender (as-contract tx-sender) none))
```

### STX Transfer (Native)

```clarity
(try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
```

### Access Control

```clarity
(asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
```

### Protocol Pause Check

```clarity
(asserts! (not (var-get protocol-paused)) ERR-PROTOCOL-PAUSED)
```

### Oracle Price with Staleness Check

```clarity
(let (
  (price-data (try! (contract-call? .pyth-oracle-adapter get-price asset-id)))
  (is-fresh (> (get timestamp price-data) (- stacks-block-height u100)))
)
  (asserts! is-fresh ERR-ORACLE-STALE)
  (ok (get price price-data))
)
```
