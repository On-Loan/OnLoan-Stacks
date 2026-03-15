import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

function setup() {
  simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
    Cl.stringAscii("stx"), Cl.uint(85000000), Cl.uint(1000), Cl.uint(1700000000),
  ], deployer);
  const cmAddr = `${deployer}.collateral-manager-v2`;
  simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(cmAddr), Cl.bool(true)], deployer);
  const leAddr = `${deployer}.liquidation-engine-v2`;
  simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(leAddr), Cl.bool(true)], deployer);
  simnet.callPublicFn("usdcx", "mint", [Cl.uint(10000000000), Cl.principal(wallet2)], deployer);
  simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(10000000000), Cl.stringAscii("usdcx")], wallet2);
}

describe("collateral-manager-v2", () => {
  beforeEach(() => { setup(); });

  it("deposit zero amount fails", () => {
    const res = simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(0)], wallet1);
    expect(res.result).toBeErr(Cl.uint(1004));
  });

  it("deposit below minimum collateral fails", () => {
    const res = simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(50000000)], wallet1);
    expect(res.result).toBeErr(Cl.uint(1006));
  });

  it("deposit STX collateral succeeds", () => {
    const res = simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    expect(res.result).toBeOk(Cl.uint(10000000000));
  });

  it("get-position returns correct data after deposit", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    const res = simnet.callReadOnlyFn("collateral-manager-v2", "get-position", [
      Cl.principal(wallet1), Cl.stringAscii("stx"),
    ], deployer);
    const position = (res.result as any).value.value;
    expect(position["collateral-amount"]).toStrictEqual(Cl.uint(10000000000));
    expect(position["borrowed-amount"]).toStrictEqual(Cl.uint(0));
    expect(position["is-active"]).toStrictEqual(Cl.bool(true));
  });

  it("get-health-factor without borrows returns max", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    const res = simnet.callReadOnlyFn("collateral-manager-v2", "get-health-factor", [
      Cl.principal(wallet1), Cl.stringAscii("stx"),
    ], deployer);
    expect(res.result).toBeOk(Cl.uint(99999));
  });

  it("get-borrow-quote returns correct values", () => {
    const res = simnet.callReadOnlyFn("collateral-manager-v2", "get-borrow-quote", [
      Cl.stringAscii("stx"), Cl.uint(10000000000),
    ], deployer);
    expect(res.result).toBeOk(Cl.tuple({
      "collateral-value-usd": Cl.uint(8500000000),
      "max-borrowable-usdcx": Cl.uint(5100000000),
      "current-ltv": Cl.uint(6000),
      "health-factor": Cl.uint(10000),
      "oracle-price": Cl.uint(85000000),
      "asset-ltv-limit": Cl.uint(6000),
    }));
  });

  it("borrow within LTV succeeds", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    const res = simnet.callPublicFn("collateral-manager-v2", "borrow", [
      Cl.uint(400000), Cl.stringAscii("stx"),
    ], wallet1);
    expect(res.result).toBeOk(Cl.uint(400000));
  });

  it("borrow exceeding LTV fails", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    const res = simnet.callPublicFn("collateral-manager-v2", "borrow", [
      Cl.uint(5100000001), Cl.stringAscii("stx"),
    ], wallet1);
    expect(res.result).toBeErr(Cl.uint(1007));
  });

  it("get-health-factor with borrows returns correct value", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(400000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callReadOnlyFn("collateral-manager-v2", "get-health-factor", [
      Cl.principal(wallet1), Cl.stringAscii("stx"),
    ], deployer);
    expect(res.result).toBeOk(Cl.uint(14875));
  });

  it("get-ltv-ratio returns correct value after borrow", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(400000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callReadOnlyFn("collateral-manager-v2", "get-ltv-ratio", [
      Cl.principal(wallet1), Cl.stringAscii("stx"),
    ], deployer);
    expect(res.result).toBeOk(Cl.uint(0));
  });

  it("withdraw making position unhealthy fails", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(400000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callPublicFn("collateral-manager-v2", "withdraw-collateral", [
      Cl.uint(9500000000), Cl.stringAscii("stx"),
    ], wallet1);
    expect(res.result).toBeErr(Cl.uint(1007));
  });

  it("repay full borrowed amount succeeds", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(400000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callPublicFn("collateral-manager-v2", "repay", [
      Cl.uint(400000), Cl.stringAscii("stx"),
    ], wallet1);
    expect(res.result).toBeOk(Cl.uint(400000));
  });

  it("withdraw after full repay succeeds", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(400000), Cl.stringAscii("stx")], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "repay", [Cl.uint(400000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callPublicFn("collateral-manager-v2", "withdraw-collateral", [
      Cl.uint(10000000000), Cl.stringAscii("stx"),
    ], wallet1);
    expect(res.result).toBeOk(Cl.uint(10000000000));
  });

  it("protocol pause blocks deposit", () => {
    simnet.callPublicFn("onloan-core-v2", "set-protocol-paused", [Cl.bool(true)], deployer);
    const res = simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(100000000)], wallet2);
    expect(res.result).toBeErr(Cl.uint(1001));
  });
});
