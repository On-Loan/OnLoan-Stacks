"use client";

import { useState } from "react";
import { usePositions } from "@/hooks/usePositions";
import { PositionList } from "@/components/positions";
import { RepayForm } from "@/components/borrowing/RepayForm";
import type { CollateralPosition } from "@/types/protocol";

type ModalState =
  | { type: "closed" }
  | { type: "repay"; position: CollateralPosition }
  | { type: "add-collateral"; position: CollateralPosition }
  | { type: "withdraw"; position: CollateralPosition };

export default function PositionsPage() {
  const { data: positions = [], isLoading } = usePositions();
  const [modal, setModal] = useState<ModalState>({ type: "closed" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Your Positions</h1>
        <p className="text-zinc-400 mt-1">
          View and manage your collateral positions.
        </p>
      </div>

      <PositionList
        positions={positions}
        isLoading={isLoading}
        onRepay={(pos) => setModal({ type: "repay", position: pos })}
        onAddCollateral={(pos) =>
          setModal({ type: "add-collateral", position: pos })
        }
        onWithdraw={(pos) => setModal({ type: "withdraw", position: pos })}
      />

      {modal.type === "repay" && (
        <RepayForm
          position={modal.position}
          open
          onClose={() => setModal({ type: "closed" })}
        />
      )}
    </div>
  );
}
