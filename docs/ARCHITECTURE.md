# OnLoan — Smart Contract Architecture

> Multi-asset Clarity contract design, sBTC/USDCx/STX data flow, Pyth oracle integration, and security model.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Contract Dependency Graph](#contract-dependency-graph)
3. [Core Contract: `onloan-core.clar`](#core-contract)
4. [Lending Pool: `lending-pool.clar`](#lending-pool)
5. [Collateral Manager: `collateral-manager.clar`](#collateral-manager)
6. [Liquidation Engine: `liquidation-engine.clar`](#liquidation-engine)
7. [Oracle Adapter: `pyth-oracle-adapter.clar`](#oracle-adapter)
8. [Trait Definitions](#trait-definitions)
9. [sBTC Integration](#sbtc-integration)
10. [STX as Collateral](#stx-as-collateral)
11. [Data Flow: Borrowing Lifecycle](#data-flow-borrowing-lifecycle)
12. [Data Flow: Borrow Quote Preview](#data-flow-borrow-quote-preview)
13. [Data Flow: Liquidation](#data-flow-liquidation)
14. [Interest Rate Model](#interest-rate-model)
15. [Security Model](#security-model)
16. [Comparison with Zest Protocol](#comparison-with-zest-protocol)

---

## Design Principles

1. **Multi-asset from day one** — Support sBTC, USDCx, and STX as first-class assets with per-asset risk parameters.
2. **Clarity-native safety** — Leverage Clarity's design: no reentrancy, native overflow protection, decidable execution.
3. **Separation of concerns** — Each contract has a single responsibility.
4. **Trait-based extensibility** — Oracle and pool logic are behind traits so they can be swapped without redeployment.
5. **Fail-safe defaults** — If the oracle is stale, borrowing is paused. If health factor is uncertain, liquidation is allowed.
6. **No backend** — All protocol state lives on-chain. Frontend reads directly from contracts.

---

## Contract Dependency Graph

```
                    ┌──────────────────┐
                    │  onloan-core     │
                    │  (constants,     │
                    │   asset registry,│
                    │   access ctrl)   │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
   ┌────────▼──────┐  ┌─────▼────────┐  ┌────▼───────────┐
   │ lending-pool  │  │  collateral  │  │  liquidation   │
   │ (multi-asset) │  │  -manager    │  │  -engine       │
   └───────┬───────┘  └──────┬───────┘  └───────┬────────┘
           │                 │                   │
           │          ┌──────▼───────────────────▼──────┐
           │          │  pyth-oracle-adapter             │
           │          │  (BTC/USD + STX/USD feeds)       │
           │          │  (implements oracle-trait)        │
           │          └─────────────────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ SIP-010 Tokens              │
    │ sBTC: SM3VDX...sbtc-token   │
    │ USDCx: SIP-010 USDC        │
    │ STX: native (stx-transfer?) │
    └─────────────────────────────┘
```

---

## Core Contract

### `onloan-core.clar`

Central configuration, asset registry, and access control.

#### Asset Registry

```clarity
;; Supported collateral types with per-asset risk parameters
(define-map asset-config
  { asset-id: (string-ascii 12) }
  {
    max-ltv: uint,                 ;; basis points (e.g., u7500 = 75%)
    liquidation-threshold: uint,   ;; basis points (e.g., u8000 = 80%)
    liquidation-bonus: uint,       ;; basis points (e.g., u500 = 5%)
    min-collateral: uint,          ;; minimum deposit amount
    is-active: bool,
    pyth-feed-id: (string-ascii 66) ;; Pyth price feed identifier
  }
)

;; Initialize asset configs
;; sBTC: Higher LTV (lower risk due to BTC peg)
;; STX: Lower LTV (higher volatility)
```

#### Default Risk Parameters

| Parameter | sBTC | STX |
|-----------|------|-----|
| Max LTV | 75% | 60% |
| Liquidation Threshold | 80% | 70% |
| Liquidation Bonus | 5% | 8% |
| Min Collateral | 10,000 sats | 100 STX |

#### Protocol Parameters

```clarity
(define-data-var base-interest-rate uint u200)     ;; 2.00% base APR
(define-data-var protocol-fee uint u100)           ;; 1.00% protocol fee on interest
(define-data-var max-price-staleness uint u300)    ;; 5 minutes max staleness
(define-data-var min-price-confidence uint u9500)  ;; 95% confidence required
(define-data-var protocol-paused bool false)
```

#### Error Codes

```clarity
(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-INVALID-AMOUNT (err u1001))
(define-constant ERR-INSUFFICIENT-BALANCE (err u1002))
(define-constant ERR-BELOW-MIN-COLLATERAL (err u1003))
(define-constant ERR-EXCEEDS-MAX-LTV (err u1004))
(define-constant ERR-POSITION-HEALTHY (err u1005))
(define-constant ERR-ORACLE-STALE (err u1006))
(define-constant ERR-ORACLE-LOW-CONFIDENCE (err u1007))
(define-constant ERR-POOL-INSUFFICIENT-LIQUIDITY (err u1008))
(define-constant ERR-LOAN-NOT-FOUND (err u1009))
(define-constant ERR-ALREADY-LIQUIDATED (err u1010))
(define-constant ERR-PROTOCOL-PAUSED (err u1011))
(define-constant ERR-UNSUPPORTED-ASSET (err u1012))
(define-constant ERR-INVALID-COLLATERAL-TYPE (err u1013))
```

#### Access Control

```clarity
(define-data-var contract-owner principal tx-sender)
(define-map authorized-callers principal bool)

(define-read-only (is-authorized (caller principal))
  (default-to false (map-get? authorized-callers caller))
)
```

---

## Lending Pool

### `lending-pool.clar`

Multi-asset lending pools — separate pool state for USDCx, sBTC, and STX.

#### Data Structures

```clarity
;; Per-asset pool state
(define-map pool-state
  { asset-id: (string-ascii 12) }
  {
    total-deposits: uint,
    total-borrows: uint,
    total-reserves: uint,
    last-update-block: uint
  }
)

;; Per-lender, per-asset deposits
(define-map lender-deposits
  { lender: principal, asset-id: (string-ascii 12) }
  { amount: uint, deposit-block: uint }
)

;; Per-borrower debt (borrowing is always USDCx)
(define-map borrower-debt
  { borrower: principal }
  { principal-amount: uint, accrued-interest: uint, last-accrual-block: uint }
)
```

#### Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `deposit` | public | Lender deposits an asset (USDCx, sBTC, or STX) into its pool |
| `withdraw` | public | Lender withdraws asset + earned interest |
| `issue-loan` | public | Called by collateral-manager to issue USDCx to borrower |
| `repay-loan` | public | Borrower repays USDCx principal + interest |
| `get-pool-stats` | read-only | Returns pool state for a given asset |
| `get-utilization-rate` | read-only | Current pool utilization per asset |
| `get-current-apy` | read-only | Current lending APY based on utilization |
| `get-available-liquidity` | read-only | Available amount for a given asset |

#### Token Transfer Patterns

```clarity
;; sBTC deposit (SIP-010 transfer)
(contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
  transfer amount tx-sender (as-contract tx-sender) none)

;; STX deposit (native transfer)
(stx-transfer? amount tx-sender (as-contract tx-sender))

;; USDCx deposit (SIP-010 transfer)
(contract-call? .usdcx-token transfer amount tx-sender (as-contract tx-sender) none)
```

---

## Collateral Manager

### `collateral-manager.clar`

Multi-collateral position management for sBTC and STX.

#### Data Structures

```clarity
;; Collateral positions — keyed by user + collateral type
(define-map collateral-positions
  { user: principal, collateral-type: (string-ascii 12) }
  {
    collateral-amount: uint,     ;; amount deposited
    borrowed-amount: uint,       ;; USDCx borrowed against this collateral
    deposit-block: uint,
    last-interest-block: uint,
    is-active: bool
  }
)

;; Track all active positions for enumeration
(define-data-var position-count uint u0)
(define-map position-index uint { user: principal, collateral-type: (string-ascii 12) })
```

#### Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `deposit-collateral-sbtc` | public | Deposit sBTC as collateral (SIP-010 transfer) |
| `deposit-collateral-stx` | public | Deposit STX as collateral (native stx-transfer) |
| `withdraw-collateral` | public | Withdraw excess collateral if health factor allows |
| `borrow` | public | Borrow USDCx against collateral |
| `repay` | public | Repay USDCx debt |
| `get-health-factor` | read-only | Calculate position health using oracle price |
| `get-max-borrowable` | read-only | Max USDCx borrowable for a position |
| `get-borrow-quote` | read-only | **Preview**: how much USDCx for given collateral |
| `get-ltv-ratio` | read-only | Current loan-to-value ratio |

#### Health Factor Calculation

```
health_factor = (collateral_value_usd * liquidation_threshold) / (borrowed_usd * 10000)

For sBTC collateral:
  collateral_value_usd = collateral_sbtc * pyth_btc_price

For STX collateral:
  collateral_value_usd = collateral_stx * pyth_stx_price

If health_factor >= 10000 (1.0): Position is healthy
If health_factor < 10000: Position is liquidatable
```

#### Borrow Quote (Real-Time Preview)

The `get-borrow-quote` read-only function allows the frontend to show users exactly how much USDCx they can borrow before they commit:

```clarity
(define-read-only (get-borrow-quote
    (collateral-type (string-ascii 12))
    (collateral-amount uint))
  (let (
    (asset (unwrap! (map-get? asset-config { asset-id: collateral-type }) ERR-UNSUPPORTED-ASSET))
    (price-data (try! (contract-call? .pyth-oracle-adapter get-price collateral-type)))
    (collateral-value-usd (/ (* collateral-amount (get price price-data)) u100000000))
    (max-borrow (/ (* collateral-value-usd (get max-ltv asset)) u10000))
  )
    (ok {
      collateral-value-usd: collateral-value-usd,
      max-borrowable-usdcx: max-borrow,
      ltv-ratio: (get max-ltv asset),
      oracle-price: (get price price-data),
      oracle-confidence: (get confidence price-data)
    })
  )
)
```

#### Collateral-Specific Deposit

```clarity
;; sBTC collateral — uses SIP-010 transfer
(define-public (deposit-collateral-sbtc (amount uint))
  (begin
    (asserts! (not (var-get protocol-paused)) ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (let (
      (asset (unwrap! (map-get? asset-config { asset-id: "sbtc" }) ERR-UNSUPPORTED-ASSET))
    )
      (asserts! (>= amount (get min-collateral asset)) ERR-BELOW-MIN-COLLATERAL)
      ;; Transfer sBTC from user to contract
      (try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
        transfer amount tx-sender (as-contract tx-sender) none))
      ;; Update position
      ;; ...
      (ok amount)
    )
  )
)

;; STX collateral — uses native stx-transfer?
(define-public (deposit-collateral-stx (amount uint))
  (begin
    (asserts! (not (var-get protocol-paused)) ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (let (
      (asset (unwrap! (map-get? asset-config { asset-id: "stx" }) ERR-UNSUPPORTED-ASSET))
    )
      (asserts! (>= amount (get min-collateral asset)) ERR-BELOW-MIN-COLLATERAL)
      ;; Transfer STX from user to contract
      (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
      ;; Update position
      ;; ...
      (ok amount)
    )
  )
)
```

---

## Liquidation Engine

### `liquidation-engine.clar`

Graduated liquidation with per-collateral-type parameters.

#### Liquidation Tiers

| Health Factor | Status | sBTC Action | STX Action |
|--------------|--------|------------|------------|
| >= 1.2 | Healthy | No action | No action |
| 1.0 – 1.2 | Warning | Frontend warning | Frontend warning |
| 0.8 – 1.0 | Partial Liquidation | Up to 50% | Up to 50% |
| < 0.8 | Full Liquidation | 100% | 100% |

#### Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `liquidate-sbtc-position` | public | Liquidate an sBTC-collateralized position |
| `liquidate-stx-position` | public | Liquidate an STX-collateralized position |
| `calculate-liquidation-amount` | read-only | Max liquidatable for a position |
| `calculate-liquidator-reward` | read-only | Collateral + bonus liquidator receives |
| `is-liquidatable` | read-only | Checks if a position can be liquidated |

#### Liquidation Flow

```
1. Liquidator calls liquidate-sbtc-position(borrower, repay-amount)
   → Reads borrower's sBTC position from collateral-manager
   → Gets BTC/USD price from pyth-oracle-adapter (validates freshness)
   → Calculates health factor
   → Validates position is underwater (HF < 1.0)
   → Calculates max liquidatable (50% for partial, 100% for full)
   → Calculates collateral to seize: repay-amount * (1 + liquidation-bonus) / btc-price
   → Transfers USDCx from liquidator to lending-pool (repaying debt)
   → Transfers seized sBTC from contract to liquidator
   → Updates borrower's position
   → (print { event: "liquidation", ... })
```

---

## Oracle Adapter

### `pyth-oracle-adapter.clar`

Wraps Pyth Network price feeds for BTC/USD and STX/USD.

#### Supported Feeds

| Asset | Pyth Feed | Usage |
|-------|-----------|-------|
| BTC/USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` | sBTC collateral valuation |
| STX/USD | STX/USD Pyth feed ID | STX collateral valuation |

#### Key Functions

```clarity
;; Implements oracle-trait

(define-read-only (get-price (asset-id (string-ascii 12)))
  ;; Returns: (response { price: uint, confidence: uint, timestamp: uint } uint)
  ;; 1. Read from Pyth contract on Stacks
  ;; 2. Validate staleness (block-height - publish-block <= max-staleness)
  ;; 3. Validate confidence interval
  ;; 4. Normalize to 8-decimal fixed-point USD
  ;; 5. Return validated price or appropriate error
)

(define-read-only (is-price-valid (asset-id (string-ascii 12)))
  ;; Quick validity check without full price return
)
```

#### Validation Rules

```
1. STALENESS: (current-block - price-block) <= max-price-staleness (300 blocks)
2. CONFIDENCE: confidence-ratio >= min-price-confidence (95%)
3. RANGE: price > u0 (sanity check)
```

---

## Trait Definitions

### `traits/sip-010-trait.clar`
Standard SIP-010 fungible token interface. Both sBTC and USDCx implement this.

### `traits/oracle-trait.clar`
```clarity
(define-trait oracle-trait
  (
    (get-price ((string-ascii 12))
      (response { price: uint, confidence: uint, timestamp: uint } uint))
    (is-price-valid ((string-ascii 12))
      (response bool uint))
  )
)
```

### `traits/pool-trait.clar`
```clarity
(define-trait pool-trait
  (
    (deposit (uint (string-ascii 12) principal) (response uint uint))
    (withdraw (uint (string-ascii 12) principal) (response uint uint))
    (get-balance (principal (string-ascii 12)) (response uint uint))
    (get-pool-stats ((string-ascii 12)) (response { total-deposits: uint, total-borrows: uint } uint))
  )
)
```

---

## sBTC Integration

### What is sBTC?

sBTC is a SIP-010 token that maintains a **1:1 peg with Bitcoin**. It's minted by the sBTC protocol when users bridge BTC to Stacks, and can be burned to redeem BTC.

### Contract Reference

```clarity
;; The sBTC token contract on Stacks
(define-constant sbtc-token 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)
```

### Clarinet Setup

Add the sBTC requirement to your Clarinet project so devnet wallets are auto-funded:

```bash
clarinet requirements add SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit
```

This includes the sBTC token contract in your Clarinet context. When you run `clarinet devnet start`, test wallets are automatically funded with sBTC.

### Usage Pattern in Contracts

```clarity
;; Accept sBTC as collateral
(contract-call? sbtc-token transfer amount tx-sender (as-contract tx-sender) none)

;; Return sBTC collateral
(as-contract
  (contract-call? sbtc-token transfer amount tx-sender recipient none))
```

### Frontend Integration

For sBTC bridging (BTC → sBTC), use the `sbtc` npm package:

```typescript
import { SbtcDeposit } from "sbtc";

// Bridge BTC to sBTC
const deposit = new SbtcDeposit({
  network: "mainnet",
  amountSats: 100000, // 0.001 BTC
  recipientAddress: userStxAddress,
});
```

---

## STX as Collateral

### Native Token Handling

STX is the native token on Stacks and uses `stx-transfer?` instead of SIP-010 `transfer`:

```clarity
;; Accept STX as collateral
(stx-transfer? amount tx-sender (as-contract tx-sender))

;; Return STX collateral
(as-contract (stx-transfer? amount tx-sender recipient))
```

### Different Risk Parameters

STX has higher volatility than BTC, so it gets stricter risk parameters:
- **Lower max LTV** (60% vs 75% for sBTC)
- **Lower liquidation threshold** (70% vs 80%)
- **Higher liquidation bonus** (8% vs 5%) — incentivizes faster liquidation

---

## Data Flow: Borrowing Lifecycle

```
User                    Frontend              Contracts
 │                        │                      │
 ├─ Connect Wallet ──────►│                      │
 │  (Leather/Xverse)      │                      │
 │                        │                      │
 │  Select collateral type│                      │
 ├─ "I want to use STX"──►│                      │
 │                        │                      │
 │  Enter STX amount      │                      │
 ├─ "1000 STX" ──────────►│── get-borrow-quote ──►│ collateral-manager
 │                        │   ("stx", 1000)       │   ├─ reads Pyth STX/USD
 │                        │◄─ quote: 450 USDCx ───│   └─ calculates at 60% LTV
 │                        │                      │
 │  User sees: "You'll   │                      │
 │  get up to 450 USDCx" │                      │
 │                        │                      │
 ├─ Deposit STX ─────────►│── deposit-collateral──►│ collateral-manager
 │                        │   -stx(1000)          │   └─ stx-transfer? to contract
 │                        │                      │
 ├─ Borrow USDCx ────────►│── borrow(400) ────────►│ collateral-manager
 │                        │                      │   ├─ reads Pyth price
 │                        │                      │   ├─ validates LTV
 │                        │                      │   └─ calls lending-pool.issue-loan
 │                        │                      │
 │  ... time passes ...   │                      │
 │                        │                      │
 ├─ Repay Loan ──────────►│── repay(400 + interest)─►│ collateral-manager
 │                        │                      │   └─ calls lending-pool.repay-loan
 │                        │                      │
 ├─ Withdraw STX ────────►│── withdraw-collateral──►│ collateral-manager
 │                        │                      │   └─ stx-transfer? back to user
```

---

## Data Flow: Borrow Quote Preview

This is the **real-time quote** feature that shows users exactly what they'll get:

```
User types amount        Frontend              Contracts
 │                        │                      │
 │  "500 STX" ───────────►│                      │
 │                        │── get-borrow-quote ──►│ collateral-manager (read-only)
 │                        │   ("stx", 500)        │   ├─ reads Pyth STX/USD [$0.85]
 │                        │                      │   ├─ collateral_value = 500 * 0.85 = $425
 │                        │                      │   ├─ max_borrow = $425 * 60% = $255
 │                        │◄─ {                   │   └─ returns quote
 │                        │     value: $425,      │
 │                        │     max: 255 USDCx,   │
 │                        │     ltv: 60%,         │
 │                        │     price: $0.85,     │
 │                        │   }                   │
 │                        │                      │
 │  UI shows:             │                      │
 │  ┌─────────────────────┤                      │
 │  │ 500 STX ≈ $425.00  │                      │
 │  │ Max borrow: 255 USDCx                      │
 │  │ LTV: 60%           │                      │
 │  │ BTC price: $0.85   │                      │
 │  │ [Borrow 200 USDCx] │                      │
 │  └─────────────────────┤                      │
```

The frontend debounces calls to `get-borrow-quote` as the user types, using `callReadOnlyFunction` from `@stacks/transactions`.

---

## Data Flow: Liquidation

```
Price Drops              Liquidator              Contracts
    │                         │                      │
    ├─ STX price drops ──────►│                      │
    │                         │                      │
    │                         ├─ is-liquidatable ────►│ liquidation-engine
    │                         │  (user, "stx")       │   ├─ reads position
    │                         │                      │   ├─ gets Pyth STX/USD
    │                         │◄─ true, max-amount ──│   └─ calculates HF
    │                         │                      │
    │                         ├─ liquidate-stx ──────►│ liquidation-engine
    │                         │  (user, repay-amt)   │   ├─ validates HF < 1.0
    │                         │                      │   ├─ transfers USDCx from liquidator
    │                         │                      │   ├─ repays debt in lending-pool
    │                         │                      │   ├─ seizes STX + 8% bonus
    │                         │◄─ seized STX ────────│   └─ transfers STX to liquidator
```

---

## Interest Rate Model

Kinked utilization curve (similar to Compound/Aave):

```
Utilization Rate = Total Borrows / Total Deposits (per asset pool)

If utilization <= 80% (optimal):
  Borrow Rate = Base Rate + (utilization / optimal) * Slope1

If utilization > 80%:
  Borrow Rate = Base Rate + Slope1 + ((utilization - optimal) / (1 - optimal)) * Slope2

Constants:
  Base Rate = 2%
  Slope1 = 4%     (gradual increase)
  Slope2 = 75%    (steep increase to incentivize repayment)
  Optimal = 80%

Supply Rate = Borrow Rate * Utilization * (1 - Protocol Fee)
```

Interest accrues per Stacks block (~10 minutes).

---

## Security Model

### Clarity-Native Protections
- **No reentrancy**: Clarity does not allow reentrancy by design
- **No overflow/underflow**: Clarity uses arbitrary precision arithmetic
- **No unchecked externals**: All inter-contract calls are explicit and typed

### Protocol-Level Protections
- **Per-asset risk parameters**: sBTC and STX have different LTV/liquidation settings reflecting their risk profiles
- **Access control**: Only authorized contracts can call internal functions
- **Oracle validation**: Every price read is validated for staleness and confidence
- **Emergency pause**: Contract owner can pause the protocol
- **Minimum collateral**: Prevents dust positions
- **Graduated liquidation**: Prevents unnecessary full liquidations
- **Post-conditions**: Frontend enforces post-conditions on all token transfers

### Known MVP Limitations
- Two collateral types only (sBTC, STX) — extensible via asset registry
- Single borrowable asset (USDCx) — pools support multi-asset lending
- Contract owner has significant power (acceptable for MVP, decentralize later)
- No flash loan protection (not needed in MVP scope)

---

## Comparison with Zest Protocol

| Feature | Zest | OnLoan | Rationale |
|---------|------|--------|-----------|
| Assets | BTC-focused (sBTC) | sBTC + STX + USDCx | Multi-asset from day one; STX adds accessibility |
| Collateral | sBTC primarily | sBTC + STX with per-asset risk params | STX is widely held; lower barrier to entry |
| Liquidation | Binary (healthy/liquidated) | Graduated (warning → partial → full) | Gives borrowers time; reduces unnecessary full liquidations |
| Oracle | Custom oracle | Pyth Network with staleness + confidence | Industry-standard, multi-source aggregated feeds |
| Pool structure | Complex multi-tier | Asset-specific pools with unified interface | Simpler attack surface, easier to audit |
| Interest model | Fixed/managed rates | Utilization-based kinked curve | Market-responsive; naturally balances supply/demand |
| Borrow preview | Basic | Real-time Pyth-powered quote preview | Users see exact amounts before committing |
| Architecture | Backend-assisted | Pure frontend + Clarity | Fully trustless, no server dependencies |
| UX | Clean but finance-forward | Mobile-first, orange, approachable | Lower barrier to entry for DeFi newcomers |
| Testing | Clarinet tests | Clarinet SDK + Vitest + fuzz testing | Modern JS toolchain, property-based testing |

---

## Post-MVP Roadmap

1. Additional collateral types (when new SIP-010 tokens gain liquidity)
2. Multi-asset borrowing (borrow sBTC against STX, etc.)
3. Governance token and DAO for parameter updates
4. Flash loan functionality
5. Formal security audit
6. sBTC-native yield strategies
7. Cross-chain expansion
