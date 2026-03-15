"use client";

import { ASSETS } from "@/lib/constants";
import { formatUsd, truncateAddress } from "@/lib/format";
import { AssetIcon } from "@/components/common/AssetIcon";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HealthFactorBadge } from "@/components/borrowing/HealthFactorBadge";
import type { LiquidatablePosition } from "@/hooks/useLiquidations";

interface LiquidationCardProps {
  position: LiquidatablePosition;
  onLiquidate: () => void;
  loading?: boolean;
}

export function LiquidationCard({
  position,
  onLiquidate,
  loading,
}: LiquidationCardProps) {
  const assetId = position.collateralType as "sbtc" | "stx";
  const asset = ASSETS[assetId];
  const usdcx = ASSETS.usdcx;

  const collateralDisplay =
    Number(position.collateralAmount) /
    10 ** asset.decimals;
  const debtDisplay =
    Number(position.borrowedAmount) / 10 ** usdcx.decimals;
  const estimatedProfit = debtDisplay * (position.liquidationBonus / 100);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AssetIcon asset={assetId} size="md" />
            <div>
              <p className="text-white font-medium text-sm">
                {asset.name} Position
              </p>
              <p className="text-xs text-zinc-500">
                {truncateAddress(position.borrower)}
              </p>
            </div>
          </div>
          <HealthFactorBadge value={position.healthFactor} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-zinc-500 text-xs">Collateral</p>
            <p className="text-white">
              {collateralDisplay.toLocaleString("en-US", {
                maximumFractionDigits: asset.decimals > 6 ? 4 : 2,
              })}{" "}
              {asset.symbol}
            </p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">Debt</p>
            <p className="text-white">
              {debtDisplay.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USDCx
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="success">{position.liquidationBonus}% bonus</Badge>
            <span className="text-xs text-emerald-400">
              ~{formatUsd(estimatedProfit)} profit
            </span>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={onLiquidate}
            loading={loading}
          >
            Liquidate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
