"use client";

import { useState } from "react";
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";
import { DEPLOYER, ASSETS } from "@/lib/constants";
import { formatUsd, truncateAddress } from "@/lib/format";
import { useLiquidations, type LiquidatablePosition } from "@/hooks/useLiquidations";
import { useTransactionToast } from "@/components/common/TransactionToast";
import { useNetwork } from "@/providers/NetworkProvider";
import { LiquidationList } from "@/components/liquidation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export default function LiquidatePage() {
  const { data: positions = [], isLoading } = useLiquidations();
  const tx = useTransactionToast();
  const { networkName } = useNetwork();
  const [selected, setSelected] = useState<LiquidatablePosition | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLiquidate() {
    if (!selected) return;
    setLoading(true);
    try {
      tx.pending("Liquidating position...");
      const response = await request("stx_callContract", {
        contract: `${DEPLOYER}.liquidation-engine`,
        functionName: "liquidate",
        functionArgs: [
          Cl.principal(selected.borrower),
          Cl.stringAscii(selected.collateralType),
        ],
        network: networkName,
        postConditionMode: "deny",
        postConditions: [],
      });
      if (response && "txid" in response) {
        tx.success(response.txid as string);
      }
      setSelected(null);
    } catch (err: unknown) {
      tx.error(err instanceof Error ? err.message : "Liquidation failed");
    } finally {
      setLoading(false);
    }
  }

  const debtDisplay = selected
    ? Number(selected.borrowedAmount) / 10 ** ASSETS.usdcx.decimals
    : 0;
  const profit = debtDisplay * ((selected?.liquidationBonus ?? 0) / 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Liquidation Marketplace
        </h1>
        <p className="text-zinc-400 mt-1">
          Liquidate undercollateralized positions and earn a bonus.
        </p>
      </div>

      <LiquidationList
        positions={positions}
        isLoading={isLoading}
        onLiquidate={setSelected}
      />

      {selected && (
        <Modal
          open
          onOpenChange={() => setSelected(null)}
          title="Confirm Liquidation"
          description={`Liquidate ${truncateAddress(selected.borrower)}'s position`}
        >
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Debt to Repay</span>
              <span className="text-white">
                {formatUsd(debtDisplay)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Liquidation Bonus</span>
              <span className="text-emerald-400">
                {selected.liquidationBonus}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Expected Profit</span>
              <span className="text-emerald-400">{formatUsd(profit)}</span>
            </div>
            <div className="border-t border-zinc-800 pt-3">
              <Button
                className="w-full"
                variant="danger"
                size="lg"
                loading={loading}
                onClick={handleLiquidate}
              >
                Confirm Liquidation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
