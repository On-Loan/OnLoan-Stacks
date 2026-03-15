import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("integration: multi-asset-pool", () => {
  function mintUsdcx(wallet: string, amount: number) {
    simnet.callPublicFn("usdcx", "mint", [Cl.uint(amount), Cl.principal(wallet)], deployer);
  }

  it("multiple deposits aggregate correctly", () => {
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("stx")], wallet1);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(2000000000), Cl.stringAscii("stx")], wallet2);

    const stats = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats",
      [Cl.stringAscii("stx")], deployer);
    expect((stats.result as any).value.value["total-deposits"]).toStrictEqual(Cl.uint(3000000000));
  });

  it("separate pools are independent", () => {
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("stx")], wallet1);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(2000000000), Cl.stringAscii("stx")], wallet2);
    mintUsdcx(wallet1, 5000000000);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(5000000000), Cl.stringAscii("usdcx")], wallet1);

    const stxStats = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats",
      [Cl.stringAscii("stx")], deployer);
    const usdcxStats = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats",
      [Cl.stringAscii("usdcx")], deployer);

    expect((stxStats.result as any).value.value["total-deposits"]).toStrictEqual(Cl.uint(3000000000));
    expect((usdcxStats.result as any).value.value["total-deposits"]).toStrictEqual(Cl.uint(5000000000));
  });

  it("withdrawal reduces pool correctly", () => {
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("stx")], wallet1);
    simnet.callPublicFn("lending-pool-v2", "withdraw", [Cl.uint(500000000), Cl.stringAscii("stx")], wallet1);

    const stats = simnet.callReadOnlyFn("lending-pool-v2", "get-pool-stats",
      [Cl.stringAscii("stx")], deployer);
    expect((stats.result as any).value.value["total-deposits"]).toStrictEqual(Cl.uint(500000000));
  });

  it("lender balances tracked per wallet and asset", () => {
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(1000000000), Cl.stringAscii("stx")], wallet1);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(2000000000), Cl.stringAscii("stx")], wallet2);
    mintUsdcx(wallet1, 5000000000);
    simnet.callPublicFn("lending-pool-v2", "deposit", [Cl.uint(5000000000), Cl.stringAscii("usdcx")], wallet1);
    simnet.callPublicFn("lending-pool-v2", "withdraw", [Cl.uint(500000000), Cl.stringAscii("stx")], wallet1);

    const b1stx = simnet.callReadOnlyFn("lending-pool-v2", "get-lender-balance",
      [Cl.principal(wallet1), Cl.stringAscii("stx")], deployer);
    expect((b1stx.result as any).value.value.amount).toStrictEqual(Cl.uint(500000000));

    const b2stx = simnet.callReadOnlyFn("lending-pool-v2", "get-lender-balance",
      [Cl.principal(wallet2), Cl.stringAscii("stx")], deployer);
    expect((b2stx.result as any).value.value.amount).toStrictEqual(Cl.uint(2000000000));

    const b1usdcx = simnet.callReadOnlyFn("lending-pool-v2", "get-lender-balance",
      [Cl.principal(wallet1), Cl.stringAscii("usdcx")], deployer);
    expect((b1usdcx.result as any).value.value.amount).toStrictEqual(Cl.uint(5000000000));
  });
});
