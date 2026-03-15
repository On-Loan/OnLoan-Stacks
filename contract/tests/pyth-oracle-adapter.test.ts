import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("pyth-oracle-adapter-v2", () => {
  it("price updater can submit price", () => {
    const res = simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"),
      Cl.uint(85000000),
      Cl.uint(1000),
      Cl.uint(1700000000),
    ], deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("non-updater cannot submit price", () => {
    const res = simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"),
      Cl.uint(85000000),
      Cl.uint(1000),
      Cl.uint(1700000000),
    ], wallet1);
    expect(res.result).toBeErr(Cl.uint(1000));
  });

  it("get-price returns stored price when fresh", () => {
    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"),
      Cl.uint(85000000),
      Cl.uint(1000),
      Cl.uint(1700000000),
    ], deployer);

    const res = simnet.callReadOnlyFn("pyth-oracle-adapter-v2", "get-price", [Cl.stringAscii("stx")], deployer);
    expect(res.result).toBeOk(
      Cl.tuple({
        price: Cl.uint(85000000),
        confidence: Cl.uint(1000),
        timestamp: Cl.uint(1700000000),
      })
    );
  });

  it("get-price returns error when no price exists", () => {
    const res = simnet.callReadOnlyFn("pyth-oracle-adapter-v2", "get-price", [Cl.stringAscii("unknown")], deployer);
    expect(res.result).toBeErr(Cl.uint(1002));
  });

  it("get-price returns ERR-ORACLE-STALE when price is old", () => {
    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"),
      Cl.uint(85000000),
      Cl.uint(1000),
      Cl.uint(1700000000),
    ], deployer);

    simnet.mineEmptyBlocks(601);

    const res = simnet.callReadOnlyFn("pyth-oracle-adapter-v2", "get-price", [Cl.stringAscii("stx")], deployer);
    expect(res.result).toBeErr(Cl.uint(1009));
  });

  it("is-price-valid returns true for fresh valid price", () => {
    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"),
      Cl.uint(85000000),
      Cl.uint(1000),
      Cl.uint(1700000000),
    ], deployer);

    const res = simnet.callReadOnlyFn("pyth-oracle-adapter-v2", "is-price-valid", [Cl.stringAscii("stx")], deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("is-price-valid returns false for stale price", () => {
    simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"),
      Cl.uint(85000000),
      Cl.uint(1000),
      Cl.uint(1700000000),
    ], deployer);

    simnet.mineEmptyBlocks(601);

    const res = simnet.callReadOnlyFn("pyth-oracle-adapter-v2", "is-price-valid", [Cl.stringAscii("stx")], deployer);
    expect(res.result).toBeOk(Cl.bool(false));
  });

  it("owner can change price updater", () => {
    const res = simnet.callPublicFn("pyth-oracle-adapter-v2", "set-price-updater", [Cl.principal(wallet1)], deployer);
    expect(res.result).toBeOk(Cl.bool(true));

    const priceRes = simnet.callPublicFn("pyth-oracle-adapter-v2", "update-price", [
      Cl.stringAscii("stx"),
      Cl.uint(90000000),
      Cl.uint(500),
      Cl.uint(1700000001),
    ], wallet1);
    expect(priceRes.result).toBeOk(Cl.bool(true));
  });
});
