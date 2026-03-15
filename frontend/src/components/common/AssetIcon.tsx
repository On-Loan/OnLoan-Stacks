"use client";

import { cn } from "@/lib/utils";

type AssetType = "sbtc" | "stx" | "usdcx";

const assetConfig: Record<AssetType, { bg: string; label: string }> = {
  sbtc: { bg: "bg-orange-500", label: "₿" },
  stx: { bg: "bg-indigo-500", label: "S" },
  usdcx: { bg: "bg-emerald-500", label: "$" },
};

const sizeMap = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

interface AssetIconProps {
  asset: AssetType;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function AssetIcon({ asset, size = "md", className }: AssetIconProps) {
  const config = assetConfig[asset];
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold text-white",
        config.bg,
        sizeMap[size],
        className
      )}
    >
      {config.label}
    </div>
  );
}
