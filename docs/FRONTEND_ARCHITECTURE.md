# OnLoan — Frontend Architecture & Design System

> Next.js 14+ App Router architecture, component patterns, state management, design system, UX flows, and product roadmap.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Routing & Layout](#routing--layout)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [Data Fetching Patterns](#data-fetching-patterns)
7. [Design System](#design-system)
8. [UX Flows](#ux-flows)
9. [Wallet Integration](#wallet-integration)
10. [Performance](#performance)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Product Roadmap](#product-roadmap)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App Router                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Providers Layer                      │  │
│  │  WalletProvider → NetworkProvider → QueryProvider       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌────────────────────────────────────┐   │
│  │  Landing (/)  │  │  Dashboard (/dashboard/*)           │   │
│  │              │  │                                      │   │
│  │  Hero        │  │  ┌─────────┐ ┌───────────────────┐  │   │
│  │  Features    │  │  │ Sidebar │ │ Content Area      │  │   │
│  │  HowItWorks  │  │  │         │ │                   │  │   │
│  │  Stats       │  │  │ Lend    │ │ /lend             │  │   │
│  │  CTA         │  │  │ Borrow  │ │ /borrow           │  │   │
│  │  Footer      │  │  │ Positions│ │ /positions        │  │   │
│  │              │  │  │ Liquidate│ │ /liquidate        │  │   │
│  └──────────────┘  │  └─────────┘ └───────────────────┘  │   │
│                     └────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Hooks Layer                          │  │
│  │  useWallet · useBorrowQuote · usePoolData · usePosition │  │
│  │  useOraclePrice · useContractCall · useHealthFactor     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Lib Layer                            │  │
│  │  stacks.ts · contracts.ts · pyth.ts · constants.ts      │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                  │
│                    @stacks/connect                            │
│                    @stacks/transactions                       │
│                    @stacks/network                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
                    Stacks Blockchain
                    (Clarity Contracts)
```

---

## Tech Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | Next.js 14+ (App Router) | Server components, file-based routing, streaming |
| Language | TypeScript (strict) | Type safety across contract ↔ frontend boundary |
| Styling | Tailwind CSS 3.4+ | Utility-first, dark mode support, responsive |
| Components | Radix UI primitives | Accessible, unstyled, composable |
| State | React Context + TanStack Query v5 | Server state caching, wallet state in context |
| Forms | React Hook Form + Zod | Validation, performance, type inference |
| Wallet | `@stacks/connect` | Leather + Xverse support |
| Contract Calls | `@stacks/transactions` | Clarity value encoding (`Cl` helpers) |
| Oracle | Pyth Hermes REST API | Real-time BTC/USD, STX/USD prices |
| Charts | Recharts | Lightweight, React-native charting |
| Animations | Framer Motion | Layout + mount animations |
| Icons | Lucide React | Consistent, tree-shakeable icon set |
| Linting | ESLint + Prettier | Consistent code style |
| Testing | Vitest + React Testing Library | Fast, Vite-native test runner |
| CI | GitHub Actions | Lint → Test → Build → Deploy |

---

## Routing & Layout

### Route Map

```
/                           → Landing page (public, no wallet required)
/dashboard                  → Dashboard overview (wallet-gated)
/dashboard/lend             → Lending pools
/dashboard/borrow           → Borrowing with quote preview
/dashboard/positions        → Active positions management
/dashboard/liquidate        → Liquidation marketplace
```

### Layout Hierarchy

```
app/layout.tsx              → HTML, fonts, providers (Wallet, Network, Query)
├── app/page.tsx            → Landing page (Navbar + sections + Footer)
│
└── app/dashboard/layout.tsx → Dashboard shell (Sidebar + Header + MobileNav)
    ├── app/dashboard/page.tsx
    ├── app/dashboard/lend/page.tsx
    ├── app/dashboard/borrow/page.tsx
    ├── app/dashboard/positions/page.tsx
    └── app/dashboard/liquidate/page.tsx
```

### Layout Implementation Pattern

```
app/layout.tsx
  - <html> with dark class
  - Font loading (Inter via next/font/google)
  - <Providers> wrapper:
      WalletProvider → NetworkProvider → QueryClientProvider
  - <body> with min-h-screen, bg-neutral-950, text-white

app/dashboard/layout.tsx
  - Wallet connection gate (redirect to / if not connected)
  - Desktop: fixed Sidebar (w-64) + scrollable main content
  - Mobile: bottom navigation bar + hamburger menu
  - Shared header with wallet address, network badge
```

---

## Component Architecture

### Component Categories

```
components/
├── ui/                 # Design system primitives (Button, Card, Input, Modal, etc.)
├── landing/            # Landing page sections (used only on /)
├── dashboard/          # Dashboard chrome (Sidebar, Header, MobileNav)
├── lending/            # Lending feature components
├── borrowing/          # Borrowing feature components
├── positions/          # Position management components
├── liquidation/        # Liquidation feature components
└── common/             # Cross-cutting (WalletConnect, AssetIcon, TransactionToast)
```

### Component Guidelines

1. **Server Components by default** — Only add `"use client"` when hooks or browser APIs are needed
2. **Composition over props** — Use children and slots instead of large prop interfaces
3. **Colocation** — Component-specific types live in the same file
4. **No prop drilling** — Use hooks for contract/wallet state, context for auth
5. **Barrel exports** — Each directory has an `index.ts` for clean imports

### UI Primitives (Design System)

Built on Radix UI primitives, styled with Tailwind:

| Component | Base | Usage |
|-----------|------|-------|
| `Button` | Radix Slot | Primary (orange), secondary (outline), ghost, destructive |
| `Card` | `<div>` | Content container with header/body/footer slots |
| `Input` | `<input>` | Text/number input with label, error, suffix (e.g., "STX") |
| `Modal` | Radix Dialog | Deposit, withdraw, repay modals |
| `Badge` | `<span>` | Health factor status, asset tags |
| `Skeleton` | `<div>` | Loading placeholders |
| `Select` | Radix Select | Asset selector |
| `Tooltip` | Radix Tooltip | Info hints on LTV, health factor |
| `Tabs` | Radix Tabs | Dashboard sub-navigation on mobile |
| `Toast` | Radix Toast | Transaction status notifications |
| `Progress` | `<div>` | LTV bar, utilization bar |
| `DropdownMenu` | Radix DropdownMenu | Wallet options, position actions |

---

## State Management

### Strategy

```
                    ┌─────────────────────┐
                    │   React Context      │
                    │                     │
                    │  • Wallet state     │
                    │  • Network config   │
                    │  • Theme            │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   TanStack Query     │
                    │                     │
                    │  • Pool stats       │
                    │  • User positions   │
                    │  • Oracle prices    │
                    │  • Borrow quotes    │
                    │  • Liquidatable     │
                    │    positions        │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   Local State        │
                    │                     │
                    │  • Form inputs      │
                    │  • Modal open/close │
                    │  • UI toggles       │
                    └─────────────────────┘
```

### Query Keys Convention

```typescript
export const queryKeys = {
  pools: {
    all: ["pools"] as const,
    stats: (assetId: string) => ["pools", "stats", assetId] as const,
    userBalance: (address: string, assetId: string) =>
      ["pools", "balance", address, assetId] as const,
  },
  positions: {
    all: (address: string) => ["positions", address] as const,
    single: (address: string, asset: string) =>
      ["positions", address, asset] as const,
  },
  oracle: {
    price: (assetId: string) => ["oracle", "price", assetId] as const,
  },
  quotes: {
    borrow: (asset: string, amount: string) =>
      ["quotes", "borrow", asset, amount] as const,
  },
} as const;
```

### Mutation Pattern

All write operations follow this flow:

```
User Action → Form Validation (Zod) → openContractCall (@stacks/connect)
  → Wallet Popup → TX Broadcast → Toast (pending) → Poll TX Status
  → Toast (success/failure) → Invalidate Queries → UI Update
```

---

## Data Fetching Patterns

### Read-Only Contract Calls

```typescript
async function fetchPoolStats(assetId: string): Promise<PoolStats> {
  const result = await callReadOnlyFunction({
    contractAddress: DEPLOYER,
    contractName: "lending-pool",
    functionName: "get-pool-stats",
    functionArgs: [Cl.stringAscii(assetId)],
    network: getNetwork(),
    senderAddress: DEPLOYER,
  });
  return deserializePoolStats(result);
}
```

Wrapped in TanStack Query:

```typescript
export function usePoolStats(assetId: string) {
  return useQuery({
    queryKey: queryKeys.pools.stats(assetId),
    queryFn: () => fetchPoolStats(assetId),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
```

### Borrow Quote (Debounced)

```typescript
export function useBorrowQuote(asset: CollateralAsset, amount: bigint) {
  const debouncedAmount = useDebounce(amount, 300);

  return useQuery({
    queryKey: queryKeys.quotes.borrow(asset, debouncedAmount.toString()),
    queryFn: () => fetchBorrowQuote(asset, debouncedAmount),
    enabled: debouncedAmount > 0n,
    staleTime: 10_000,
  });
}
```

### Oracle Prices

```typescript
export function useOraclePrice(assetId: string) {
  return useQuery({
    queryKey: queryKeys.oracle.price(assetId),
    queryFn: () => fetchPythPrice(assetId),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
```

---

## Design System

### Color Palette

```
Brand
  onloan-orange:     #F7931A    (Bitcoin orange — primary accent)
  onloan-amber:      #FFB84D    (hover/light variant)
  onloan-deep:       #E07800    (pressed/dark variant)

Backgrounds
  bg-primary:        #0A0A0B    (page background)
  bg-card:           #141416    (card/surface)
  bg-elevated:       #1C1C1F    (elevated surface, modals)
  bg-hover:          #232326    (hover state)

Borders
  border-default:    #2A2A2D    (subtle borders)
  border-strong:     #3A3A3D    (emphasized borders)

Text
  text-primary:      #FFFFFF    (headings, primary content)
  text-secondary:    #A1A1AA    (descriptions, labels)
  text-muted:        #71717A    (hints, timestamps)

Semantic
  success:           #22C55E    (healthy, confirmed)
  warning:           #F59E0B    (caution, pending)
  danger:            #EF4444    (liquidation, error)
  info:              #3B82F6    (informational)
```

### Tailwind Config Extensions

```typescript
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        onloan: {
          orange: "#F7931A",
          amber: "#FFB84D",
          deep: "#E07800",
        },
        surface: {
          primary: "#0A0A0B",
          card: "#141416",
          elevated: "#1C1C1F",
          hover: "#232326",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
    },
  },
} satisfies Config;
```

### Typography Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page heading | `text-3xl` / `text-4xl` | `font-bold` | white |
| Section heading | `text-xl` / `text-2xl` | `font-semibold` | white |
| Card title | `text-lg` | `font-semibold` | white |
| Body | `text-sm` / `text-base` | `font-normal` | white |
| Label | `text-sm` | `font-medium` | text-secondary |
| Caption | `text-xs` | `font-normal` | text-muted |
| Mono (amounts) | `text-base` / `text-lg` | `font-mono font-medium` | white |

### Button Variants

```
Primary:   bg-onloan-orange hover:bg-onloan-amber text-white rounded-xl px-6 py-3
Secondary: border border-onloan-orange text-onloan-orange hover:bg-onloan-orange/10 rounded-xl
Ghost:     text-zinc-400 hover:text-white hover:bg-surface-hover rounded-xl
Danger:    bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl
```

### Card Pattern

```
bg-surface-card border border-zinc-800 rounded-card p-6
hover:border-zinc-700 transition-colors
```

### Spacing & Layout

- Page padding: `px-4 md:px-6 lg:px-8`
- Section gap: `space-y-8` or `gap-8`
- Card grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Sidebar width: `w-64` (desktop), hidden on mobile
- Max content width: `max-w-7xl mx-auto`

---

## UX Flows

### Flow 1: First-Time User (Landing → Dashboard)

```
Landing Page (/)
  │
  ├─ User reads value proposition (Hero)
  ├─ Sees live protocol stats (TVL, APY)
  ├─ Understands features (earn, borrow, liquidate)
  ├─ Clicks "Launch App" CTA
  │
  ▼
Dashboard Overview (/dashboard)
  │
  ├─ Prompted to connect wallet (Leather or Xverse)
  ├─ Sees protocol overview (TVL, pools, rates)
  ├─ Quick action cards: "Start Lending" / "Start Borrowing"
  │
  ▼
Lend or Borrow (chosen path)
```

### Flow 2: Lending

```
/dashboard/lend
  │
  ├─ Pool table: USDCx | sBTC | STX
  │   Each row: total supplied, APY, user balance, [Deposit] [Withdraw]
  │
  ├─ User clicks [Deposit] on USDCx
  │   ├─ Modal opens with:
  │   │   • Asset icon + name
  │   │   • Wallet balance shown
  │   │   • Amount input with MAX button
  │   │   • Expected APY display
  │   │   • [Deposit] button
  │   ├─ User enters amount → validation
  │   ├─ Clicks Deposit → Wallet popup (Leather/Xverse)
  │   ├─ TX broadcast → Pending toast
  │   └─ TX confirmed → Success toast → Pool table refreshes
  │
  └─ User clicks [Withdraw]
      └─ Same modal pattern with available balance
```

### Flow 3: Borrowing (Key Flow)

```
/dashboard/borrow
  │
  ├─ Step 1: Select Collateral Type
  │   Toggle: [sBTC] [STX]
  │
  ├─ Step 2: Enter Collateral Amount
  │   Input field with wallet balance + MAX button
  │
  ├─ Step 3: Live Quote Preview (auto-updates as user types)
  │   ┌─────────────────────────────────────────┐
  │   │  Borrow Quote                            │
  │   │                                          │
  │   │  Collateral Value     $5,000.00          │
  │   │  Oracle Price         $50,000.00 / BTC   │
  │   │  Max LTV (sBTC)       75%                │
  │   │  ──────────────────────────────────────  │
  │   │  Max Borrowable       3,750.00 USDCx     │
  │   └─────────────────────────────────────────┘
  │
  ├─ Step 4: Enter Borrow Amount
  │   Input with slider (0% → max LTV)
  │   Live LTV indicator + Health Factor badge
  │     HF > 1.5  → Green  "Healthy"
  │     HF 1.2-1.5 → Yellow "Caution"
  │     HF < 1.2  → Red    "At Risk"
  │
  ├─ Step 5: Review & Confirm
  │   Summary card with all parameters
  │   [Deposit Collateral & Borrow] button
  │
  └─ Step 6: Transaction
      TX 1: Deposit collateral (sBTC or STX)
      TX 2: Borrow USDCx
      Toast notifications for each step
```

### Flow 4: Position Management

```
/dashboard/positions
  │
  ├─ Position Cards (one per active position)
  │   ┌────────────────────────────────────────┐
  │   │  sBTC Position                          │
  │   │                                        │
  │   │  Collateral   0.1 sBTC ($5,000)        │
  │   │  Borrowed     3,000.00 USDCx           │
  │   │  Interest     12.50 USDCx              │
  │   │                                        │
  │   │  LTV          [████████░░] 60%         │
  │   │  Health Factor  1.33 ● Healthy         │
  │   │                                        │
  │   │  [Repay] [Add Collateral] [Withdraw]   │
  │   └────────────────────────────────────────┘
  │
  └─ Actions open modals with same pattern as lending
```

### Flow 5: Liquidation

```
/dashboard/liquidate
  │
  ├─ Table of liquidatable positions (HF < 1.0)
  │   Columns: Borrower (truncated), Collateral, Debt, HF, Bonus, [Liquidate]
  │
  └─ User clicks [Liquidate]
      ├─ Modal shows:
      │   • Debt to repay (USDCx)
      │   • Collateral to receive (sBTC/STX + bonus %)
      │   • Expected profit
      │   • [Confirm Liquidation] button
      └─ TX flow → toast → table refresh
```

### Mobile UX

```
Mobile (< 768px):
  - Sidebar collapses → Bottom navigation bar (4 icons: Lend, Borrow, Positions, Liquidate)
  - Header simplifies: logo + wallet button only
  - Cards stack vertically, full-width
  - Modals become full-screen sheets (slide up from bottom)
  - Tables become card lists
  - Quote preview stacks vertically
  - Touch targets minimum 44px

Tablet (768px - 1024px):
  - Sidebar collapses to icon-only rail
  - 2-column card grid
  - Modals centered with max-width

Desktop (> 1024px):
  - Full sidebar with labels
  - 3-column card grid
  - Side-by-side layouts for borrow (form + quote preview)
```

---

## Wallet Integration

### Architecture

```
WalletProvider (Context)
  │
  ├── state: { connected, address, network, session }
  ├── connect(): showConnect() via @stacks/connect
  ├── disconnect(): clearSession()
  └── getStxAddress(): resolves mainnet/testnet address
```

### Connection Flow

```
1. User clicks "Connect Wallet"
2. showConnect() opens wallet selector (auto-detects Leather/Xverse)
3. User approves in wallet extension
4. onFinish callback fires
5. UserSession loaded → address extracted
6. Context updated → all hooks re-query with address
7. Dashboard unlocks
```

### Post-Conditions

Every token transfer uses `PostConditionMode.Deny` with explicit post-conditions to protect users:

```typescript
const postConditions = [
  makeStandardFungiblePostCondition(
    userAddress,
    FungibleConditionCode.LessEqual,
    amount,
    createAssetInfo(SBTC_CONTRACT_ADDRESS, "sbtc-token", "sbtc")
  ),
];
```

---

## Performance

### Optimization Strategies

| Strategy | Implementation |
|----------|---------------|
| Code splitting | Next.js App Router automatic per-route splitting |
| Image optimization | `next/image` for logos, icons served as SVG |
| Bundle analysis | `@next/bundle-analyzer` in dev |
| Caching | TanStack Query with `staleTime` + `gcTime` per query type |
| Debouncing | 300ms debounce on borrow quote input |
| Lazy loading | `dynamic()` for heavy components (charts, modals) |
| Prefetching | `router.prefetch('/dashboard')` on landing page |
| Font loading | `next/font/google` with `display: swap` |

### Query Caching Strategy

| Data | staleTime | refetchInterval | On-Demand |
|------|-----------|-----------------|-----------|
| Pool stats | 30s | 60s | After deposit/withdraw |
| User positions | 15s | 30s | After borrow/repay |
| Oracle prices | 10s | 15s | — |
| Borrow quote | 10s | — | On amount change (debounced) |
| Liquidatable positions | 30s | 60s | After liquidation |

---

## CI/CD Pipeline

### GitHub Actions Workflow

```
.github/workflows/
├── ci.yml              # Runs on every PR and push to main
├── deploy-frontend.yml # Deploys frontend to Vercel on main merge
└── deploy-contracts.yml# Deploys contracts to testnet (manual trigger)
```

### CI Pipeline (`ci.yml`)

```
Trigger: push to main, pull_request

Jobs:
  contracts:
    - Checkout
    - Install Clarinet
    - clarinet check (lint/compile)
    - npm ci (root)
    - npm test (Clarinet SDK + Vitest)

  frontend:
    - Checkout
    - cd frontend && npm ci
    - npm run lint (ESLint)
    - npm run type-check (tsc --noEmit)
    - npm test (Vitest + RTL)
    - npm run build (Next.js production build)

  security:
    - npm audit (both root and frontend)
```

### Frontend Deployment (`deploy-frontend.yml`)

```
Trigger: push to main (after CI passes)

Jobs:
  deploy:
    - Checkout
    - Install Vercel CLI
    - vercel pull --environment=production
    - vercel build --prod
    - vercel deploy --prebuilt --prod
```

### Contract Deployment (`deploy-contracts.yml`)

```
Trigger: workflow_dispatch (manual)

Inputs: network (testnet | mainnet)

Jobs:
  deploy:
    - Checkout
    - Install Clarinet
    - clarinet deployments apply --deployment deployments/default.{network}-plan.yaml
```

---

## Product Roadmap

### Q1 — MVP Launch (Current)

**Focus**: Core lending protocol + polished frontend

**Smart Contracts**
- [x] `onloan-core.clar` — asset registry, governance, access control
- [x] `lending-pool.clar` — multi-asset deposit/withdraw (USDCx, sBTC, STX)
- [x] `collateral-manager.clar` — sBTC + STX collateral, borrowing, `get-borrow-quote`
- [x] `liquidation-engine.clar` — graduated liquidation (partial + full)
- [x] `pyth-oracle-adapter.clar` — BTC/USD + STX/USD price feeds with staleness checks

**Frontend**
- [x] Landing page (Hero, Features, HowItWorks, Stats, CTA, Footer)
- [x] Dashboard layout (Sidebar, Header, MobileNav)
- [x] Lending page — deposit/withdraw with pool stats
- [x] Borrowing page — real-time Pyth-powered quote preview
- [x] Positions page — health factor monitoring, repay, manage collateral
- [x] Liquidation page — browse + execute liquidations
- [x] Wallet integration (Leather + Xverse)
- [x] Transaction toasts with status tracking
- [x] Mobile-responsive design

**Infrastructure**
- [x] Clarinet SDK + Vitest testing (unit + integration + fuzz)
- [x] GitHub Actions CI pipeline
- [x] Testnet deployment
- [x] Vercel frontend deployment

---

### Q2 — Protocol Hardening & Analytics

**Focus**: Security, data, and advanced features

**Smart Contracts**
- [ ] Flash loan protection mechanism
- [ ] Borrowing caps per asset (TVL-based)
- [ ] Reserve fund accumulation from protocol fees
- [ ] Interest rate model tuning (community-driven parameters)

**Frontend**
- [ ] Analytics dashboard (TVL history, volume, APY trends via Recharts)
- [ ] Position alerts (email/push notification when HF drops below threshold)
- [ ] Multi-position view (aggregate health across all user positions)
- [ ] Enhanced liquidation UX with profit calculator
- [ ] Dark/light theme toggle

**Infrastructure**
- [ ] Formal smart contract audit (external firm)
- [ ] Subgraph or custom indexer for historical data
- [ ] Error monitoring (Sentry integration)
- [ ] Performance monitoring (Vercel Analytics + Web Vitals)

---

### Q3 — Multi-Asset Expansion & Governance

**Focus**: New markets and decentralization

**Smart Contracts**
- [ ] Additional collateral types (new SIP-010 tokens as they gain liquidity)
- [ ] Multi-asset borrowing (borrow sBTC against STX, etc.)
- [ ] Governance token (ONLN) — SIP-010
- [ ] DAO voting contract for parameter updates
- [ ] Staking contract for governance token

**Frontend**
- [ ] Governance page — proposal creation, voting, delegation
- [ ] Token staking interface
- [ ] New asset listing request flow
- [ ] Advanced order types (limit borrow at target LTV)
- [ ] Portfolio overview with PnL tracking

**Infrastructure**
- [ ] Bug bounty program launch
- [ ] Multi-sig deployment pipeline
- [ ] Mainnet migration preparation
- [ ] Documentation site (Docusaurus or Nextra)

---

### Q4 — Mainnet & Growth

**Focus**: Production launch and user growth

**Smart Contracts**
- [ ] Mainnet contract deployment
- [ ] sBTC yield strategies (auto-compound lending returns)
- [ ] Referral program contract
- [ ] Fee distribution to governance stakers

**Frontend**
- [ ] Mainnet frontend deployment
- [ ] Onboarding wizard for first-time DeFi users
- [ ] sBTC bridge integration (in-app BTC → sBTC flow)
- [ ] Multilingual support (i18n)
- [ ] PWA support (installable mobile app)
- [ ] Social sharing (position cards, earnings screenshots)

**Infrastructure**
- [ ] CDN optimization for global users
- [ ] Rate limiting and DDoS protection
- [ ] Uptime monitoring and status page
- [ ] Community Discord bot for protocol stats

---

### Future (2027+)

- Cross-chain lending (Stacks ↔ other Bitcoin L2s)
- Institutional lending pools
- Fixed-rate lending vaults
- Leveraged yield farming
- Mobile native app (React Native)
- Protocol-owned liquidity mechanisms
