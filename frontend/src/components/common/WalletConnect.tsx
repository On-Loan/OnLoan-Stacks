"use client";

import { useWallet } from "@/providers/WalletProvider";
import { truncateAddress } from "@/lib/format";
import { Button } from "@/components/ui";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, ChevronDown, Wallet } from "lucide-react";

export function WalletConnect() {
  const { connected, stxAddress, connect, disconnect } = useWallet();

  if (!connected) {
    return (
      <Button size="sm" onClick={connect}>
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="inline-flex items-center gap-2 rounded-xl bg-surface-elevated border border-zinc-700 px-3 py-2 text-sm text-white hover:border-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-onloan-orange">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          {stxAddress ? truncateAddress(stxAddress) : "Connected"}
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[160px] rounded-xl bg-surface-elevated border border-zinc-700 p-1 shadow-2xl animate-in fade-in-0 zoom-in-95"
        >
          <DropdownMenu.Item
            onSelect={disconnect}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 cursor-pointer outline-none hover:bg-surface-hover"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
