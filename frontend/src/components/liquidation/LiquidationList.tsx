"use client";

import { LiquidationCard } from "./LiquidationCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { LiquidatablePosition } from "@/hooks/useLiquidations";

interface LiquidationListProps {
  positions: LiquidatablePosition[];
  isLoading: boolean;
  onLiquidate: (position: LiquidatablePosition) => void;
}

export function LiquidationList({
  positions,
  isLoading,
  onLiquidate,
}: LiquidationListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-zinc-700 rounded-2xl">
        <p className="text-zinc-500 text-sm">
          No positions available for liquidation. All borrowers are healthy.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {positions.map((pos) => (
        <LiquidationCard
          key={`${pos.borrower}-${pos.collateralType}`}
          position={pos}
          onLiquidate={() => onLiquidate(pos)}
        />
      ))}
    </div>
  );
}
