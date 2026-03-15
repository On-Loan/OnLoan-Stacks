/**
 * Bridge USDC from Ethereum Sepolia → Stacks Testnet (USDCx)
 *
 * Steps:
 *  1. Check ETH + USDC balances on Sepolia
 *  2. Approve xReserve to spend USDC
 *  3. Call depositToRemote → triggers Stacks attestation service
 *  4. ~15 min later, USDCx is minted to your Stacks address
 *
 * Usage: npm run deposit
 */
import "dotenv/config";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { stacksAddressToBytes32 } from "./helpers.js";

// ============ Configuration ============
const config = {
  ETH_RPC_URL: process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com",
  PRIVATE_KEY: process.env.ETHEREUM_PRIVATE_KEY as Hex,

  // Sepolia contract addresses (Circle testnet)
  X_RESERVE_CONTRACT: "0x008888878f94C0d87defdf0B07f46B93C1934442" as Hex,
  ETH_USDC_CONTRACT: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Hex,

  // Stacks parameters
  STACKS_DOMAIN: 10003,
  STACKS_RECIPIENT:
    process.env.STACKS_RECIPIENT || "ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV",
  DEPOSIT_AMOUNT: process.env.DEPOSIT_AMOUNT || "10.00",
  MAX_FEE: "0",
};

// ============ Contract ABIs ============
const X_RESERVE_ABI = [
  {
    name: "depositToRemote",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "value", type: "uint256" },
      { name: "remoteDomain", type: "uint32" },
      { name: "remoteRecipient", type: "bytes32" },
      { name: "localToken", type: "address" },
      { name: "maxFee", type: "uint256" },
      { name: "hookData", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

// ============ Main deposit function ============
async function deposit() {
  if (!config.PRIVATE_KEY) {
    throw new Error(
      "ETHEREUM_PRIVATE_KEY must be set in .env file"
    );
  }

  console.log("=== USDCx Bridge: Ethereum Sepolia → Stacks Testnet ===\n");

  // Setup wallet
  const account = privateKeyToAccount(config.PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(config.ETH_RPC_URL),
  });
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(config.ETH_RPC_URL),
  });

  console.log(`Ethereum wallet:  ${account.address}`);
  console.log(`Stacks recipient: ${config.STACKS_RECIPIENT}`);
  console.log(`Deposit amount:   ${config.DEPOSIT_AMOUNT} USDC\n`);

  // 1. Check ETH balance for gas
  const ethBalance = await publicClient.getBalance({
    address: account.address,
  });
  console.log(`ETH balance: ${formatUnits(ethBalance, 18)} ETH`);
  if (ethBalance === 0n) {
    throw new Error(
      "No ETH for gas fees. Get testnet ETH from https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
    );
  }

  // 2. Check USDC balance
  const usdcBalance = (await publicClient.readContract({
    address: config.ETH_USDC_CONTRACT,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  })) as bigint;
  console.log(`USDC balance: ${formatUnits(usdcBalance, 6)} USDC`);

  const depositValue = parseUnits(config.DEPOSIT_AMOUNT, 6);
  if (usdcBalance < depositValue) {
    throw new Error(
      `Insufficient USDC. Have ${formatUnits(usdcBalance, 6)}, need ${config.DEPOSIT_AMOUNT}. ` +
        `Get testnet USDC from https://faucet.circle.com`
    );
  }

  // 3. Encode Stacks recipient address → bytes32
  const remoteRecipient = stacksAddressToBytes32(config.STACKS_RECIPIENT);
  console.log(`\nEncoded recipient: ${remoteRecipient}`);

  // 4. Approve xReserve to spend USDC
  console.log("\n[1/2] Approving xReserve to spend USDC...");
  const approveTxHash = await walletClient.writeContract({
    address: config.ETH_USDC_CONTRACT,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [config.X_RESERVE_CONTRACT, depositValue],
  });
  console.log(`  Tx: https://sepolia.etherscan.io/tx/${approveTxHash}`);
  console.log("  Waiting for confirmation...");
  await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
  console.log("  ✅ Approval confirmed");

  // 5. Call depositToRemote
  console.log("\n[2/2] Calling depositToRemote...");
  const maxFee = parseUnits(config.MAX_FEE, 6);
  const depositTxHash = await walletClient.writeContract({
    address: config.X_RESERVE_CONTRACT,
    abi: X_RESERVE_ABI,
    functionName: "depositToRemote",
    args: [
      depositValue,
      config.STACKS_DOMAIN,
      remoteRecipient,
      config.ETH_USDC_CONTRACT,
      maxFee,
      "0x",
    ],
  });
  console.log(`  Tx: https://sepolia.etherscan.io/tx/${depositTxHash}`);
  console.log("  Waiting for confirmation...");
  await publicClient.waitForTransactionReceipt({ hash: depositTxHash });
  console.log("  ✅ Deposit confirmed on Ethereum!");

  console.log("\n=== SUCCESS ===");
  console.log(
    `Deposited ${config.DEPOSIT_AMOUNT} USDC → Stacks ${config.STACKS_RECIPIENT}`
  );
  console.log(
    "The Stacks attestation service will mint USDCx in ~15 minutes."
  );
  console.log(
    `\nTrack on Hiro Explorer: https://explorer.hiro.so/address/${config.STACKS_RECIPIENT}?chain=testnet`
  );
}

deposit().catch((err) => {
  console.error("\n❌ Bridge failed:", err.message || err);
  process.exit(1);
});
