import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("integration: borrow-lifecycle", () => {
  beforeEach(() => {
    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"), Cl.uint(85000000), Cl.uint(1000), Cl.uint(1700000000),
    ], deployer);
    const cmAddr = `${deployer}.collateral-manager-v2`;
    simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(cmAddr), Cl.bool(true)], deployer);
    const leAddr = `${deployer}.liquidation-engine-v2`;
    simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(leAddr), Cl.bool(true)], deployer);
    simnet.callPublicFn("usdcx", "mint", [Cl.uint(10000000000), Cl.principal(wallet2)], deployer);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(10000000000), Cl.stringAscii("usdcx")], wallet2);
  });

  it("complete lifecycle: deposit, borrow, repay, withdraw", () => {
    const depositRes = simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx",
      [Cl.uint(10000000000)], wallet1);
    expect(depositRes.result).toBeOk(Cl.uint(10000000000));

    const pos1 = simnet.callReadOnlyFn("collateral-manager-v2", "get-position",
      [Cl.principal(wallet1), Cl.stringAscii("stx")], deployer);
    expect((pos1.result as any).value.value["collateral-amount"]).toStrictEqual(Cl.uint(10000000000));
    expect((pos1.result as any).value.value["borrowed-amount"]).toStrictEqual(Cl.uint(0));

    const borrowRes = simnet.callPublicFn("collateral-manager-v2", "borrow",
      [Cl.uint(400000), Cl.stringAscii("stx")], wallet1);
    expect(borrowRes.result).toBeOk(Cl.uint(400000));

    const pos2 = simnet.callReadOnlyFn("collateral-manager-v2", "get-position",
      [Cl.principal(wallet1), Cl.stringAscii("stx")], deployer);
    expect((pos2.result as any).value.value["borrowed-amount"]).toStrictEqual(Cl.uint(400000));

    const poolStats = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats",
      [Cl.stringAscii("usdcx")], deployer);
    expect((poolStats.result as any).value.value["total-borrows"]).toStrictEqual(Cl.uint(400000));

    const repayRes = simnet.callPublicFn("collateral-manager-v2", "repay",
      [Cl.uint(400000), Cl.stringAscii("stx")], wallet1);
    expect(repayRes.result).toBeOk(Cl.uint(400000));

    const pos3 = simnet.callReadOnlyFn("collateral-manager-v2", "get-position",
      [Cl.principal(wallet1), Cl.stringAscii("stx")], deployer);
    expect((pos3.result as any).value.value["borrowed-amount"]).toStrictEqual(Cl.uint(0));

    const withdrawRes = simnet.callPublicFn("collateral-manager-v2", "withdraw-collateral",
      [Cl.uint(10000000000), Cl.stringAscii("stx")], wallet1);
    expect(withdrawRes.result).toBeOk(Cl.uint(10000000000));

    const pos4 = simnet.callReadOnlyFn("collateral-manager-v2", "get-position",
      [Cl.principal(wallet1), Cl.stringAscii("stx")], deployer);
    expect((pos4.result as any).value.value["collateral-amount"]).toStrictEqual(Cl.uint(0));
    expect((pos4.result as any).value.value["is-active"]).toStrictEqual(Cl.bool(false));
  });

  it("pool stats reflect borrows and repays correctly", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx",
      [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow",
      [Cl.uint(2000000000), Cl.stringAscii("stx")], wallet1);

    const stats1 = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats",
      [Cl.stringAscii("usdcx")], deployer);
    expect((stats1.result as any).value.value["total-borrows"]).toStrictEqual(Cl.uint(2000000000));

    const util = simnet.callReadOnlyFn("lending-pool-v2", "get-utilization-rate",
      [Cl.stringAscii("usdcx")], deployer);
    const utilVal = Number((util.result as any).value);
    expect(utilVal).toBeGreaterThan(0);

    simnet.callPublicFn("collateral-manager-v2", "repay",
      [Cl.uint(2000000000), Cl.stringAscii("stx")], wallet1);

    const stats2 = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats",
      [Cl.stringAscii("usdcx")], deployer);
    expect((stats2.result as any).value.value["total-borrows"]).toStrictEqual(Cl.uint(0));
  });
});
