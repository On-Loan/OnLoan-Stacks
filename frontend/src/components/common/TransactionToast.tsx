"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui";
import { useNetwork } from "@/providers/NetworkProvider";
import { getApiUrl } from "@/lib/stacks";

async function waitForTx(txId: string, maxAttempts = 60): Promise<"success" | "abort_by_response" | "abort_by_post_condition" | "timeout"> {
  const apiUrl = getApiUrl();
  const cleanId = txId.startsWith("0x") ? txId : `0x${txId}`;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${apiUrl}/extended/v1/tx/${cleanId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.tx_status === "success") return "success";
        if (json.tx_status === "abort_by_response") return "abort_by_response";
        if (json.tx_status === "abort_by_post_condition") return "abort_by_post_condition";
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return "timeout";
}

export function useTransactionToast() {
  const { toast } = useToast();
  const { explorerUrl } = useNetwork();

  const pending = useCallback(
    (message: string) => {
      toast("pending", message);
    },
    [toast]
  );

  const submitted = useCallback(
    (txId: string) => {
      const cleanId = txId.startsWith("0x") ? txId : `0x${txId}`;
      const url = `${explorerUrl}/txid/${cleanId}`;
      toast("pending", `Transaction submitted. Waiting for confirmation...`);

      waitForTx(txId).then((status) => {
        if (status === "success") {
          toast("success", `Transaction confirmed! View on explorer: ${url}`);
        } else if (status === "timeout") {
          toast("pending", `Transaction still pending. Track it: ${url}`);
        } else {
          toast("error", `Transaction failed (${status}). View: ${url}`);
        }
      });
    },
    [toast, explorerUrl]
  );

  const success = useCallback(
    (txId: string) => {
      submitted(txId);
    },
    [submitted]
  );

  const error = useCallback(
    (message: string) => {
      toast("error", message);
    },
    [toast]
  );

  return { pending, success, submitted, error };
}
