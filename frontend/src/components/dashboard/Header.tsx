"use client";

import { usePathname } from "next/navigation";
import { WalletConnect } from "@/components/common/WalletConnect";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/lend": "Lending Pools",
  "/dashboard/borrow": "Borrow",
  "/dashboard/positions": "Positions",
  "/dashboard/liquidate": "Liquidate",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 bg-surface-primary/80 backdrop-blur border-b border-zinc-800">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400">
          <PriceTag label="BTC" />
          <PriceTag label="STX" />
        </div>
        <WalletConnect />
      </div>
    </header>
  );
}

function PriceTag({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 font-mono">
      {label}: <span className="text-zinc-300">—</span>
    </span>
  );
}
