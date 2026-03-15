import { describe, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import * as fc from "fast-check";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("fuzz: health-factor", () => {
  beforeEach(() => {
    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"), Cl.uint(85000000), Cl.uint(1000), Cl.uint(1700000000),
    ], deployer);
  });

  it("borrow quote collateral value increases with amount", () => {
    fc.assert(fc.property(
      fc.integer({ min: 100000000, max: 10000000000 }),
      fc.integer({ min: 100000000, max: 10000000000 }),
      (a, b) => {
        if (a >= b) return true;
        const r1 = simnet.callReadOnlyFn("collateral-manager-v2", "get-borrow-quote",
          [Cl.stringAscii("stx"), Cl.uint(a)], deployer);
        const r2 = simnet.callReadOnlyFn("collateral-manager-v2", "get-borrow-quote",
          [Cl.stringAscii("stx"), Cl.uint(b)], deployer);
        const v1 = Number((r1.result as any).value.value["collateral-value-usd"].value);
        const v2 = Number((r2.result as any).value.value["collateral-value-usd"].value);
        return v2 >= v1;
      }
    ), { numRuns: 50 });
  });

  it("max borrowable is proportional to collateral value", () => {
    fc.assert(fc.property(
      fc.integer({ min: 100000000, max: 10000000000 }),
      (amount) => {
        const res = simnet.callReadOnlyFn("collateral-manager-v2", "get-borrow-quote",
          [Cl.stringAscii("stx"), Cl.uint(amount)], deployer);
        const collateralValue = Number((res.result as any).value.value["collateral-value-usd"].value);
        const maxBorrow = Number((res.result as any).value.value["max-borrowable-usdcx"].value);
        const expectedMax = Math.floor(collateralValue * 6000 / 10000);
        return maxBorrow === expectedMax;
      }
    ), { numRuns: 50 });
  });

  it("oracle price is consistent in borrow quote", () => {
    fc.assert(fc.property(
      fc.integer({ min: 100000000, max: 10000000000 }),
      (amount) => {
        const res = simnet.callReadOnlyFn("collateral-manager-v2", "get-borrow-quote",
          [Cl.stringAscii("stx"), Cl.uint(amount)], deployer);
        const price = Number((res.result as any).value.value["oracle-price"].value);
        return price === 85000000;
      }
    ), { numRuns: 50 });
  });
});
