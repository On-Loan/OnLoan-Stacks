# OnLoan — Deployment Playbook

> Complete deployment guide for the OnLoan lending protocol on the Stacks blockchain using Clarinet 3.x.

---

## Table of Contents

1. [Pre-Deployment Requirements](#pre-deployment-requirements)
2. [Environment Setup](#environment-setup)
3. [sBTC Integration Setup](#sbtc-integration-setup)
4. [Contract Deployment Order](#contract-deployment-order)
5. [Devnet Deployment](#devnet-deployment)
6. [Testnet Deployment](#testnet-deployment)
7. [Mainnet Deployment](#mainnet-deployment)
8. [Frontend Deployment](#frontend-deployment)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Security Checklist](#security-checklist)
11. [Monitoring & Operations](#monitoring--operations)
12. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Requirements

### Software

| Tool | Version | Install |
|------|---------|---------|
| Clarinet | 3.x | `brew install clarinet` or [GitHub releases](https://github.com/hirosystems/clarinet/releases) |
| Node.js | 18+ | `nvm install 18` |
| Stacks.js | latest | `npm install @stacks/transactions @stacks/connect @stacks/network` |

### Wallets

- **Leather** (desktop) — [leather.io](https://leather.io)
- **Xverse** (mobile/desktop) — [xverse.app](https://www.xverse.app/)

### Accounts

- Deployer wallet funded with STX for transaction fees
- Multi-sig wallet recommended for mainnet ownership

---

## Environment Setup

### Clarinet Configuration (`Clarinet.toml`)

```toml
[project]
name = "onloan"
requirements = [
  { contract_id = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit" }
]

[contracts.sip-010-trait]
path = "contracts/traits/sip-010-trait.clar"

[contracts.oracle-trait]
path = "contracts/traits/oracle-trait.clar"

[contracts.pool-trait]
path = "contracts/traits/pool-trait.clar"

[contracts.onloan-core]
path = "contracts/onloan-core.clar"

[contracts.pyth-oracle-adapter]
path = "contracts/pyth-oracle-adapter.clar"

[contracts.lending-pool]
path = "contracts/lending-pool.clar"

[contracts.collateral-manager]
path = "contracts/collateral-manager.clar"

[contracts.liquidation-engine]
path = "contracts/liquidation-engine.clar"
```

### Adding sBTC Requirement

```bash
# This adds the sBTC contract as a project requirement
# Devnet wallets are automatically funded with sBTC for testing
clarinet requirements add SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit
```

The sBTC token contract is at:
```
SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
```

### Environment Variables

```bash
# .env.local (frontend)
NEXT_PUBLIC_NETWORK=devnet|testnet|mainnet
NEXT_PUBLIC_CONTRACT_DEPLOYER=<deployer-address>
NEXT_PUBLIC_STACKS_API_URL=https://api.hiro.so
NEXT_PUBLIC_SBTC_CONTRACT=SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
NEXT_PUBLIC_PYTH_ENDPOINT=https://hermes.pyth.network
NEXT_PUBLIC_PYTH_BTC_USD_FEED=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
```

---

## sBTC Integration Setup

### Devnet

On devnet, Clarinet automatically provisions sBTC to test wallets when the requirement is added. No manual bridging needed.

### Testnet

1. Obtain testnet BTC from a faucet
2. Use the sBTC bridge to convert BTC → sBTC on testnet
3. Alternatively, deploy a mock sBTC SIP-010 token for testing

```clarity
;; Testnet mock sBTC (DO NOT use on mainnet)
(define-fungible-token mock-sbtc)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1000))
    (ft-mint? mock-sbtc amount recipient)))
```

### Mainnet

sBTC is the real Bitcoin-backed SIP-010 token. Users bridge BTC → sBTC via the official sBTC bridge. The frontend must integrate the `sbtc` npm package for bridge UI.

```bash
npm install sbtc
```

---

## Contract Deployment Order

Contracts must be deployed in dependency order:

```
1. sip-010-trait          ← SIP-010 fungible token trait
2. oracle-trait           ← Oracle interface trait
3. pool-trait             ← Lending pool interface trait
4. pyth-oracle-adapter    ← Pyth oracle integration
5. onloan-core            ← Protocol core (ownership, parameters, asset registry)
6. lending-pool           ← Multi-asset lending pools (USDCx, sBTC, STX)
7. collateral-manager     ← Multi-collateral management + borrowing
8. liquidation-engine     ← Liquidation logic
```

### Why This Order?

- **Traits first**: All contracts reference trait definitions
- **Oracle before core**: Core needs oracle for parameter validation
- **Core before pool**: Pool references core for protocol state
- **Pool before collateral**: Collateral manager transfers to/from pools
- **Liquidation last**: Depends on both pool and collateral manager

---

## Devnet Deployment

```bash
# 1. Check contracts compile
clarinet check

# 2. Run all tests
npm test

# 3. Start local devnet
clarinet devnet start

# 4. Contracts auto-deploy in Clarinet.toml order
# 5. Test wallets are pre-funded with STX and sBTC
```

### Devnet Addresses

```
deployer: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
wallet_1: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
wallet_2: ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
```

---

## Testnet Deployment

### Step 1: Configure Network

```bash
# Clarinet.toml network settings
[project]
name = "onloan"

[repl]
costs_version = 3
```

### Step 2: Fund Deployer

Get testnet STX from the Stacks faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet

### Step 3: Deploy

```bash
# Deploy all contracts to testnet
clarinet deployments apply --deployment deployments/default.testnet-plan.yaml
```

### Step 4: Initialize Protocol

After deployment, call initialization functions:

```bash
# Register sBTC asset with risk parameters
# Register STX asset with risk parameters  
# Set oracle feed IDs
# Set initial interest rate parameters
```

### Step 5: Verify

```bash
# Check contract deployment on explorer
# https://explorer.hiro.so/txid/<tx-id>?chain=testnet
```

---

## Mainnet Deployment

### Pre-Mainnet Checklist

- [ ] All tests pass (unit, integration, fuzz)
- [ ] Static analysis with `clarinet check` clean
- [ ] Testnet deployment runs for minimum 2 weeks without issues
- [ ] Security audit completed by reputable firm
- [ ] Multi-sig ownership configured
- [ ] Emergency pause function tested
- [ ] Oracle feed reliability verified (Pyth)
- [ ] sBTC integration tested end-to-end
- [ ] Rate limiting and borrowing caps configured
- [ ] Frontend reviewed for security (no private keys exposed)

### Deploy

```bash
# Generate mainnet deployment plan
clarinet deployments generate --mainnet

# Review the plan carefully
cat deployments/default.mainnet-plan.yaml

# Apply (requires deployer STX balance for fees)
clarinet deployments apply --deployment deployments/default.mainnet-plan.yaml
```

### Post-Mainnet Setup

1. **Transfer ownership** to multi-sig wallet
2. **Set conservative initial parameters**:
   - Low borrowing caps per asset
   - Conservative LTV ratios
   - Small pool size limits
3. **Configure oracle** with strict staleness thresholds
4. **Enable protocol** (un-pause)
5. **Announce** deployment addresses

---

## Frontend Deployment

### Build & Deploy

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel (recommended)
npx vercel deploy --prod

# Or deploy to other platforms
# Netlify: netlify deploy --prod
# AWS: aws s3 sync out/ s3://onloan-app/
```

### Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_NETWORK": "mainnet",
    "NEXT_PUBLIC_CONTRACT_DEPLOYER": "<mainnet-deployer>",
    "NEXT_PUBLIC_STACKS_API_URL": "https://api.hiro.so",
    "NEXT_PUBLIC_SBTC_CONTRACT": "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"
  }
}
```

### Wallet Integration

The frontend connects to Leather and Xverse wallets via `@stacks/connect`:

```typescript
import { showConnect } from "@stacks/connect";

showConnect({
  appDetails: {
    name: "OnLoan",
    icon: "/onloan-logo.png",
  },
  onFinish: () => { /* wallet connected */ },
  userSession,
});
```

---

## Post-Deployment Verification

### Contract Verification

```bash
# 1. Verify all contracts deployed
# Check Stacks Explorer: https://explorer.hiro.so

# 2. Verify ownership
stx call-read <deployer>.<contract> get-owner

# 3. Verify asset registration
stx call-read <deployer>.onloan-core get-asset-config sbtc
stx call-read <deployer>.onloan-core get-asset-config stx

# 4. Verify oracle integration
stx call-read <deployer>.pyth-oracle-adapter get-price sbtc
stx call-read <deployer>.pyth-oracle-adapter get-price stx

# 5. Test small deposit/withdraw cycle
# 6. Test small borrow/repay cycle
# 7. Verify borrow quote returns correct values
```

### Smoke Tests

1. Connect wallet (Leather or Xverse)
2. Navigate landing page → dashboard
3. Deposit 1 USDCx into lending pool
4. Withdraw 1 USDCx
5. Deposit 0.0001 sBTC as collateral
6. Check borrow quote (should show available USDCx)
7. Borrow small amount
8. Repay immediately
9. Withdraw collateral
10. Verify all balances correct

---

## Security Checklist

### Smart Contract Security

- [ ] **Access Control**: All admin functions protected by `is-eq tx-sender contract-owner`
- [ ] **Overflow Protection**: All arithmetic uses Clarity's built-in overflow protection
- [ ] **Reentrancy**: Clarity prevents reentrancy by design (no external calls mid-execution)
- [ ] **Oracle Manipulation**: Staleness checks on all price data
  - BTC/USD: max 10 minutes stale
  - STX/USD: max 10 minutes stale
- [ ] **Flash Loan Protection**: Deposit and borrow in separate transactions
- [ ] **Minimum Amounts**: All operations enforce minimum thresholds
- [ ] **Emergency Pause**: Protocol can be paused by owner
- [ ] **LTV Boundaries**: Max LTV per asset enforced on every borrow
  - sBTC: 75% max LTV, 80% liquidation threshold
  - STX: 60% max LTV, 70% liquidation threshold
- [ ] **Liquidation Caps**: Max liquidatable amount per transaction
- [ ] **Integer Division**: All division rounds in protocol's favor

### sBTC-Specific Security

- [ ] sBTC contract address is hardcoded (not configurable post-deploy)
- [ ] sBTC transfers use SIP-010 `transfer` function
- [ ] sBTC amounts validated (8 decimal places, satoshi precision)
- [ ] Bridge integration tested against mainnet sBTC contract

### STX-Specific Security

- [ ] STX transfers use native `stx-transfer?` (not SIP-010)
- [ ] STX amounts validated (6 decimal places)
- [ ] Account for STX locked in stacking when checking balances

### Frontend Security

- [ ] No private keys stored in frontend code
- [ ] All contract calls go through wallet signing (Leather/Xverse)
- [ ] API URLs use HTTPS only
- [ ] CSP headers configured
- [ ] No sensitive data in localStorage
- [ ] Input validation on all user-facing forms

### Operational Security

- [ ] Deployer key stored in hardware wallet
- [ ] Multi-sig for protocol parameter changes
- [ ] Monitoring alerts configured
- [ ] Incident response plan documented
- [ ] Regular security reviews scheduled

---

## Monitoring & Operations

### Key Metrics to Monitor

| Metric | Alert Threshold |
|--------|----------------|
| Total Value Locked (TVL) | Sudden drop > 20% |
| Pool utilization per asset | > 90% (liquidity crisis) |
| Number of positions with HF < 1.2 | > 10 active |
| Oracle price staleness | > 5 minutes |
| Failed liquidation attempts | Any |
| Contract call errors | Spike > 5x baseline |
| sBTC bridge availability | Downtime |

### Monitoring Tools

- **Stacks Explorer** — Transaction monitoring
- **Hiro API** — Contract state queries
- **Custom Dashboard** — Protocol metrics via Stacks API polling
- **PagerDuty / OpsGenie** — Alert routing

### Routine Operations

1. **Daily**: Check oracle staleness, pool utilization, HF distribution
2. **Weekly**: Review interest rate parameters, liquidation activity
3. **Monthly**: Review asset risk parameters (LTV, thresholds)
4. **Quarterly**: Security review, dependency updates

---

## Rollback Procedures

### Clarity Contracts Cannot Be Updated In Place

Stacks smart contracts are immutable once deployed. Rollback strategies:

1. **Emergency Pause**: Immediately pause protocol via `set-protocol-paused`
2. **Migration**: Deploy new contract version, migrate state
3. **Fund Recovery**: If critical bug, pause + manual fund recovery via owner functions

### Migration Process

```
1. Pause old contract
2. Deploy new contract version
3. Transfer protocol ownership
4. Migrate lending pool state (snapshot + replay or data transfer)
5. Update frontend to point to new contracts
6. Un-pause on new contracts
7. Deprecate old contracts (leave paused)
```

### Frontend Rollback

```bash
# Vercel: Instant rollback to previous deployment
vercel rollback

# Or redeploy previous git tag
git checkout v1.0.0
npm run build
npx vercel deploy --prod
```
