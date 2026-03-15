import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("lending-pool-v2", () => {
  function mintUsdcx(wallet: string, amount: number) {
    simnet.callPublicFn("usdcx", "mint", [Cl.uint(amount), Cl.principal(wallet)], deployer);
  }

  it("deposit STX into pool updates pool-state", () => {
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("stx")], wallet1);
    const stats = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats", [Cl.stringAscii("stx")], deployer);
    expect(stats.result).toBeSome(Cl.tuple({
      "total-deposits": Cl.uint(1000000000),
      "total-borrows": Cl.uint(0),
      "total-reserves": Cl.uint(0),
      "last-update-block": Cl.uint(simnet.blockHeight),
    }));
  });

  it("deposit zero amount fails", () => {
    const res = simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(0), Cl.stringAscii("stx")], wallet1);
    expect(res.result).toBeErr(Cl.uint(1004));
  });

  it("withdraw STX returns correct amount", () => {
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("stx")], wallet1);
    const depositBlock = simnet.blockHeight;
    const res = simnet.callPublicFn("lending-pool-v2", "withdraw", [Cl.uint(500000000), Cl.stringAscii("stx")], wallet1);
    expect(res.result).toBeOk(Cl.uint(500000000));
    const balance = simnet.callReadOnlyFn("lending-pool-v2", "get-lender-balance", [Cl.principal(wallet1), Cl.stringAscii("stx")], deployer);
    expect(balance.result).toBeSome(Cl.tuple({
      amount: Cl.uint(500000000),
      "deposit-block": Cl.uint(depositBlock),
    }));
  });

  it("withdraw more than deposited fails", () => {
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callPublicFn("lending-pool-v2", "withdraw", [Cl.uint(2000000000), Cl.stringAscii("stx")], wallet1);
    expect(res.result).toBeErr(Cl.uint(1005));
  });

  it("withdraw when pool has insufficient liquidity fails", () => {
    mintUsdcx(wallet1, 1000000000);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("usdcx")], wallet1);
    simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(wallet2), Cl.bool(true)], deployer);
    simnet.callPublicFn("lending-pool-v2", "add-borrows", [Cl.uint(800000000), Cl.stringAscii("usdcx")], wallet2);
    const res = simnet.callPublicFn("lending-pool-v2", "withdraw", [Cl.uint(500000000), Cl.stringAscii("usdcx")], wallet1);
    expect(res.result).toBeErr(Cl.uint(1011));
  });

  it("multiple deposits from different lenders tracked correctly", () => {
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("stx")], wallet1);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(2000000000), Cl.stringAscii("stx")], wallet2);
    const stats = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats", [Cl.stringAscii("stx")], deployer);
    expect((stats.result as any).value.value["total-deposits"]).toStrictEqual(Cl.uint(3000000000));
  });

  it("get-utilization-rate returns correct value", () => {
    mintUsdcx(wallet1, 1000000000);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("usdcx")], wallet1);
    simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(wallet2), Cl.bool(true)], deployer);
    simnet.callPublicFn("lending-pool-v2", "add-borrows", [Cl.uint(500000000), Cl.stringAscii("usdcx")], wallet2);
    const res = simnet.callReadOnlyFn("lending-pool-v2", "get-utilization-rate", [Cl.stringAscii("usdcx")], deployer);
    expect(res.result).toBeUint(5000);
  });

  it("get-available-liquidity returns correct value", () => {
    mintUsdcx(wallet1, 1000000000);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("usdcx")], wallet1);
    simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(wallet2), Cl.bool(true)], deployer);
    simnet.callPublicFn("lending-pool-v2", "add-borrows", [Cl.uint(300000000), Cl.stringAscii("usdcx")], wallet2);
    const res = simnet.callReadOnlyFn("lending-pool-v2", "get-available-liquidity", [Cl.stringAscii("usdcx")], deployer);
    expect(res.result).toBeUint(700000000);
  });

  it("only authorized callers can add-borrows", () => {
    mintUsdcx(wallet1, 1000000000);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("usdcx")], wallet1);
    const res = simnet.callPublicFn("lending-pool-v2", "add-borrows", [Cl.uint(100000000), Cl.stringAscii("usdcx")], wallet1);
    expect(res.result).toBeErr(Cl.uint(1000));
  });

  it("only authorized callers can reduce-borrows", () => {
    const res = simnet.callPublicFn("lending-pool-v2", "reduce-borrows", [Cl.uint(100000000), Cl.stringAscii("usdcx")], wallet1);
    expect(res.result).toBeErr(Cl.uint(1000));
  });
});
