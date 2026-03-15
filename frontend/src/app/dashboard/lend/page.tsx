"use client";

import { useState } from "react";
import type { AssetId } from "@/lib/constants";
import { PoolTable, DepositForm, WithdrawForm } from "@/components/lending";

type ModalState =
  | { type: "closed" }
  | { type: "deposit"; assetId: AssetId }
  | { type: "withdraw"; assetId: AssetId };

export default function LendPage() {
  const [modal, setModal] = useState<ModalState>({ type: "closed" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Lending Pools</h1>
        <p className="text-zinc-400 mt-1">
          Supply assets to earn yield. Withdraw anytime.
        </p>
      </div>

      <PoolTable
        onDeposit={(assetId) => setModal({ type: "deposit", assetId })}
        onWithdraw={(assetId) => setModal({ type: "withdraw", assetId })}
      />

      {modal.type === "deposit" && (
        <DepositForm
          assetId={modal.assetId}
          open
          onClose={() => setModal({ type: "closed" })}
        />
      )}

      {modal.type === "withdraw" && (
        <WithdrawForm
          assetId={modal.assetId}
          open
          onClose={() => setModal({ type: "closed" })}
        />
      )}
    </div>
  );
}
