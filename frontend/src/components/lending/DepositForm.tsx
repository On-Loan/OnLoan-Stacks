"use client";

import { useState } from "react";
import { ASSETS, type AssetId } from "@/lib/constants";
import { formatAmount } from "@/lib/format";
import { useDeposit } from "@/hooks/useDeposit";
import { useBalances } from "@/hooks/useBalances";
import { AssetIcon } from "@/components/common/AssetIcon";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

interface DepositFormProps {
  assetId: AssetId;
  open: boolean;
  onClose: () => void;
}

export function DepositForm({ assetId, open, onClose }: DepositFormProps) {
  const asset = ASSETS[assetId];
  const { deposit, loading } = useDeposit();
  const { data: balances, isLoading: balancesLoading } = useBalances();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const parsedAmount = parseFloat(amount || "0");
  const rawAmount = BigInt(
    Math.floor(parsedAmount * 10 ** asset.decimals)
  );

  const walletBalance = balances?.[assetId] ?? BigInt(0);
  const readableBalance = Number(walletBalance) / 10 ** asset.decimals;

  function handleMax() {
    if (walletBalance > BigInt(0)) {
      const maxVal = Number(walletBalance) / 10 ** asset.decimals;
      // For STX, reserve 1 STX for fees
      const val = assetId === "stx" ? Math.max(0, maxVal - 1) : maxVal;
      setAmount(val.toString());
      setError("");
    }
  }

  function validate(): string | null {
    if (!amount || parsedAmount <= 0) return "Enter a valid amount";
    if (rawAmount > walletBalance) {
      return `Insufficient ${asset.symbol} balance`;
    }
    if (assetId === "stx" && walletBalance - rawAmount < BigInt(1_000_000)) {
      return "Keep at least 1 STX for transaction fees";
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    deposit(rawAmount, assetId).then((success) => {
      if (success) {
        setAmount("");
        onClose();
      }
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={`Deposit ${asset.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-surface-primary rounded-xl">
          <div className="flex items-center gap-3">
            <AssetIcon asset={assetId} size="lg" />
            <div>
              <p className="text-white font-medium">{asset.name}</p>
              <p className="text-xs text-zinc-500">{asset.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Wallet Balance</p>
            {balancesLoading ? (
              <Skeleton className="h-5 w-20 ml-auto" />
            ) : (
              <p className="text-sm text-white font-mono">
                {readableBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: asset.decimals > 6 ? 8 : 6,
                })}{" "}
                {asset.symbol}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-zinc-400">Amount</label>
            <button
              type="button"
              onClick={handleMax}
              className="text-xs text-onloan-orange hover:text-onloan-orange/80 font-medium transition-colors"
            >
              MAX
            </button>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            error={error}
            suffix={asset.symbol}
          />
        </div>

        {parsedAmount > 0 && !error && (
          <div className="p-3 bg-surface-primary rounded-xl space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">You will deposit</span>
              <span className="text-white">
                {formatAmount(rawAmount, assetId)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Remaining balance</span>
              <span className="text-zinc-300">
                {((readableBalance - parsedAmount)).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{" "}
                {asset.symbol}
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
          disabled={!amount || parsedAmount <= 0 || loading}
        >
          {loading ? "Depositing..." : `Deposit ${asset.name}`}
        </Button>
      </form>
    </Modal>
  );
}
