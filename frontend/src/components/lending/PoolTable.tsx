"use client";

import type { AssetId } from "@/lib/constants";
import { ASSETS } from "@/lib/constants";
import { formatPercent } from "@/lib/format";
import { usePoolStats } from "@/hooks/usePoolStats";
import { useLenderDeposit } from "@/hooks/useBalances";
import { AssetIcon } from "@/components/common/AssetIcon";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

interface PoolTableProps {
  onDeposit: (assetId: AssetId) => void;
  onWithdraw: (assetId: AssetId) => void;
}

function formatCompact(value: bigint, decimals: number): string {
  const num = Number(value) / 10 ** decimals;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function YourSupplyCell({ assetId }: { assetId: AssetId }) {
  const { data } = useLenderDeposit(assetId);
  const asset = ASSETS[assetId];
  if (!data || data.amount <= BigInt(0)) {
    return <span className="text-zinc-500">—</span>;
  }
  return (
    <span className="text-white">
      {formatCompact(data.amount, asset.decimals)}
    </span>
  );
}

export function PoolTable({ onDeposit, onWithdraw }: PoolTableProps) {
  const { data: pools, isLoading } = usePoolStats();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="hidden md:block overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
              <th className="px-6 py-4 font-medium">Asset</th>
              <th className="px-6 py-4 font-medium">Your Supply</th>
              <th className="px-6 py-4 font-medium">Total Supplied</th>
              <th className="px-6 py-4 font-medium">Total Borrowed</th>
              <th className="px-6 py-4 font-medium">Supply APY</th>
              <th className="px-6 py-4 font-medium">Utilization</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pools?.map((pool) => {
              const asset = ASSETS[pool.assetId as AssetId];
              if (!asset) return null;
              return (
                <tr
                  key={pool.assetId}
                  className="border-b border-zinc-800/50 last:border-0 hover:bg-surface-hover/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <AssetIcon asset={pool.assetId as AssetId} />
                      <div>
                        <p className="font-medium text-white">{asset.name}</p>
                        <p className="text-xs text-zinc-500">{asset.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <YourSupplyCell assetId={pool.assetId as AssetId} />
                  </td>
                  <td className="px-6 py-4 text-white">
                    {formatCompact(pool.totalDeposits, asset.decimals)}
                  </td>
                  <td className="px-6 py-4 text-white">
                    {formatCompact(pool.totalBorrows, asset.decimals)}
                  </td>
                  <td className="px-6 py-4 text-emerald-400">
                    {formatPercent(pool.supplyApy)}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {formatPercent(pool.utilizationRate)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => onDeposit(pool.assetId as AssetId)}
                      >
                        Deposit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onWithdraw(pool.assetId as AssetId)}
                      >
                        Withdraw
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="space-y-3 md:hidden">
        {pools?.map((pool) => {
          const asset = ASSETS[pool.assetId as AssetId];
          if (!asset) return null;
          return (
            <Card key={pool.assetId} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <AssetIcon asset={pool.assetId as AssetId} />
                  <div>
                    <p className="font-medium text-white">{asset.name}</p>
                    <p className="text-xs text-zinc-500">{asset.symbol}</p>
                  </div>
                </div>
                <span className="text-emerald-400 text-sm font-medium">
                  {formatPercent(pool.supplyApy)} APY
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <p className="text-zinc-500">Your Supply</p>
                  <p><YourSupplyCell assetId={pool.assetId as AssetId} /></p>
                </div>
                <div>
                  <p className="text-zinc-500">Total Supplied</p>
                  <p className="text-white">
                    {formatCompact(pool.totalDeposits, asset.decimals)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Total Borrowed</p>
                  <p className="text-white">
                    {formatCompact(pool.totalBorrows, asset.decimals)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onDeposit(pool.assetId as AssetId)}
                >
                  Deposit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => onWithdraw(pool.assetId as AssetId)}
                >
                  Withdraw
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
