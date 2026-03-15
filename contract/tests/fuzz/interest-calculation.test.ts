import { describe, it } from "vitest";
import { Cl } from "@stacks/transactions";
import * as fc from "fast-check";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("fuzz: interest-calculation", () => {
  it("rate is always >= base rate", () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 10000 }),
      (utilization) => {
        const res = simnet.callReadOnlyFn("onloan-core-v2", "calculate-interest-rate",
          [Cl.uint(utilization)], deployer);
        return Number((res.result as any).value) >= 200;
      }
    ), { numRuns: 100 });
  });

  it("rate monotonically increases with utilization", () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 9999 }),
      (util) => {
        const r1 = simnet.callReadOnlyFn("onloan-core-v2", "calculate-interest-rate",
          [Cl.uint(util)], deployer);
        const r2 = simnet.callReadOnlyFn("onloan-core-v2", "calculate-interest-rate",
          [Cl.uint(util + 1)], deployer);
        return Number((r2.result as any).value) >= Number((r1.result as any).value);
      }
    ), { numRuns: 100 });
  });

  it("rate is bounded by max possible", () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 10000 }),
      (utilization) => {
        const res = simnet.callReadOnlyFn("onloan-core-v2", "calculate-interest-rate",
          [Cl.uint(utilization)], deployer);
        return Number((res.result as any).value) <= 8100;
      }
    ), { numRuns: 100 });
  });
});
