/**
 * Check USDCx balance on Stacks testnet + USDC balance on Sepolia
 *
 * Usage: npm run check
 */
import "dotenv/config";
import {
  createPublicClient,
  http,
  formatUnits,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const config = {
  ETH_RPC_URL: process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com",
  PRIVATE_KEY: process.env.ETHEREUM_PRIVATE_KEY as Hex,
  ETH_USDC_CONTRACT: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Hex,
  STACKS_RECIPIENT:
    process.env.STACKS_RECIPIENT || "ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV",
};

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

async function check() {
  console.log("=== Balance Check ===\n");

  // Ethereum side
  if (config.PRIVATE_KEY) {
    const account = privateKeyToAccount(config.PRIVATE_KEY);
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(config.ETH_RPC_URL),
    });

    const ethBalance = await publicClient.getBalance({
      address: account.address,
    });
    const usdcBalance = (await publicClient.readContract({
      address: config.ETH_USDC_CONTRACT,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    })) as bigint;

    console.log(`Ethereum wallet: ${account.address}`);
    console.log(`  ETH:  ${formatUnits(ethBalance, 18)} ETH`);
    console.log(`  USDC: ${formatUnits(usdcBalance, 6)} USDC`);
  }

  // Stacks side — check USDCx via Hiro API
  console.log(`\nStacks wallet: ${config.STACKS_RECIPIENT}`);

  const usdcxContract =
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx";
  const url = `https://api.testnet.hiro.so/extended/v1/address/${config.STACKS_RECIPIENT}/balances`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as {
      stx: { balance: string };
      fungible_tokens: Record<string, { balance: string }>;
    };

    console.log(
      `  STX:   ${(Number(data.stx.balance) / 1e6).toFixed(6)} STX`
    );

    const usdcxKey = Object.keys(data.fungible_tokens).find((k) =>
      k.includes("usdcx")
    );
    if (usdcxKey) {
      const usdcxBal = data.fungible_tokens[usdcxKey].balance;
      console.log(`  USDCx: ${(Number(usdcxBal) / 1e6).toFixed(6)} USDCx`);
    } else {
      console.log("  USDCx: 0.000000 USDCx (no token balance found)");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  (Could not fetch Stacks balances: ${msg})`);
  }
}

check().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
