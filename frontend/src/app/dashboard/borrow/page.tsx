"use client";

import { useState } from "react";
import { ASSETS } from "@/lib/constants";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  CollateralSelector,
  BorrowQuotePreview,
  BorrowForm,
} from "@/components/borrowing";
import { useBorrowQuote } from "@/hooks/useBorrowQuote";
import { useBalances } from "@/hooks/useBalances";

export default function BorrowPage() {
  const [collateralAsset, setCollateralAsset] = useState<"sbtc" | "stx">(
    "sbtc"
  );
  const [collateralInput, setCollateralInput] = useState("");
  const [inputError, setInputError] = useState("");
  const { data: balances, isLoading: balancesLoading } = useBalances();

  const asset = ASSETS[collateralAsset];
  const parsedCollateral = parseFloat(collateralInput || "0");
  const collateralAmount = BigInt(
    Math.floor(parsedCollateral * 10 ** asset.decimals)
  );

  const walletBalance = balances?.[collateralAsset] ?? BigInt(0);
  const readableBalance = Number(walletBalance) / 10 ** asset.decimals;

  const { data: quote, isLoading } = useBorrowQuote(
    collateralAsset,
    collateralAmount
  );

  function handleMax() {
    if (walletBalance > BigInt(0)) {
      const maxVal = Number(walletBalance) / 10 ** asset.decimals;
      const val = collateralAsset === "stx" ? Math.max(0, maxVal - 1) : maxVal;
      setCollateralInput(val.toString());
      setInputError("");
    }
  }

  function handleCollateralChange(value: string) {
    setCollateralInput(value);
    const parsed = parseFloat(value || "0");
    const raw = BigInt(Math.floor(parsed * 10 ** asset.decimals));
    if (parsed > 0 && raw > walletBalance) {
      setInputError(`Insufficient ${asset.symbol} balance`);
    } else if (collateralAsset === "stx" && parsed > 0 && walletBalance - raw < BigInt(1_000_000)) {
      setInputError("Keep at least 1 STX for transaction fees");
    } else {
      setInputError("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Borrow USDCx</h1>
        <p className="text-zinc-400 mt-1">
          Deposit collateral and borrow USDCx with real-time pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <CollateralSelector
            value={collateralAsset}
            onChange={(a) => {
              setCollateralAsset(a);
              setCollateralInput("");
              setInputError("");
            }}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-400">
                Collateral Amount
              </label>
              <div className="flex items-center gap-2">
                {balancesLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="text-xs text-zinc-500">
                    Balance: {readableBalance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}{" "}
                    {asset.symbol}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleMax}
                  className="text-xs text-onloan-orange hover:text-onloan-orange/80 font-medium transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              step="any"
              min="0"
              value={collateralInput}
              onChange={(e) => handleCollateralChange(e.target.value)}
              error={inputError}
              suffix={asset.symbol}
            />
          </div>

          {(quote || collateralAmount > BigInt(0)) && !inputError && (
            <div className="mt-6">
              <BorrowForm
                quote={quote}
                collateralAsset={collateralAsset}
                collateralAmount={collateralAmount}
              />
            </div>
          )}
        </div>

        <div>
          <BorrowQuotePreview
            quote={quote}
            isLoading={isLoading}
            collateralAsset={collateralAsset}
            amount={collateralAmount}
          />
        </div>
      </div>
    </div>
  );
}
