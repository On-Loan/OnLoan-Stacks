import {
  STACKS_MAINNET,
  STACKS_TESTNET,
  STACKS_DEVNET,
  defaultUrlFromNetwork,
} from "@stacks/network";
import type { StacksNetwork } from "@stacks/network";
import { cvToHex, hexToCV, cvToValue } from "@stacks/transactions";
import type { ClarityValue } from "@stacks/transactions";
import { NETWORK } from "./constants";

export function getNetwork(): StacksNetwork {
  switch (NETWORK) {
    case "mainnet":
      return STACKS_MAINNET;
    case "testnet":
      return STACKS_TESTNET;
    default:
      return STACKS_DEVNET;
  }
}

export function getApiUrl(): string {
  // In the browser, proxy through Next.js rewrites to avoid CORS
  if (typeof window !== "undefined") return "/api/stacks";
  return (
    process.env.NEXT_PUBLIC_STACKS_API_URL ??
    defaultUrlFromNetwork(getNetwork())
  );
}

/**
 * Lightweight read-only contract call that goes through our API proxy.
 * Replaces fetchCallReadOnlyFunction to avoid CORS and heavy imports.
 */
export async function callReadOnly(opts: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
}): Promise<ClarityValue> {
  const { contractAddress, contractName, functionName, functionArgs, senderAddress } = opts;
  const url = `${getApiUrl()}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: senderAddress,
      arguments: functionArgs.map((a) => cvToHex(a)),
    }),
  });
  if (!res.ok) throw new Error(`call-read failed: ${res.status}`);
  const json = await res.json();
  if (!json.okay) throw new Error(json.cause ?? "call-read error");
  return hexToCV(json.result);
}

/** Convenience: call read-only and convert result with cvToValue */
export async function callReadOnlyValue(opts: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
}) {
  const cv = await callReadOnly(opts);
  return cvToValue(cv);
}
