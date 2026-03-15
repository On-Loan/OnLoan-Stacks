import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("onloan-core-v2", () => {
  it("is deployed successfully", () => {
    const res = simnet.callReadOnlyFn("onloan-core-v2", "get-owner", [], deployer);
    expect(res.result).toStrictEqual(Cl.principal(deployer));
  });

  it("default sbtc config has 75% LTV", () => {
    const res = simnet.callReadOnlyFn("onloan-core-v2", "get-asset-config", [Cl.stringAscii("sbtc")], deployer);
    expect(res.result).toBeSome(
      Cl.tuple({
        "max-ltv": Cl.uint(7500),
        "liquidation-threshold": Cl.uint(8000),
        "liquidation-bonus": Cl.uint(500),
        "min-collateral": Cl.uint(10000),
        "is-active": Cl.bool(true),
        "is-collateral-enabled": Cl.bool(true),
        "is-borrow-enabled": Cl.bool(false),
      })
    );
  });

  it("default stx config has 60% LTV", () => {
    const res = simnet.callReadOnlyFn("onloan-core-v2", "get-asset-config", [Cl.stringAscii("stx")], deployer);
    expect(res.result).toBeSome(
      Cl.tuple({
        "max-ltv": Cl.uint(6000),
        "liquidation-threshold": Cl.uint(7000),
        "liquidation-bonus": Cl.uint(800),
        "min-collateral": Cl.uint(100000000),
        "is-active": Cl.bool(true),
        "is-collateral-enabled": Cl.bool(true),
        "is-borrow-enabled": Cl.bool(false),
      })
    );
  });

  it("owner can update asset config", () => {
    const res = simnet.callPublicFn("onloan-core-v2", "set-asset-config", [
      Cl.stringAscii("sbtc"),
      Cl.uint(8000),
      Cl.uint(8500),
      Cl.uint(600),
      Cl.uint(5000),
      Cl.bool(true),
      Cl.bool(true),
      Cl.bool(false),
    ], deployer);
    expect(res.result).toBeOk(Cl.bool(true));

    const config = simnet.callReadOnlyFn("onloan-core-v2", "get-asset-config", [Cl.stringAscii("sbtc")], deployer);
    expect(config.result).toBeSome(
      Cl.tuple({
        "max-ltv": Cl.uint(8000),
        "liquidation-threshold": Cl.uint(8500),
        "liquidation-bonus": Cl.uint(600),
        "min-collateral": Cl.uint(5000),
        "is-active": Cl.bool(true),
        "is-collateral-enabled": Cl.bool(true),
        "is-borrow-enabled": Cl.bool(false),
      })
    );
  });

  it("non-owner cannot update asset config", () => {
    const res = simnet.callPublicFn("onloan-core-v2", "set-asset-config", [
      Cl.stringAscii("sbtc"),
      Cl.uint(8000),
      Cl.uint(8500),
      Cl.uint(600),
      Cl.uint(5000),
      Cl.bool(true),
      Cl.bool(true),
      Cl.bool(false),
    ], wallet1);
    expect(res.result).toBeErr(Cl.uint(1000));
  });

  it("owner can pause protocol", () => {
    const res = simnet.callPublicFn("onloan-core-v2", "set-protocol-paused", [Cl.bool(true)], deployer);
    expect(res.result).toBeOk(Cl.bool(true));
    const paused = simnet.callReadOnlyFn("onloan-core-v2", "is-paused", [], deployer);
    expect(paused.result).toBeBool(true);
  });

  it("owner can unpause protocol", () => {
    simnet.callPublicFn("onloan-core-v2", "set-protocol-paused", [Cl.bool(true)], deployer);
    const res = simnet.callPublicFn("onloan-core-v2", "set-protocol-paused", [Cl.bool(false)], deployer);
    expect(res.result).toBeOk(Cl.bool(true));
    const paused = simnet.callReadOnlyFn("onloan-core-v2", "is-paused", [], deployer);
    expect(paused.result).toBeBool(false);
  });

  it("non-owner cannot pause", () => {
    const res = simnet.callPublicFn("onloan-core-v2", "set-protocol-paused", [Cl.bool(true)], wallet1);
    expect(res.result).toBeErr(Cl.uint(1000));
  });

  it("owner can transfer ownership", () => {
    const res = simnet.callPublicFn("onloan-core-v2", "transfer-ownership", [Cl.principal(wallet1)], deployer);
    expect(res.result).toBeOk(Cl.bool(true));
    const owner = simnet.callReadOnlyFn("onloan-core-v2", "get-owner", [], deployer);
    expect(owner.result).toStrictEqual(Cl.principal(wallet1));
  });

  it("new owner can perform owner actions", () => {
    simnet.callPublicFn("onloan-core-v2", "transfer-ownership", [Cl.principal(wallet1)], deployer);
    const res = simnet.callPublicFn("onloan-core-v2", "set-protocol-paused", [Cl.bool(true)], wallet1);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("calculate-interest-rate at 0% utilization returns base rate", () => {
    const res = simnet.callReadOnlyFn("onloan-core-v2", "calculate-interest-rate", [Cl.uint(0)], deployer);
    expect(res.result).toBeUint(200);
  });

  it("calculate-interest-rate at 50% utilization", () => {
    const res = simnet.callReadOnlyFn("onloan-core-v2", "calculate-interest-rate", [Cl.uint(5000)], deployer);
    const expected = 200 + Math.floor((5000 * 400) / 8000);
    expect(res.result).toBeUint(expected);
  });

  it("calculate-interest-rate at 80% utilization (optimal)", () => {
    const res = simnet.callReadOnlyFn("onloan-core-v2", "calculate-interest-rate", [Cl.uint(8000)], deployer);
    const expected = 200 + Math.floor((8000 * 400) / 8000);
    expect(res.result).toBeUint(expected);
  });

  it("calculate-interest-rate at 95% utilization (above optimal)", () => {
    const res = simnet.callReadOnlyFn("onloan-core-v2", "calculate-interest-rate", [Cl.uint(9500)], deployer);
    const expected = 200 + 400 + Math.floor(((9500 - 8000) * 7500) / (10000 - 8000));
    expect(res.result).toBeUint(expected);
  });

  it("owner can set interest rate parameters", () => {
    const res = simnet.callPublicFn("onloan-core-v2", "set-base-interest-rate", [Cl.uint(300)], deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("invalid base rate > 10000 is rejected", () => {
    const res = simnet.callPublicFn("onloan-core-v2", "set-base-interest-rate", [Cl.uint(10001)], deployer);
    expect(res.result).toBeErr(Cl.uint(1003));
  });

  it("invalid optimal utilization > 10000 is rejected", () => {
    const res = simnet.callPublicFn("onloan-core-v2", "set-optimal-utilization", [Cl.uint(10001)], deployer);
    expect(res.result).toBeErr(Cl.uint(1003));
  });

  it("owner can set authorized caller", () => {
    simnet.callPublicFn("onloan-core-v2", "set-authorized-caller", [Cl.principal(wallet1), Cl.bool(true)], deployer);
    const res = simnet.callReadOnlyFn("onloan-core-v2", "is-authorized", [Cl.principal(wallet1)], deployer);
    expect(res.result).toBeBool(true);
  });

  it("unauthorized principal returns false", () => {
    const res = simnet.callReadOnlyFn("onloan-core-v2", "is-authorized", [Cl.principal(wallet2)], deployer);
    expect(res.result).toBeBool(false);
  });
});
