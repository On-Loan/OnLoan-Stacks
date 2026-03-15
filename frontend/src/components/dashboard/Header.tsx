"use client";

import { usePathname } from "next/navigation";
import { WalletConnect } from "@/components/common/WalletConnect";
import { useBalances } from "@/hooks/useBalances";
import { ASSETS } from "@/lib/constants";

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
  const { data: balances } = useBalances();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 bg-surface-primary/80 backdrop-blur border-b border-zinc-800">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        {balances && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400">
            <BalanceTag label="STX" value={balances.stx} decimals={ASSETS.stx.decimals} />
            <BalanceTag label="sBTC" value={balances.sbtc} decimals={ASSETS.sbtc.decimals} />
            <BalanceTag label="USDCx" value={balances.usdcx} decimals={ASSETS.usdcx.decimals} />
          </div>
        )}
        <WalletConnect />
      </div>
    </header>
  );
}

function BalanceTag({ label, value, decimals }: { label: string; value: bigint; decimals: number }) {
  const num = Number(value) / 10 ** decimals;
  return (
    <span className="flex items-center gap-1 font-mono">
      {label}:{" "}
      <span className="text-zinc-300">
        {num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: decimals > 6 ? 4 : 2 })}
      </span>
    </span>
  );
}
