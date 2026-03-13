# OnLoan — Testing Strategy & Guide

> Testing Clarity smart contracts with Clarinet SDK + Vitest, property-based fuzz testing, and frontend tests.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Tooling: Clarinet SDK + Vitest](#tooling)
3. [Test Structure](#test-structure)
4. [Configuration](#configuration)
5. [Unit Tests](#unit-tests)
6. [Integration Tests](#integration-tests)
7. [Fuzz Testing (Property-Based)](#fuzz-testing)
8. [Frontend Tests](#frontend-tests)
9. [Test Coverage Requirements](#test-coverage-requirements)
10. [Running Tests](#running-tests)

---

## Testing Philosophy

- **Every public function** must have at least one positive and one negative test case
- **Critical paths** (borrowing, liquidation, repayment) require integration tests spanning multiple contracts
- **Fuzz testing** is mandatory for mathematical functions (interest, health factors, LTV)
- **All tests in TypeScript** — using the Clarinet SDK + Vitest pattern (no `.clar` test files)
- **simnet** provides an in-process simulated blockchain — no devnet needed for tests

### Protocol Invariants (Must Always Hold)

```
1. total_collateral_value >= total_borrowed_value (at time of each borrow)
2. sum(lender_deposits) == pool total_deposits (per asset)
3. health_factor(position) >= 1.0 immediately after any borrow
4. No position can borrow more than max_ltv * collateral_value
5. Liquidation can only occur when health_factor < 1.0
6. sBTC and STX use different LTV parameters
7. All borrowed amounts are in USDCx
```

---

## Tooling

### Clarinet SDK + Vitest

OnLoan uses the modern Stacks testing stack:

- **[`@stacks/clarinet-sdk`](https://www.npmjs.com/package/@stacks/clarinet-sdk)** — Provides the `simnet` object, a simulated Stacks blockchain that runs in-process
- **[Vitest](https://vitest.dev/)** — Test runner with built-in assertions
- **`@stacks/transactions`** — Clarity value helpers (`Cl.uint()`, `Cl.principal()`, etc.)

The `simnet` object is automatically available in all test files and exposes:
- `simnet.callPublicFn()` — Execute public contract functions
- `simnet.callReadOnlyFn()` — Query read-only functions
- `simnet.getDataVar()` — Read contract data variables
- `simnet.getMapEntry()` — Read contract map entries
- `simnet.getAccounts()` — Get funded test wallet addresses

---

## Test Structure

```
tests/
├── onloan-core.test.ts             # Core contract unit tests
├── lending-pool.test.ts            # Lending pool unit tests
├── collateral-manager.test.ts      # Collateral manager unit tests
├── liquidation-engine.test.ts      # Liquidation engine unit tests
├── pyth-oracle-adapter.test.ts     # Oracle adapter unit tests
│
├── integration/
│   ├── borrow-lifecycle.test.ts    # Full borrow → repay flow (sBTC + STX)
│   ├── liquidation-flow.test.ts    # Collateralize → price drop → liquidate
│   ├── multi-asset-pool.test.ts    # Multiple lenders/borrowers across assets
│   └── oracle-failure.test.ts      # Oracle staleness/failure scenarios
│
├── fuzz/
│   ├── interest-calculation.test.ts
│   ├── health-factor.test.ts
│   ├── liquidation-amounts.test.ts
│   └── ltv-boundaries.test.ts
│
└── helpers/
    └── test-utils.ts               # Shared utilities, constants
```

---

## Configuration

### Root `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import { vitestSetupFilePath } from "@stacks/clarinet-sdk/vitest";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: [vitestSetupFilePath],
  },
});
```

### Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["tests/**/*.ts"],
  "exclude": ["node_modules", "frontend"]
}
```

### Root `package.json` scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:report": "vitest run -- --coverage"
  },
  "devDependencies": {
    "@stacks/clarinet-sdk": "latest",
    "@stacks/transactions": "latest",
    "vitest": "latest",
    "fast-check": "latest"
  }
}
```

### `Clarinet.toml`

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

---

## Unit Tests

### Pattern: Using the Clarinet SDK

```typescript
import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
```

### `onloan-core.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("onloan-core", () => {
  it("ensures the contract is deployed", () => {
    const source = simnet.getContractSource("onloan-core");
    expect(source).toBeDefined();
  });

  it("returns correct default max-ltv for sBTC", () => {
    const result = simnet.callReadOnlyFn(
      "onloan-core", "get-asset-config",
      [Cl.stringAscii("sbtc")], deployer
    );
    // sBTC max LTV should be 75% (7500 basis points)
    expect(result.result).toBeOk(
      Cl.tuple({
        "max-ltv": Cl.uint(7500),
        // ... other fields
      })
    );
  });

  it("only owner can update protocol parameters", () => {
    // Owner can update
    const ownerCall = simnet.callPublicFn(
      "onloan-core", "set-base-interest-rate",
      [Cl.uint(300)], deployer
    );
    expect(ownerCall.result).toBeOk(Cl.bool(true));

    // Non-owner fails
    const nonOwnerCall = simnet.callPublicFn(
      "onloan-core", "set-base-interest-rate",
      [Cl.uint(500)], wallet1
    );
    expect(nonOwnerCall.result).toBeErr(Cl.uint(1000)); // ERR-NOT-AUTHORIZED
  });

  it("can pause and unpause protocol", () => {
    simnet.callPublicFn("onloan-core", "set-protocol-paused", [Cl.bool(true)], deployer);
    const paused = simnet.getDataVar("onloan-core", "protocol-paused");
    expect(paused).toBeBool(true);
  });
});
```

### `lending-pool.test.ts`

```typescript
describe("lending-pool", () => {
  // === Deposits ===
  it("allows USDCx deposit into pool", () => {
    const deposit = simnet.callPublicFn(
      "lending-pool", "deposit",
      [Cl.uint(1000000), Cl.stringAscii("usdcx")], wallet1
    );
    expect(deposit.result).toBeOk(Cl.uint(1000000));
  });

  it("rejects deposit of zero", () => {
    const deposit = simnet.callPublicFn(
      "lending-pool", "deposit",
      [Cl.uint(0), Cl.stringAscii("usdcx")], wallet1
    );
    expect(deposit.result).toBeErr(Cl.uint(1001)); // ERR-INVALID-AMOUNT
  });

  it("updates total deposits correctly", () => {
    simnet.callPublicFn("lending-pool", "deposit", [Cl.uint(1000), Cl.stringAscii("usdcx")], wallet1);
    simnet.callPublicFn("lending-pool", "deposit", [Cl.uint(2000), Cl.stringAscii("usdcx")], wallet2);

    const stats = simnet.callReadOnlyFn(
      "lending-pool", "get-pool-stats",
      [Cl.stringAscii("usdcx")], deployer
    );
    // total deposits should be 3000
  });

  // === Withdrawals ===
  it("allows withdrawal of deposited amount", () => { /* ... */ });
  it("rejects withdrawal exceeding balance", () => { /* ... */ });
  it("includes earned interest in withdrawal", () => { /* ... */ });

  // === Pool State ===
  it("tracks pool utilization correctly", () => { /* ... */ });
  it("calculates APY based on utilization", () => { /* ... */ });
});
```

### `collateral-manager.test.ts`

```typescript
describe("collateral-manager", () => {
  // === sBTC Collateral ===
  it("accepts sBTC collateral deposit", () => {
    const deposit = simnet.callPublicFn(
      "collateral-manager", "deposit-collateral-sbtc",
      [Cl.uint(100000)], wallet1  // 0.001 BTC in sats
    );
    expect(deposit.result).toBeOk(Cl.uint(100000));
  });

  it("rejects sBTC below minimum collateral", () => {
    const deposit = simnet.callPublicFn(
      "collateral-manager", "deposit-collateral-sbtc",
      [Cl.uint(100)], wallet1  // below min
    );
    expect(deposit.result).toBeErr(Cl.uint(1003)); // ERR-BELOW-MIN-COLLATERAL
  });

  // === STX Collateral ===
  it("accepts STX collateral deposit", () => {
    const deposit = simnet.callPublicFn(
      "collateral-manager", "deposit-collateral-stx",
      [Cl.uint(1000000000)], wallet1  // 1000 STX (6 decimals)
    );
    expect(deposit.result).toBeOk(Cl.uint(1000000000));
  });

  // === Borrow Quote ===
  it("returns correct borrow quote for STX collateral", () => {
    const quote = simnet.callReadOnlyFn(
      "collateral-manager", "get-borrow-quote",
      [Cl.stringAscii("stx"), Cl.uint(1000000000)], wallet1
    );
    // Should return quote with max-borrowable based on 60% LTV
    expect(quote.result).toBeOk(/* tuple with value, max, ltv */);
  });

  it("returns correct borrow quote for sBTC collateral", () => {
    const quote = simnet.callReadOnlyFn(
      "collateral-manager", "get-borrow-quote",
      [Cl.stringAscii("sbtc"), Cl.uint(100000)], wallet1
    );
    // Should return quote with max-borrowable based on 75% LTV
  });

  // === Borrowing ===
  it("allows borrowing within LTV limit", () => { /* ... */ });
  it("rejects borrowing above max LTV", () => { /* ... */ });
  it("rejects borrowing with stale oracle price", () => { /* ... */ });
  it("uses correct LTV for sBTC vs STX", () => { /* ... */ });

  // === Health Factor ===
  it("calculates health factor correctly for sBTC", () => { /* ... */ });
  it("calculates health factor correctly for STX", () => { /* ... */ });
  it("health factor decreases when oracle price drops", () => { /* ... */ });

  // === Repayment ===
  it("allows full loan repayment", () => { /* ... */ });
  it("allows partial repayment", () => { /* ... */ });
  it("unlocks collateral after full repayment", () => { /* ... */ });
});
```

### `liquidation-engine.test.ts`

```typescript
describe("liquidation-engine", () => {
  // === Eligibility ===
  it("healthy position cannot be liquidated", () => {
    // Setup: deposit collateral, borrow conservatively
    // Action: attempt liquidation
    // Assert: ERR-POSITION-HEALTHY
    const result = simnet.callPublicFn(
      "liquidation-engine", "liquidate-stx-position",
      [Cl.principal(wallet1), Cl.uint(100)], wallet2
    );
    expect(result.result).toBeErr(Cl.uint(1005)); // ERR-POSITION-HEALTHY
  });

  it("allows partial liquidation at HF 0.8-1.0", () => { /* ... */ });
  it("allows full liquidation at HF < 0.8", () => { /* ... */ });

  // === Execution ===
  it("liquidator receives collateral + bonus", () => { /* ... */ });
  it("borrower debt is reduced correctly", () => { /* ... */ });
  it("sBTC liquidation uses 5% bonus", () => { /* ... */ });
  it("STX liquidation uses 8% bonus", () => { /* ... */ });
});
```

### `pyth-oracle-adapter.test.ts`

```typescript
describe("pyth-oracle-adapter", () => {
  it("returns valid BTC/USD price", () => {
    const price = simnet.callReadOnlyFn(
      "pyth-oracle-adapter", "get-price",
      [Cl.stringAscii("sbtc")], deployer
    );
    expect(price.result).toBeOk(/* tuple with price, confidence, timestamp */);
  });

  it("returns valid STX/USD price", () => {
    const price = simnet.callReadOnlyFn(
      "pyth-oracle-adapter", "get-price",
      [Cl.stringAscii("stx")], deployer
    );
    expect(price.result).toBeOk(/* tuple */);
  });

  it("rejects stale price data", () => { /* ... */ });
  it("rejects low confidence price", () => { /* ... */ });
  it("rejects unknown asset id", () => { /* ... */ });
});
```

---

## Integration Tests

### `borrow-lifecycle.test.ts`

```typescript
describe("Borrow Lifecycle - sBTC", () => {
  it("completes full sBTC borrow-repay cycle", () => {
    const lender = accounts.get("wallet_1")!;
    const borrower = accounts.get("wallet_2")!;

    // 1. Lender deposits 10,000 USDCx
    const deposit = simnet.callPublicFn(
      "lending-pool", "deposit",
      [Cl.uint(10000000000), Cl.stringAscii("usdcx")], lender
    );
    expect(deposit.result).toBeOk(Cl.uint(10000000000));

    // 2. Borrower deposits 0.1 sBTC as collateral
    const collateral = simnet.callPublicFn(
      "collateral-manager", "deposit-collateral-sbtc",
      [Cl.uint(10000000)], borrower  // 0.1 BTC in sats
    );
    expect(collateral.result).toBeOk(Cl.uint(10000000));

    // 3. Check borrow quote
    const quote = simnet.callReadOnlyFn(
      "collateral-manager", "get-borrow-quote",
      [Cl.stringAscii("sbtc"), Cl.uint(10000000)], borrower
    );
    // With BTC at $50k, 0.1 BTC = $5000, at 75% LTV = max $3750 USDCx

    // 4. Borrow 3000 USDCx (60% LTV, under 75% max)
    const borrow = simnet.callPublicFn(
      "collateral-manager", "borrow",
      [Cl.uint(3000000000)], borrower
    );
    expect(borrow.result).toBeOk(Cl.uint(3000000000));

    // 5. Verify health factor > 1.0
    const hf = simnet.callReadOnlyFn(
      "collateral-manager", "get-health-factor",
      [Cl.principal(borrower), Cl.stringAscii("sbtc")], borrower
    );
    // Should be above 10000 (1.0)

    // 6. Repay full loan + interest
    const repay = simnet.callPublicFn(
      "collateral-manager", "repay",
      [Cl.uint(3000000000), Cl.stringAscii("sbtc")], borrower
    );
    expect(repay.result).toBeOk(/* repaid amount */);

    // 7. Withdraw sBTC collateral
    const withdraw = simnet.callPublicFn(
      "collateral-manager", "withdraw-collateral",
      [Cl.uint(10000000), Cl.stringAscii("sbtc")], borrower
    );
    expect(withdraw.result).toBeOk(Cl.uint(10000000));
  });
});

describe("Borrow Lifecycle - STX", () => {
  it("completes full STX borrow-repay cycle", () => {
    // Same flow but with STX collateral and 60% LTV
  });
});
```

### `liquidation-flow.test.ts`

```typescript
describe("Liquidation Flow", () => {
  it("liquidates underwater STX position", () => {
    // 1. Setup: Lender deposits USDCx
    // 2. Borrower deposits STX, borrows at 55% LTV
    // 3. Simulate price drop by updating mock oracle
    // 4. Verify health factor < 1.0
    // 5. Liquidator calls liquidate-stx-position
    // 6. Verify debt reduced, STX seized with 8% bonus
    // 7. Verify lending pool received USDCx repayment
  });

  it("graduated liquidation: partial at HF 0.8-1.0", () => {
    // Verify only up to 50% can be liquidated
  });

  it("graduated liquidation: full at HF < 0.8", () => {
    // Verify 100% can be liquidated
  });
});
```

### `multi-asset-pool.test.ts`

```typescript
describe("Multi-Asset Pool", () => {
  it("tracks separate pool state for USDCx, sBTC, and STX", () => {
    // Deposit into all three pools, verify independent state
  });

  it("handles concurrent lenders across assets", () => {
    // Multiple lenders in different pools
  });

  it("handles multiple borrowers with different collateral types", () => {
    // Borrower A uses sBTC, Borrower B uses STX, both borrow USDCx
  });
});
```

### `oracle-failure.test.ts`

```typescript
describe("Oracle Failure Handling", () => {
  it("blocks new borrows when oracle is stale", () => {
    // Advance blocks past staleness threshold
    // Attempt borrow → ERR-ORACLE-STALE
  });

  it("blocks liquidation with stale oracle", () => {
    // Stale price → liquidation blocked for safety
  });

  it("existing positions unaffected by temporary staleness", () => {
    // No forced liquidation on stale data
  });
});
```

---

## Fuzz Testing

Property-based testing using [fast-check](https://github.com/dubzzz/fast-check) for mathematical invariants.

### `interest-calculation.test.ts`

```typescript
import fc from "fast-check";
import { describe, it } from "vitest";

describe("Interest Calculation Fuzz Tests", () => {
  it("interest is always non-negative", () => {
    fc.assert(
      fc.property(
        fc.nat(1_000_000_000),  // principal (up to 1B USDCx)
        fc.nat(10_000),         // rate in basis points
        fc.nat(52_560),         // blocks elapsed (up to ~1 year)
        (principal, rate, blocks) => {
          const interest = calculateInterest(principal, rate, blocks);
          return interest >= 0;
        }
      )
    );
  });

  it("interest increases monotonically with time", () => {
    fc.assert(
      fc.property(
        fc.nat(1_000_000_000),
        fc.nat(10_000),
        fc.nat(52_560),
        fc.nat(52_560),
        (principal, rate, blocks1, blocks2) => {
          if (blocks1 <= blocks2) {
            return calculateInterest(principal, rate, blocks2) >=
                   calculateInterest(principal, rate, blocks1);
          }
          return true;
        }
      )
    );
  });

  it("zero principal always yields zero interest", () => {
    fc.assert(
      fc.property(
        fc.nat(10_000),
        fc.nat(52_560),
        (rate, blocks) => calculateInterest(0, rate, blocks) === 0
      )
    );
  });
});
```

### `health-factor.test.ts`

```typescript
describe("Health Factor Fuzz Tests", () => {
  it("health factor decreases when price drops", () => {
    fc.assert(
      fc.property(
        fc.nat(1_000_000_000),
        fc.nat(1_000_000_000),
        fc.integer({ min: 1, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (collateral, borrowed, price1, price2) => {
          if (borrowed === 0 || price1 <= 0 || price2 <= 0) return true;
          if (price1 > price2) {
            return healthFactor(collateral, borrowed, price1) >=
                   healthFactor(collateral, borrowed, price2);
          }
          return true;
        }
      )
    );
  });

  it("sBTC health factor is always higher than STX for same USD value", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        (usdValue) => {
          // sBTC LTV threshold: 80%, STX: 70%
          const hfSbtc = healthFactorWithThreshold(usdValue, usdValue * 0.5, 8000);
          const hfStx = healthFactorWithThreshold(usdValue, usdValue * 0.5, 7000);
          return hfSbtc >= hfStx;
        }
      )
    );
  });
});
```

### `liquidation-amounts.test.ts`

```typescript
describe("Liquidation Amount Fuzz Tests", () => {
  it("liquidator always receives more value than repaid debt", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        fc.integer({ min: 100, max: 1000 }),  // bonus 1-10%
        (repayAmount, price, bonus) => {
          const seized = calculateSeizedCollateral(repayAmount, price, bonus);
          return seized * price >= repayAmount;
        }
      )
    );
  });

  it("seized collateral never exceeds total collateral", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }),
        fc.integer({ min: 1, max: 1_000_000_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (totalCollateral, repayAmount, price) => {
          const maxRepay = calculateMaxLiquidation(totalCollateral, repayAmount, price);
          const seized = calculateSeizedCollateral(maxRepay, price, 500);
          return seized <= totalCollateral;
        }
      )
    );
  });
});
```

### `ltv-boundaries.test.ts`

```typescript
describe("LTV Boundary Fuzz Tests", () => {
  it("LTV ratio is always between 0 and 100%", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000 }),
        fc.integer({ min: 1, max: 1_000_000_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (borrowed, collateral, price) => {
          const ltv = calculateLTV(borrowed, collateral, price);
          return ltv >= 0 && ltv <= 10000;
        }
      )
    );
  });

  it("sBTC max LTV is always higher than STX max LTV", () => {
    // Structural invariant: sBTC is lower risk than STX
    const sbtcLtv = 7500;
    const stxLtv = 6000;
    expect(sbtcLtv).toBeGreaterThan(stxLtv);
  });
});
```

---

## Frontend Tests

### Tools
- **Vitest** for unit/component tests
- **React Testing Library** for component rendering
- **MSW (Mock Service Worker)** for mocking Stacks API responses

### Frontend `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
});
```

### Key Frontend Test Files

```typescript
// __tests__/hooks/useBorrowQuote.test.ts
describe("useBorrowQuote hook", () => {
  it("returns quote for STX collateral", () => { });
  it("returns quote for sBTC collateral", () => { });
  it("debounces rapid input changes", () => { });
  it("handles oracle error gracefully", () => { });
});

