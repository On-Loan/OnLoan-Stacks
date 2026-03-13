"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import {
  STACKS_MAINNET,
  STACKS_TESTNET,
  STACKS_DEVNET,
} from "@stacks/network";
import type { StacksNetwork } from "@stacks/network";

type NetworkName = "devnet" | "testnet" | "mainnet";

interface NetworkContextValue {
  network: StacksNetwork;
  networkName: NetworkName;
  apiUrl: string;
  explorerUrl: string;
}

const NETWORK_CONFIG: Record<
  NetworkName,
  { network: StacksNetwork; apiUrl: string; explorerUrl: string }
> = {
  devnet: {
    network: STACKS_DEVNET,
    apiUrl: "http://localhost:3999",
    explorerUrl: "http://localhost:8000",
  },
  testnet: {
    network: STACKS_TESTNET,
    apiUrl: "https://api.testnet.hiro.so",
    explorerUrl: "https://explorer.hiro.so/?chain=testnet",
  },
  mainnet: {
    network: STACKS_MAINNET,
    apiUrl: "https://api.mainnet.hiro.so",
    explorerUrl: "https://explorer.hiro.so",
  },
};

const NetworkContext = createContext<NetworkContextValue>({
  ...NETWORK_CONFIG.devnet,
  networkName: "devnet",
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const networkName = (process.env.NEXT_PUBLIC_NETWORK || "devnet") as NetworkName;
  const config = NETWORK_CONFIG[networkName] ?? NETWORK_CONFIG.devnet;

  const value = useMemo(
    () => ({ ...config, networkName }),
    [config, networkName]
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
