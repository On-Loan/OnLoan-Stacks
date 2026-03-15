"use client";

import { cn } from "@/lib/utils";
import { AssetIcon } from "@/components/common/AssetIcon";
import { ASSETS } from "@/lib/constants";

interface CollateralSelectorProps {
  value: "sbtc" | "stx";
  onChange: (asset: "sbtc" | "stx") => void;
}

const options: Array<"sbtc" | "stx"> = ["sbtc", "stx"];

export function CollateralSelector({
  value,
  onChange,
}: CollateralSelectorProps) {
  return (
    <div className="flex gap-2 p-1 bg-surface-elevated rounded-xl">
      {options.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors",
            value === id
              ? "bg-onloan-orange/15 text-onloan-orange border border-onloan-orange/30"
              : "text-zinc-400 hover:text-white"
          )}
        >
          <AssetIcon asset={id} size="sm" />
          {ASSETS[id].name}
        </button>
      ))}
    </div>
  );
}
