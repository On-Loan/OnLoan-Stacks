"use client";

import { useState } from "react";
import { ASSETS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { HealthFactorBadge } from "@/components/borrowing/HealthFactorBadge";
import { useBorrow } from "@/hooks/useBorrow";
import type { BorrowQuote } from "@/types/protocol";

interface BorrowFormProps {
  quote: BorrowQuote | null | undefined;
  collateralAsset: "sbtc" | "stx";
  collateralAmount: bigint;
}

export function BorrowForm({
  quote,
  collateralAsset,
  collateralAmount,
}: BorrowFormProps) {
  const { depositAndBorrow, loading } = useBorrow();
  const [amount, setAmount] = useState("");
  const usdcx = ASSETS.usdcx;

  // On-chain values use 8-decimal format (1e8 = $1.00)
  const ORACLE_DECIMALS = 8;
  const maxBorrowable = quote
    ? Number(quote.maxBorrowableUsdcx) / 10 ** ORACLE_DECIMALS
    : 0;
  const parsedAmount = parseFloat(amount || "0");
  const ltvPercent =
    maxBorrowable > 0
      ? Math.min((parsedAmount / maxBorrowable) * (quote?.assetLtvLimit ?? 70), 100)
      : 0;

  const healthFactor =
    parsedAmount > 0 && maxBorrowable > 0
      ? (maxBorrowable / parsedAmount) * (quote?.healthFactor ?? 1.5)
      : 0;

  const ltvVariant =
    ltvPercent > 80 ? "danger" : ltvPercent > 60 ? "warning" : "success";

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const pct = Number(e.target.value);
    const val = (maxBorrowable * pct) / 100;
    setAmount(val > 0 ? val.toFixed(2) : "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsedAmount || parsedAmount <= 0 || !quote) return;

    const rawBorrow = BigInt(Math.floor(parsedAmount * 10 ** usdcx.decimals));
    depositAndBorrow(collateralAsset, collateralAmount, rawBorrow).then(() => {
      setAmount("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Borrow Amount"
        type="number"
        placeholder="0.00"
        step="any"
        min="0"
        max={maxBorrowable.toString()}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        suffix="USDCx"
        disabled={!quote || maxBorrowable <= 0}
      />

      <input
        type="range"
        min="0"
        max="100"
        value={maxBorrowable > 0 ? (parsedAmount / maxBorrowable) * 100 : 0}
        onChange={handleSlider}
        className="w-full accent-onloan-orange"
        disabled={!quote || maxBorrowable <= 0}
      />

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>LTV</span>
          <span>{ltvPercent.toFixed(1)}%</span>
        </div>
        <Progress value={ltvPercent} variant={ltvVariant} />
      </div>

      {parsedAmount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Health Factor</span>
          <HealthFactorBadge value={healthFactor} />
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={loading}
        disabled={
          !quote || parsedAmount <= 0 || parsedAmount > maxBorrowable
        }
      >
        Borrow USDCx
      </Button>
    </form>
  );
}
