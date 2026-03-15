"use client";

import { useState } from "react";
import { ASSETS, type AssetId } from "@/lib/constants";
import { formatAmount } from "@/lib/format";
import { useWithdraw } from "@/hooks/useWithdraw";
import { useLenderDeposit } from "@/hooks/useBalances";
import { usePoolStatsForAsset } from "@/hooks/usePoolStats";
import { AssetIcon } from "@/components/common/AssetIcon";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

interface WithdrawFormProps {
  assetId: AssetId;
  open: boolean;
  onClose: () => void;
}

export function WithdrawForm({ assetId, open, onClose }: WithdrawFormProps) {
  const asset = ASSETS[assetId];
  const { withdraw, loading } = useWithdraw();
  const { data: lenderDeposit, isLoading: depositLoading } =
    useLenderDeposit(assetId);
  const { data: poolStats } = usePoolStatsForAsset(assetId);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const parsedAmount = parseFloat(amount || "0");
  const rawAmount = BigInt(
    Math.floor(parsedAmount * 10 ** asset.decimals)
  );

  const depositedBalance = lenderDeposit?.amount ?? BigInt(0);
  const readableDeposit = Number(depositedBalance) / 10 ** asset.decimals;

  const availableLiquidity = poolStats
    ? poolStats.totalDeposits - poolStats.totalBorrows
    : BigInt(0);

  function handleMax() {
    if (depositedBalance > BigInt(0)) {
      // Can't withdraw more than available liquidity
      const maxWithdraw =
        depositedBalance < availableLiquidity
          ? depositedBalance
          : availableLiquidity;
      const val = Number(maxWithdraw) / 10 ** asset.decimals;
      setAmount(val.toString());
      setError("");
    }
  }

  function validate(): string | null {
    if (!amount || parsedAmount <= 0) return "Enter a valid amount";
    if (rawAmount > depositedBalance) {
      return `You only have ${readableDeposit.toFixed(4)} ${asset.symbol} deposited`;
    }
    if (rawAmount > availableLiquidity) {
      return "Insufficient pool liquidity for this withdrawal";
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
    withdraw(rawAmount, assetId).then((success) => {
      if (success) {
        setAmount("");
        onClose();
      }
    });
  }

  const hasDeposit = depositedBalance > BigInt(0);

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={`Withdraw ${asset.name}`}
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
            <p className="text-xs text-zinc-500">Your Deposit</p>
            {depositLoading ? (
              <Skeleton className="h-5 w-20 ml-auto" />
            ) : (
              <p className="text-sm text-white font-mono">
                {readableDeposit.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: asset.decimals > 6 ? 8 : 6,
                })}{" "}
                {asset.symbol}
              </p>
            )}
          </div>
        </div>

        {!depositLoading && !hasDeposit ? (
          <div className="p-4 bg-zinc-800/50 rounded-xl text-center">
            <p className="text-zinc-400 text-sm">
              You have no {asset.symbol} deposited in this pool.
            </p>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-zinc-400">
                  Amount
                </label>
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
                  <span className="text-zinc-400">You will receive</span>
                  <span className="text-white">
                    {formatAmount(rawAmount, assetId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Remaining deposit</span>
                  <span className="text-zinc-300">
                    {(readableDeposit - parsedAmount).toLocaleString("en-US", {
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
              variant="secondary"
              loading={loading}
              disabled={!amount || parsedAmount <= 0 || !hasDeposit || loading}
            >
              {loading ? "Withdrawing..." : `Withdraw ${asset.name}`}
            </Button>
          </>
        )}
      </form>
    </Modal>
  );
}
