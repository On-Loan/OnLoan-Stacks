"use client";

import type { ReactNode } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { Sidebar, Header, MobileNav } from "@/components/dashboard";
import { Button } from "@/components/ui";
import { Wallet } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { connected, connect } = useWallet();

  if (!connected) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-onloan-orange/10 flex items-center justify-center">
            <Wallet className="h-8 w-8 text-onloan-orange" />
          </div>
          <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-zinc-400 text-sm">
            Connect a Stacks wallet to access the OnLoan dashboard and start
            lending or borrowing.
          </p>
          <Button size="lg" onClick={connect} className="w-full">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 pb-20 md:pb-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
