import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;

function setup() {
  simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
    Cl.stringAscii("stx"), Cl.uint(85000000), Cl.uint(1000), Cl.uint(1700000000),
  ], deployer);
  const cmAddr = `${deployer}.collateral-manager-v2`;
  simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(cmAddr), Cl.bool(true)], deployer);
  const leAddr = `${deployer}.liquidation-engine-v2`;
  simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(leAddr), Cl.bool(true)], deployer);
  simnet.callPublicFn("usdcx", "mint", [Cl.uint(10000000000), Cl.principal(deployer)], deployer);
  simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(10000000000), Cl.stringAscii("usdcx")], deployer);
  simnet.callPublicFn("usdcx", "mint", [Cl.uint(10000000000), Cl.principal(wallet4)], deployer);
}

describe("liquidation-engine-v2", () => {
  beforeEach(() => { setup(); });

  it("cannot liquidate healthy position", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet3);
    const res = simnet.callPublicFn("liquidation-engine-v2", "liquidate-stx-position", [
      Cl.principal(wallet3), Cl.uint(100),
    ], wallet4);
    expect(res.result).toBeErr(Cl.uint(1008));
  });

  it("is-liquidatable returns true for unhealthy position", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(700000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callReadOnlyFn("liquidation-engine-v2", "is-liquidatable", [
      Cl.principal(wallet1), Cl.stringAscii("stx"),
    ], deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("is-liquidatable returns false for healthy position", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet3);
    const res = simnet.callReadOnlyFn("liquidation-engine-v2", "is-liquidatable", [
      Cl.principal(wallet3), Cl.stringAscii("stx"),
    ], deployer);
    expect(res.result).toBeOk(Cl.bool(false));
  });

  it("get-max-liquidatable for partial tier position", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(700000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callReadOnlyFn("liquidation-engine-v2", "get-max-liquidatable", [
      Cl.principal(wallet1), Cl.stringAscii("stx"),
    ], deployer);
    expect(res.result).toBeOk(Cl.uint(350000));
  });

  it("get-max-liquidatable for full tier position", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet2);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(800000), Cl.stringAscii("stx")], wallet2);
    const res = simnet.callReadOnlyFn("liquidation-engine-v2", "get-max-liquidatable", [
      Cl.principal(wallet2), Cl.stringAscii("stx"),
    ], deployer);
    expect(res.result).toBeOk(Cl.uint(800000));
  });

  it("get-max-liquidatable for healthy position returns zero", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet3);
    const res = simnet.callReadOnlyFn("liquidation-engine-v2", "get-max-liquidatable", [
      Cl.principal(wallet3), Cl.stringAscii("stx"),
    ], deployer);
    expect(res.result).toBeOk(Cl.uint(0));
  });

  it("get-liquidation-quote returns correct values", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(700000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callReadOnlyFn("liquidation-engine-v2", "get-liquidation-quote", [
      Cl.principal(wallet1), Cl.stringAscii("stx"), Cl.uint(200000),
    ], deployer);
    expect(res.result).toBeOk(Cl.tuple({
      "seized-collateral": Cl.uint(254117),
      "liquidator-bonus": Cl.uint(16000),
      "repaid-debt": Cl.uint(200000),
    }));
  });

  it("exceeding max-liquidatable fails", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(700000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callPublicFn("liquidation-engine-v2", "liquidate-stx-position", [
      Cl.principal(wallet1), Cl.uint(400000),
    ], wallet4);
    expect(res.result).toBeErr(Cl.uint(1007));
  });

  it("partial liquidation succeeds", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(700000), Cl.stringAscii("stx")], wallet1);
    const res = simnet.callPublicFn("liquidation-engine-v2", "liquidate-stx-position", [
      Cl.principal(wallet1), Cl.uint(200000),
    ], wallet4);
    expect(res.result).toBeOk(Cl.tuple({
      "seized-collateral": Cl.uint(254117),
      "repaid-debt": Cl.uint(200000),
    }));
  });

  it("full liquidation succeeds", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet2);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(800000), Cl.stringAscii("stx")], wallet2);
    const res = simnet.callPublicFn("liquidation-engine-v2", "liquidate-stx-position", [
      Cl.principal(wallet2), Cl.uint(800000),
    ], wallet4);
    expect(res.result).toBeOk(Cl.tuple({
      "seized-collateral": Cl.uint(1016470),
      "repaid-debt": Cl.uint(800000),
    }));
  });

  it("protocol pause blocks liquidation", () => {
    simnet.callPublicFn("collateral-manager-v2", "deposit-collateral-stx", [Cl.uint(10000000000)], wallet1);
    simnet.callPublicFn("collateral-manager-v2", "borrow", [Cl.uint(700000), Cl.stringAscii("stx")], wallet1);
    simnet.callPublicFn("onloan-core-v2", "set-protocol-paused", [Cl.bool(true)], deployer);
    const res = simnet.callPublicFn("liquidation-engine-v2", "liquidate-stx-position", [
      Cl.principal(wallet1), Cl.uint(100000),
    ], wallet4);
    expect(res.result).toBeErr(Cl.uint(1001));
  });
});
