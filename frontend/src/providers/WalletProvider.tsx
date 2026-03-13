"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  connect as stacksConnect,
  disconnect as stacksDisconnect,
  isConnected as stacksIsConnected,
  getLocalStorage,
} from "@stacks/connect";

interface WalletContextValue {
  connected: boolean;
  stxAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  connected: false,
  stxAddress: null,
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [stxAddress, setStxAddress] = useState<string | null>(null);

  useEffect(() => {
    if (stacksIsConnected()) {
      const data = getLocalStorage();
      if (data?.addresses?.stx?.[0]) {
        setStxAddress(data.addresses.stx[0].address);
        setConnected(true);
      }
    }
  }, []);

  const connect = useCallback(async () => {
    const response = await stacksConnect();
    if (response?.addresses) {
      const stx = response.addresses.find(
        (a) => a.symbol === "STX"
      );
      if (stx) {
        setStxAddress(stx.address);
        setConnected(true);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    stacksDisconnect();
    setConnected(false);
    setStxAddress(null);
  }, []);

  const value = useMemo(
    () => ({ connected, stxAddress, connect, disconnect }),
    [connected, stxAddress, connect, disconnect]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