// __tests__/components/BorrowQuotePreview.test.tsx
describe("BorrowQuotePreview", () => {
  it("shows USDCx amount as user enters collateral", () => { });
  it("shows correct LTV for sBTC vs STX", () => { });
  it("displays price from Pyth oracle", () => { });
  it("shows loading state while fetching quote", () => { });
  it("is responsive on mobile viewport", () => { });
});

// __tests__/components/landing/Hero.test.tsx
describe("Hero section", () => {
  it("renders call-to-action button", () => { });
  it("links to /dashboard", () => { });
  it("is responsive", () => { });
});
```

---

## Test Coverage Requirements

| Area | Minimum | Target |
|------|---------|--------|
| Contract public functions | 100% | 100% |
| Contract read-only functions | 90% | 100% |
| Contract error paths | 80% | 95% |
| Integration flows | All critical paths | All paths |
| Fuzz tests | All math functions | All math |
| Frontend hooks | 80% | 90% |
| Frontend components | 70% | 85% |

---

## Running Tests

### Contract Tests (Clarinet SDK + Vitest)

```bash
# Run all contract tests
npm test

# Run with watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/lending-pool.test.ts

# Run with coverage report
npm run test:coverage

# Generate coverage HTML
npm run test:report
npx genhtml lcov.info --branch-coverage -o coverage
```

### Frontend Tests

```bash
cd frontend

# Run frontend tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Full Suite (CI)

```bash
# Run everything
clarinet check && npm test && cd frontend && npm test
```
