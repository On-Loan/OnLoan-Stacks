import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("${contract}", () => {
  it("initializes simnet", () => {
    expect(simnet.blockHeight).toBeDefined();
  });
});
