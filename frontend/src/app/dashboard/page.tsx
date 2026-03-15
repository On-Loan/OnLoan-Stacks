"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  Button,
} from "@/components/ui";
import { AssetIcon } from "@/components/common";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowDownToLine,
  Layers,
  RefreshCw,
} from "lucide-react";
import { usePoolStats } from "@/hooks/usePoolStats";
import { usePositions } from "@/hooks/usePositions";
import { useLenderDeposit } from "@/hooks/useBalances";
import { useOraclePrice } from "@/hooks/useOraclePrice";
import { useUpdateOracle } from "@/hooks/useUpdateOracle";
import { ASSETS, type AssetId } from "@/lib/constants";

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}

export default function DashboardPage() {
  const { data: poolStats, isLoading: poolsLoading } = usePoolStats();
  const { data: positions, isLoading: posLoading } = usePositions();
  const { data: stxDeposit } = useLenderDeposit("stx");
  const { data: sbtcDeposit } = useLenderDeposit("sbtc");
  const { data: usdcxDeposit } = useLenderDeposit("usdcx");
  const { data: btcPrice } = useOraclePrice("sbtc");
  const { data: stxPrice } = useOraclePrice("stx");
  const { updatePrices, loading: oracleLoading } = useUpdateOracle();

  const prices: Record<string, number> = {
    sbtc: btcPrice ?? 0,
    stx: stxPrice ?? 0,
    usdcx: 1,
  };

  const totalSuppliedUsd = poolStats?.reduce((sum, p) => {
    const decimals = ASSETS[p.assetId as AssetId]?.decimals ?? 6;
    const tokenAmount = formatTokenAmount(p.totalDeposits, decimals);
    return sum + tokenAmount * (prices[p.assetId] ?? 0);
  }, 0) ?? 0;

  const totalBorrowedUsd = poolStats?.reduce((sum, p) => {
    const decimals = ASSETS[p.assetId as AssetId]?.decimals ?? 6;
    const tokenAmount = formatTokenAmount(p.totalBorrows, decimals);
    return sum + tokenAmount * (prices[p.assetId] ?? 0);
  }, 0) ?? 0;

  // User's lender deposits across all pools
  const userDepositsUsd =
    (stxDeposit
      ? formatTokenAmount(stxDeposit.amount, ASSETS.stx.decimals) * prices.stx
      : 0) +
    (sbtcDeposit
      ? formatTokenAmount(sbtcDeposit.amount, ASSETS.sbtc.decimals) * prices.sbtc
      : 0) +
    (usdcxDeposit
      ? formatTokenAmount(usdcxDeposit.amount, ASSETS.usdcx.decimals) * prices.usdcx
      : 0);

  // User's borrow positions (from collateral-manager)
  const userBorrowsUsd = positions?.reduce((sum, p) => {
    const decimals = ASSETS["usdcx"].decimals;
    const tokenAmount = formatTokenAmount(p.borrowedAmount, decimals);
    return sum + tokenAmount;
  }, 0) ?? 0;

  const assets = (poolStats ?? []).map((p) => {
    const asset = ASSETS[p.assetId as AssetId];
    if (!asset) return null;
    const decimals = asset.decimals;
    const price = prices[p.assetId] ?? 0;
    const suppliedTokens = formatTokenAmount(p.totalDeposits, decimals);
    const borrowedTokens = formatTokenAmount(p.totalBorrows, decimals);
    return {
      id: p.assetId as AssetId,
      name: asset.symbol,
      supplyApy: p.supplyApy,
      borrowApy: p.borrowApy,
      supplied: formatUsd(suppliedTokens * price),
      borrowed: formatUsd(borrowedTokens * price),
    };
  }).filter(Boolean) as { id: AssetId; name: string; supplyApy: number; borrowApy: number; supplied: string; borrowed: string }[];

  const isLoading = poolsLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <Button
          size="sm"
          variant="secondary"
          onClick={updatePrices}
          disabled={oracleLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${oracleLoading ? "animate-spin" : ""}`} />
          {oracleLoading ? "Updating..." : "Update Prices"}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Supplied"
          value={isLoading ? undefined : formatUsd(totalSuppliedUsd)}
          color="text-emerald-400"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Borrowed"
          value={isLoading ? undefined : formatUsd(totalBorrowedUsd)}
          color="text-onloan-orange"
        />
        <StatCard
          icon={PiggyBank}
          label="Your Deposits"
          value={isLoading ? undefined : userDepositsUsd > 0 ? formatUsd(userDepositsUsd) : "—"}
          color="text-blue-400"
        />
        <StatCard
          icon={ArrowDownToLine}
          label="Your Borrows"
          value={posLoading ? undefined : userBorrowsUsd > 0 ? formatUsd(userBorrowsUsd) : "—"}
          color="text-yellow-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:grid grid-cols-6 gap-4 text-xs text-zinc-500 font-medium uppercase tracking-wider pb-3 border-b border-zinc-800 px-2">
            <span>Asset</span>
            <span className="text-right">Supply APY</span>
            <span className="text-right">Borrow APY</span>
            <span className="text-right">Total Supplied</span>
            <span className="text-right">Total Borrowed</span>
            <span />
          </div>
          <div className="divide-y divide-zinc-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="py-4 px-2">
                  <Skeleton className="h-8 w-full" />
                </div>
              ))
            ) : (
              assets.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 items-center py-4 px-2"
                >
                  <div className="flex items-center gap-3">
                    <AssetIcon asset={a.id} size="sm" />
                    <span className="font-medium text-white">{a.name}</span>
                  </div>
                  <span className="text-right text-emerald-400 text-sm font-mono md:order-none order-1">
                    {a.supplyApy.toFixed(1)}%
                  </span>
                  <span className="hidden md:block text-right text-onloan-orange text-sm font-mono">
                    {a.borrowApy.toFixed(1)}%
                  </span>
                  <span className="hidden md:block text-right text-zinc-300 text-sm font-mono">
                    {a.supplied}
                  </span>
                  <span className="hidden md:block text-right text-zinc-300 text-sm font-mono">
                    {a.borrowed}
                  </span>
                  <div className="hidden md:flex justify-end gap-2">
                    <Link href="/dashboard/lend">
                      <Button size="sm" variant="secondary">Deposit</Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/lend">
          <Card className="p-6 hover:border-zinc-700 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <PiggyBank className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold text-white">Deposit</span>
            </div>
            <p className="text-sm text-zinc-400">
              Supply assets to earn yield from borrower interest.
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/borrow">
          <Card className="p-6 hover:border-zinc-700 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <ArrowDownToLine className="h-5 w-5 text-onloan-orange" />
              <span className="font-semibold text-white">Borrow</span>
            </div>
            <p className="text-sm text-zinc-400">
              Use STX or sBTC as collateral to borrow USDCx.
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/positions">
          <Card className="p-6 hover:border-zinc-700 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-white">View Positions</span>
            </div>
            <p className="text-sm text-zinc-400">
              Monitor and manage your active positions.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-xl bg-surface-elevated flex items-center justify-center">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      {value ? (
        <span className="text-2xl font-bold font-mono text-white">{value}</span>
      ) : (
        <Skeleton className="h-8 w-24" />
      )}
    </Card>
  );
}
