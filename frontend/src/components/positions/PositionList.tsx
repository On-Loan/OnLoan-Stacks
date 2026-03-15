"use client";

import Link from "next/link";
import { PositionCard } from "./PositionCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { CollateralPosition } from "@/types/protocol";

interface PositionListProps {
  positions: CollateralPosition[];
  isLoading: boolean;
  onRepay: (position: CollateralPosition) => void;
  onAddCollateral: (position: CollateralPosition) => void;
  onWithdraw: (position: CollateralPosition) => void;
}

export function PositionList({
  positions,
  isLoading,
  onRepay,
  onAddCollateral,
  onWithdraw,
}: PositionListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed border-zinc-700 rounded-2xl gap-4">
        <p className="text-zinc-500 text-sm">
          No active positions. Start borrowing to see your positions here.
        </p>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard/borrow">Go to Borrow</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {positions.map((pos) => (
        <PositionCard
          key={pos.collateralType}
          position={pos}
          onRepay={() => onRepay(pos)}
          onAddCollateral={() => onAddCollateral(pos)}
          onWithdraw={() => onWithdraw(pos)}
        />
      ))}
    </div>
  );
}
