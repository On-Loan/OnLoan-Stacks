import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const borrower = accounts.get("wallet_1")!;
const lender = accounts.get("wallet_2")!;
const liquidator = accounts.get("wallet_3")!;

describe("integration: liquidation-flow", () => {
  beforeEach(() => {
    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"), Cl.uint(85000000), Cl.uint(1000), Cl.uint(1700000000),
    ], deployer);
    const cmAddr = `${deployer}.collateral-manager-v2`;
    simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(cmAddr), Cl.bool(true)], deployer);
    const leAddr = `${deployer}.liquidation-engine-v2`;
    simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(leAddr), Cl.bool(true)], deployer);
    simnet.callPublicFn("usdcx", "mint", [Cl.uint(10000000000), Cl.principal(lender)], deployer);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(10000000000), Cl.stringAscii("usdcx")], lender);
  });

  it("price drop triggers liquidation eligibility", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx",
      [Cl.uint(10000000000)], borrower);
    simnet.callPublicFn("collateral-manager-v2", "borrow",
      [Cl.uint(400000), Cl.stringAscii("stx")], borrower);

    const healthBefore = simnet.callReadOnlyFn("collateral-manager-v2", "get-health-factor",
      [Cl.principal(borrower), Cl.stringAscii("stx")], deployer);
    expect(healthBefore.result).toBeOk(Cl.uint(14875));

    const liqBefore = simnet.callReadOnlyFn("liquidation-engine-v2", "is-liquidatable",
      [Cl.principal(borrower), Cl.stringAscii("stx")], deployer);
    expect(liqBefore.result).toBeOk(Cl.bool(false));

    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"), Cl.uint(40000000), Cl.uint(1000), Cl.uint(1700000001),
    ], deployer);

    const healthAfter = simnet.callReadOnlyFn("collateral-manager-v2", "get-health-factor",
      [Cl.principal(borrower), Cl.stringAscii("stx")], deployer);
    expect(healthAfter.result).toBeOk(Cl.uint(7000));

    const liqAfter = simnet.callReadOnlyFn("liquidation-engine-v2", "is-liquidatable",
      [Cl.principal(borrower), Cl.stringAscii("stx")], deployer);
    expect(liqAfter.result).toBeOk(Cl.bool(true));
  });

  it("liquidator seizes collateral and debt is cleared", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx",
      [Cl.uint(10000000000)], borrower);
    simnet.callPublicFn("collateral-manager-v2", "borrow",
      [Cl.uint(400000), Cl.stringAscii("stx")], borrower);
    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"), Cl.uint(40000000), Cl.uint(1000), Cl.uint(1700000001),
    ], deployer);

    const maxLiq = simnet.callReadOnlyFn("liquidation-engine-v2", "get-max-liquidatable",
      [Cl.principal(borrower), Cl.stringAscii("stx")], deployer);
    expect(maxLiq.result).toBeOk(Cl.uint(400000));

    simnet.callPublicFn("usdcx", "mint", [Cl.uint(400000), Cl.principal(liquidator)], deployer);
    const res = simnet.callPublicFn("liquidation-engine-v2", "liquidate-stx-position",
      [Cl.principal(borrower), Cl.uint(400000)], liquidator);
    expect(res.result).toBeOk(Cl.tuple({
      "seized-collateral": Cl.uint(1080000),
      "repaid-debt": Cl.uint(400000),
    }));

    const posAfter = simnet.callReadOnlyFn("collateral-manager-v2", "get-position",
      [Cl.principal(borrower), Cl.stringAscii("stx")], deployer);
    expect((posAfter.result as any).value.value["borrowed-amount"]).toStrictEqual(Cl.uint(0));
    expect((posAfter.result as any).value.value["collateral-amount"]).toStrictEqual(Cl.uint(9998920000));

    const poolStats = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats",
      [Cl.stringAscii("usdcx")], deployer);
    expect((poolStats.result as any).value.value["total-borrows"]).toStrictEqual(Cl.uint(0));
  });
});
