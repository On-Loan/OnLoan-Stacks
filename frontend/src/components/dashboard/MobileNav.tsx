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

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/lend", label: "Lend", icon: PiggyBank },
  { href: "/dashboard/borrow", label: "Borrow", icon: ArrowDownToLine },
  { href: "/dashboard/positions", label: "Positions", icon: Layers },
  { href: "/dashboard/liquidate", label: "Liquidate", icon: AlertTriangle },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px]",
                active ? "text-onloan-orange" : "text-zinc-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
