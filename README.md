# OnLoan — Decentralized Peer-to-Peer Lending & Borrowing on Bitcoin

> Lend your crypto. Borrow against it. No middlemen. No banks. Just smart contracts on Bitcoin.

![Stacks](https://img.shields.io/badge/Built%20on-Stacks%20(Bitcoin%20L2)-orange)
![Clarity](https://img.shields.io/badge/Smart%20Contracts-Clarity%20v2-orange)
![sBTC](https://img.shields.io/badge/sBTC-Bitcoin%20Peg-F7931A)
![Testnet](https://img.shields.io/badge/Network-Stacks%20Testnet-blue)
![Status](https://img.shields.io/badge/Status-Live%20on%20Testnet-brightgreen)

---

## The Problem

Getting a loan shouldn't require a bank, a credit score, or weeks of paperwork. Yet billions of dollars in crypto sit idle in wallets — earning nothing — while people who need short-term capital have no way to access it without selling their holdings.

Traditional lending platforms are either **centralized** (your funds are controlled by a company that can freeze them, change terms, or go bankrupt) or **complex** (requiring deep DeFi knowledge just to get started).

Bitcoin holders face an additional challenge: there are very few lending options that let you **keep your Bitcoin exposure** while accessing liquidity.

## The Solution

**OnLoan** is a fully decentralized peer-to-peer lending and borrowing protocol built on the [Stacks blockchain](https://www.stacks.co/) — a Bitcoin Layer 2. It connects lenders who want to earn yield with borrowers who need capital, all through transparent smart contracts.

**For Lenders:** Deposit USDCx, sBTC, or STX into lending pools and earn interest from borrowers. Your funds work for you — and you can withdraw anytime there's available liquidity.

**For Borrowers:** Deposit sBTC or STX as collateral, and instantly borrow USDCx. Keep your crypto exposure while accessing the capital you need. Real-time Pyth oracle pricing ensures fair, transparent collateral valuations.

**No backend servers. No custodians. No hidden fees.** Every interest rate, every collateral ratio, and every liquidation threshold is computed on-chain in Clarity smart contracts that anyone can read and verify.

---

## How It Works

```
  Lender                                      Borrower
    │                                            │
    │  1. Deposit USDCx/sBTC/STX                 │  1. Deposit sBTC or STX
    │     into Lending Pool                      │     as collateral
    │         │                                  │         │
    │         ▼                                  │         ▼
    │  ┌─────────────┐    Oracle Price    ┌──────────────────┐
    │  │ Lending Pool │◄────────────────►│ Collateral Manager│
    │  │  (holds      │    (Pyth Network) │  (tracks ratios) │
    │  │   deposits)  │                   │                  │
    │  └──────┬───────┘                   └────────┬─────────┘
    │         │                                    │
    │         │  2. Pool transfers USDCx           │  2. Borrow USDCx
    │         │     to borrower                    │     against collateral
    │         │                                    │
    │  3. Earn interest                   3. Repay loan + interest
    │     from borrows                       to reclaim collateral
```

### Supported Assets

| Asset | What You Can Do | Details |
|-------|----------------|---------|
| **sBTC** | Lend for yield, or use as collateral to borrow | Bitcoin-pegged token on Stacks (SIP-010) |
| **STX** | Lend for yield, or use as collateral to borrow | Native Stacks token |
| **USDCx** | Lend for yield, or borrow against collateral | USD stablecoin on Stacks (SIP-010) |

### Collateral Parameters

| Collateral | Max Loan-to-Value | Liquidation Threshold |
|------------|-------------------|----------------------|
| **sBTC** | 75% | 80% |
| **STX** | 60% | 65% |

---

## Deployed Contracts (Stacks Testnet)

All contracts are deployed and verified on the Stacks testnet. Click any link to view the source code and transaction history on the explorer.

| Contract | Purpose | Explorer |
|----------|---------|----------|
| **onloan-core-v2** | Governance, access control, asset registry | [View on Explorer](https://explorer.hiro.so/txid/ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.onloan-core-v2?chain=testnet) |
| **lending-pool-v2** | Multi-asset lending pools, deposits, withdrawals, interest | [View on Explorer](https://explorer.hiro.so/txid/ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.lending-pool-v2?chain=testnet) |
| **collateral-manager-v2** | Collateral deposits, borrowing, repayment, health factors | [View on Explorer](https://explorer.hiro.so/txid/ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.collateral-manager-v2?chain=testnet) |
| **liquidation-engine-v2** | Liquidation of undercollateralized positions | [View on Explorer](https://explorer.hiro.so/txid/ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.liquidation-engine-v2?chain=testnet) |
| **pyth-oracle-adapter-v2** | Pyth Network price feed integration (BTC/USD, STX/USD) | [View on Explorer](https://explorer.hiro.so/txid/ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.pyth-oracle-adapter-v2?chain=testnet) |
| **usdcx** | USDCx stablecoin token (SIP-010) | [View on Explorer](https://explorer.hiro.so/txid/ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.usdcx?chain=testnet) |
| **sip-010-trait-v2** | SIP-010 fungible token trait | [View on Explorer](https://explorer.hiro.so/txid/ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.sip-010-trait-v2?chain=testnet) |
| **oracle-trait-v2** | Oracle adapter trait | [View on Explorer](https://explorer.hiro.so/txid/ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV.oracle-trait-v2?chain=testnet) |

**Deployer address:** `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV`

---

## Features

### Landing Page
- Clear value proposition explaining peer-to-peer lending on Bitcoin
- Live protocol statistics (TVL, total borrowed, active lenders)
- Step-by-step "How It Works" walkthrough  
- Mobile-responsive design with orange-themed visual identity

### Dashboard
- **Lend** — Deposit assets into lending pools and earn yield from borrower interest
- **Borrow** — Post collateral, see real-time borrow quotes powered by Pyth oracle, and borrow USDCx
- **Positions** — Monitor active lending and borrowing positions with health factor indicators
- **Liquidate** — Browse undercollateralized positions and liquidate for profit

### Oracle Integration
- Real-time price feeds from [Pyth Network](https://pyth.network/) for BTC/USD and STX/USD
- Staleness checks to prevent stale-price exploits (600-block maximum age)
- Client-side Pyth API fallback for instant quote previews before on-chain confirmation

### Security
- All protocol logic is on-chain in Clarity — a decidable, non-Turing-complete language designed to prevent exploits
- Post-conditions on every transaction prevent unexpected token transfers
- Configurable access control: only authorized contracts can modify pool state
- Graduated liquidation protects borrowers from flash crashes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Stacks (Bitcoin Layer 2) |
| **Smart Contracts** | Clarity v2 |
| **Frontend** | Next.js 16 + React 19 + TypeScript |
| **Styling** | Tailwind CSS with custom orange design system |
| **Wallet Support** | Leather & Xverse via `@stacks/connect` |
| **Oracle** | Pyth Network (sub-second price feeds) |
| **Contract Testing** | Clarinet SDK + Vitest (79 tests) |
| **Frontend Testing** | Vitest + React Testing Library (39 tests) |
| **Tokens** | sBTC (SIP-010), USDCx (SIP-010), STX (native) |

---

## Project Structure

```
OnLoan-Stacks/
├── contract/                    # Clarity smart contracts & tests
│   ├── contracts/               # Deployed Clarity contracts
│   │   ├── onloan-core-v2.clar
│   │   ├── lending-pool-v2.clar
│   │   ├── collateral-manager-v2.clar
│   │   ├── liquidation-engine-v2.clar
│   │   ├── pyth-oracle-adapter-v2.clar
│   │   ├── usdcx.clar
│   │   └── traits/
│   ├── tests/                   # Contract unit & integration tests
│   └── Clarinet.toml
│
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/                 # Pages (landing, dashboard)
│   │   ├── components/          # UI components
│   │   ├── hooks/               # React hooks for contract calls
│   │   ├── lib/                 # Utilities, constants, formatting
│   │   └── providers/           # Wallet & network providers
│   └── public/                  # Static assets (logo, icons)
│
└── scripts/                     # Operational scripts
    ├── setup-protocol.mjs       # Protocol initialization (oracle, auth)
    └── bridge-usdcx/            # USDCx bridging from Ethereum
```

See the README in each folder for detailed setup instructions.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Clarinet](https://github.com/hirosystems/clarinet) 3.x (for contract development)
- A Stacks wallet ([Leather](https://leather.io/) or [Xverse](https://www.xverse.app/))

### Run the Frontend

```bash
cd frontend
cp .env.example .env.local    # Configure environment variables
npm install
npm run dev                   # Opens at http://localhost:3000
```

### Run Contract Tests

```bash
cd contract
npm install
npm test                      # Runs 79 Clarity contract tests
```

### Run Frontend Tests

```bash
cd frontend
npm test                      # Runs 39 component & hook tests
```

---

## Contributing

OnLoan is open source. Contributions, bug reports, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch and open a Pull Request

---

## License

MIT

---

<p align="center">
  <strong>OnLoan</strong> — Peer-to-peer lending and borrowing, powered by Bitcoin.
</p>
