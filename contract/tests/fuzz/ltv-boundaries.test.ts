import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import * as fc from "fast-check";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("fuzz: ltv-boundaries", () => {
  beforeEach(() => {
    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"), Cl.uint(85000000), Cl.uint(1000), Cl.uint(1700000000),
    ], deployer);
    const cmAddr = `${deployer}.collateral-manager-v2`;
    simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(cmAddr), Cl.bool(true)], deployer);
    simnet.callPublicFn("usdcx", "mint", [Cl.uint(100000000000), Cl.principal(deployer)], deployer);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(100000000000), Cl.stringAscii("usdcx")], deployer);
  });

  it("borrow at exactly max LTV succeeds", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx",
      [Cl.uint(10000000000)], wallet1);
    const res = simnet.callPublicFn("collateral-manager-v2", "borrow",
      [Cl.uint(5100000000), Cl.stringAscii("stx")], wallet1);
    expect(res.result).toBeOk(Cl.uint(5100000000));
  });

  it("borrow at max+1 fails", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx",
      [Cl.uint(10000000000)], wallet1);
    const res = simnet.callPublicFn("collateral-manager-v2", "borrow",
      [Cl.uint(5100000001), Cl.stringAscii("stx")], wallet1);
    expect(res.result).toBeErr(Cl.uint(1007));
  });

  it("LTV limit is consistent for any collateral amount", () => {
    fc.assert(fc.property(
      fc.integer({ min: 100000000, max: 10000000000 }),
      (collateral) => {
        const quote = simnet.callReadOnlyFn("collateral-manager-v2", "get-borrow-quote",
          [Cl.stringAscii("stx"), Cl.uint(collateral)], deployer);
        const ltv = Number((quote.result as any).value.value["current-ltv"].value);
        return ltv === 6000;
      }
    ), { numRuns: 50 });
  });
});
