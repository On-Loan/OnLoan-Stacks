"use client";

import { formatUsd, formatPercent } from "@/lib/format";
import { ASSETS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/Skeleton";
import type { BorrowQuote } from "@/types/protocol";

interface BorrowQuotePreviewProps {
  quote: BorrowQuote | null | undefined;
  isLoading: boolean;
  collateralAsset: "sbtc" | "stx";
  amount: bigint;
}

export function BorrowQuotePreview({
  quote,
  isLoading,
  collateralAsset,
  amount,
}: BorrowQuotePreviewProps) {
  const asset = ASSETS[collateralAsset];
  const usdcx = ASSETS.usdcx;

  if (amount <= BigInt(0)) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-zinc-700 rounded-2xl">
        <p className="text-zinc-500 text-sm">
          Enter collateral amount to see quote
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 bg-surface-card border border-zinc-800 rounded-2xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-36" />
        <div className="border-t border-zinc-800 my-2" />
        <Skeleton className="h-6 w-52" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-red-500/30 rounded-2xl">
        <p className="text-red-400 text-sm">Unable to fetch quote</p>
      </div>
    );
  }

  // On-chain values use 8-decimal format (1e8 = $1.00)
  const ORACLE_DECIMALS = 8;
  const collateralValueUsd =
    Number(quote.collateralValueUsd) / 10 ** ORACLE_DECIMALS;
  const oraclePrice = Number(quote.oraclePrice) / 10 ** ORACLE_DECIMALS;
  const maxBorrowable =
    Number(quote.maxBorrowableUsdcx) / 10 ** ORACLE_DECIMALS;

  return (
    <div className="space-y-3 p-4 bg-surface-card border border-zinc-800 rounded-2xl">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Collateral Value</span>
        <span className="text-white font-medium">
          {formatUsd(collateralValueUsd)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Oracle Price</span>
        <span className="text-white font-medium">
          {formatUsd(oraclePrice)} / {asset.symbol}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Max LTV</span>
        <span className="text-white font-medium">
          {formatPercent(quote.assetLtvLimit)}
        </span>
      </div>
      <div className="border-t border-zinc-800" />
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Max Borrowable</span>
        <span className="text-onloan-orange font-semibold text-base">
          {maxBorrowable.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          USDCx
        </span>
      </div>
    </div>
  );
}
