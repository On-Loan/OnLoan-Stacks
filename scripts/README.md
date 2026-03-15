# OnLoan — Scripts

Operational scripts for protocol initialization and token bridging.

## Scripts

### `setup-protocol.mjs`

Initializes the OnLoan protocol on testnet by submitting deployer transactions:

- Authorizes `collateral-manager-v2` and `liquidation-engine-v2` as callers on `onloan-core-v2`
- Seeds oracle prices for STX/USD and BTC/USD via `pyth-oracle-adapter-v2`

```bash
node setup-protocol.mjs
```

Requires a funded deployer wallet. The script derives keys from a mnemonic and broadcasts transactions to the Stacks testnet API.

### `bridge-usdcx/`

Bridges USDC from Ethereum Sepolia to USDCx on Stacks testnet using the Hyperlane warp route.

```bash
cd bridge-usdcx
npm install
cp .env.example .env    # Configure keys and recipient

# Deposit USDC → USDCx
npm run deposit

# Check USDCx balance on Stacks
npm run check
```

See `bridge-usdcx/.env.example` for required environment variables.

## Environment Variables

### `setup-protocol.mjs`

Uses a hardcoded mnemonic for the deployer wallet (testnet only). No `.env` file needed.

### `bridge-usdcx/.env`

| Variable | Description |
|----------|-------------|
| `ETHEREUM_PRIVATE_KEY` | Ethereum Sepolia private key (for USDC approval + deposit) |
| `STACKS_RECIPIENT` | Stacks testnet address to receive USDCx |
