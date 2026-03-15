"use client";

import { useState } from "react";
import { ASSETS } from "@/lib/constants";
import { useRepay } from "@/hooks/useRepay";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { CollateralPosition } from "@/types/protocol";

interface RepayFormProps {
  position: CollateralPosition;
  open: boolean;
  onClose: () => void;
}

export function RepayForm({ position, open, onClose }: RepayFormProps) {
  const { repay, loading } = useRepay();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const usdcx = ASSETS.usdcx;

  const currentDebt =
    Number(position.borrowedAmount) / 10 ** usdcx.decimals;
  const parsedAmount = parseFloat(amount || "0");
  const rawAmount = BigInt(Math.floor(parsedAmount * 10 ** usdcx.decimals));

  function handleMax() {
    setAmount(currentDebt.toFixed(usdcx.decimals));
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!amount || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (parsedAmount > currentDebt) {
      setError("Amount exceeds current debt");
      return;
    }

    repay(rawAmount, position.collateralType).then(() => {
      setAmount("");
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Repay USDCx"
      description={`Current debt: ${currentDebt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDCx`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Repay Amount"
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
          suffix={
            <button
              type="button"
              onClick={handleMax}
              className="text-xs text-onloan-orange hover:underline"
            >
              MAX
            </button>
          }
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
          disabled={!amount || parsedAmount <= 0}
        >
          Repay USDCx
        </Button>
      </form>
    </Modal>
  );
}
