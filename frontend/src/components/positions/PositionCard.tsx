"use client";

import { ASSETS } from "@/lib/constants";
import { formatAmount, formatUsd } from "@/lib/format";
import { AssetIcon } from "@/components/common/AssetIcon";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { HealthFactorBadge } from "@/components/borrowing/HealthFactorBadge";
import type { CollateralPosition } from "@/types/protocol";

interface PositionCardProps {
  position: CollateralPosition;
  onRepay: () => void;
  onAddCollateral: () => void;
  onWithdraw: () => void;
}

export function PositionCard({
  position,
  onRepay,
  onAddCollateral,
  onWithdraw,
}: PositionCardProps) {
  const assetId = position.collateralType as "sbtc" | "stx";
  const asset = ASSETS[assetId];
  const usdcx = ASSETS.usdcx;

  const ltvPercent = position.ltvRatio * 100;
  const ltvVariant =
    ltvPercent > 80 ? "danger" : ltvPercent > 60 ? "warning" : "success";

  const borrowedDisplay =
    Number(position.borrowedAmount) / 10 ** usdcx.decimals;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <AssetIcon asset={assetId} size="lg" />
        <div>
          <h3 className="text-white font-semibold">{asset.name} Collateral</h3>
          <p className="text-xs text-zinc-500">Active Position</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Collateral</span>
          <div className="text-right">
            <span className="text-white">
              {formatAmount(position.collateralAmount, assetId)}
            </span>
            <p className="text-xs text-zinc-500">
              {formatUsd(position.collateralValueUsd)}
            </p>
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Borrowed</span>
          <span className="text-white">
            {borrowedDisplay.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            USDCx
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>LTV</span>
            <span>{ltvPercent.toFixed(1)}%</span>
          </div>
          <Progress value={ltvPercent} variant={ltvVariant} />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-zinc-400">Health Factor</span>
          <HealthFactorBadge value={position.healthFactor} />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="primary" size="sm" onClick={onRepay}>
          Repay
        </Button>
        <Button variant="secondary" size="sm" onClick={onAddCollateral}>
          Add Collateral
        </Button>
        <Button variant="ghost" size="sm" onClick={onWithdraw}>
          Withdraw
        </Button>
      </CardFooter>
    </Card>
  );
}
