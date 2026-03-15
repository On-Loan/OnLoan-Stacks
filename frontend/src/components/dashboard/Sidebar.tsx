"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PiggyBank,
  ArrowDownToLine,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/providers/WalletProvider";
import { useNetwork } from "@/providers/NetworkProvider";
import { truncateAddress } from "@/lib/format";
import { Badge } from "@/components/ui";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/lend", label: "Lend", icon: PiggyBank },
  { href: "/dashboard/borrow", label: "Borrow", icon: ArrowDownToLine },
  { href: "/dashboard/positions", label: "Positions", icon: Layers },
  { href: "/dashboard/liquidate", label: "Liquidate", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { stxAddress } = useWallet();
  const { networkName } = useNetwork();

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-surface-card border-r border-zinc-800 z-40">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="h-8 w-8 rounded-lg bg-onloan-orange flex items-center justify-center text-white font-bold text-sm">
          OL
        </div>
        <span className="text-lg font-bold text-white">OnLoan</span>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-onloan-orange/10 text-onloan-orange border-l-2 border-onloan-orange"
                  : "text-zinc-400 hover:text-white hover:bg-surface-hover"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-zinc-800 space-y-3">
        <Badge variant={networkName === "mainnet" ? "success" : "info"}>
          {networkName}
        </Badge>
        {stxAddress && (
          <p className="text-xs text-zinc-500 font-mono truncate">
            {truncateAddress(stxAddress)}
          </p>
        )}
      </div>
    </aside>
  );
}
