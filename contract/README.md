# OnLoan — Smart Contracts

Clarity v2 smart contracts for the OnLoan lending and borrowing protocol, tested with Clarinet SDK + Vitest.

## Contracts

| Contract | Purpose |
|----------|---------|
| `onloan-core-v2` | Governance, access control, asset registry |
| `lending-pool-v2` | Multi-asset lending pools, deposits, withdrawals, interest |
| `collateral-manager-v2` | Collateral deposits, borrowing, repayment, health factors |
| `liquidation-engine-v2` | Liquidation of undercollateralized positions |
| `pyth-oracle-adapter-v2` | Pyth Network price feed integration |
| `usdcx` | USDCx stablecoin token (SIP-010) |

### Traits

| Trait | Purpose |
|-------|---------|
| `sip-010-trait-v2` | Standard fungible token interface |
| `oracle-trait-v2` | Oracle adapter interface |
| `pool-trait-v2` | Lending pool interface |

## Setup

```bash
# Install dependencies
npm install

# Verify contracts compile
clarinet check

# Run all tests (79 tests)
npm test

# Run tests in watch mode
npm run test:watch
```

## Requirements

- [Clarinet](https://github.com/hirosystems/clarinet) 3.x
- [Node.js](https://nodejs.org/) 18+

## Project Structure

```
contracts/
├── onloan-core-v2.clar
├── lending-pool-v2.clar
├── collateral-manager-v2.clar
├── liquidation-engine-v2.clar
├── pyth-oracle-adapter-v2.clar
├── usdcx.clar
└── traits/
    ├── sip-010-trait-v2.clar
    ├── oracle-trait-v2.clar
    └── pool-trait-v2.clar

tests/
├── onloan-core-v2.test.ts
├── lending-pool-v2.test.ts
├── collateral-manager-v2.test.ts
├── liquidation-engine-v2.test.ts
├── pyth-oracle-adapter-v2.test.ts
└── ...

Clarinet.toml          # Contract configuration
vitest.config.ts       # Test runner config
```

## Deployment

Contracts are deployed on Stacks testnet at deployer address `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV`. See the main [README](../README.md) for explorer links.
