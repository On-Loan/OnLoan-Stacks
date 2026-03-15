import {
  STACKS_MAINNET,
  STACKS_TESTNET,
  STACKS_DEVNET,
  defaultUrlFromNetwork,
} from "@stacks/network";
import type { StacksNetwork } from "@stacks/network";
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

/** Network config that routes read-only calls through the proxy in the browser */
export function getReadOnlyNetwork(): StacksNetwork {
  const base = getNetwork();
  if (typeof window !== "undefined") {
    return { ...base, client: { baseUrl: `${window.location.origin}/api/stacks` } };
  }
  return base;
}

export function getApiUrl(): string {
  // In the browser, proxy through Next.js rewrites to avoid CORS
  if (typeof window !== "undefined") return "/api/stacks";
  return (
    process.env.NEXT_PUBLIC_STACKS_API_URL ??
    defaultUrlFromNetwork(getNetwork())
  );
}
