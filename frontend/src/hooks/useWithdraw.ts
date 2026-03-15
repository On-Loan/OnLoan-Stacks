"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { request } from "@stacks/connect";
import { Cl, Pc } from "@stacks/transactions";
import { DEPLOYER } from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";
import { useTransactionToast } from "@/components/common/TransactionToast";
import { useNetwork } from "@/providers/NetworkProvider";

export function useWithdraw() {
  const queryClient = useQueryClient();
  const tx = useTransactionToast();
  const { networkName } = useNetwork();
  const [loading, setLoading] = useState(false);

  const withdraw = useCallback(
    async (amount: bigint, assetId: string): Promise<boolean> => {
      setLoading(true);
      try {
        tx.pending(`Withdrawing ${assetId.toUpperCase()}...`);

        // For STX withdrawals, the contract sends STX back to the user
        const postConditions =
          assetId === "stx"
            ? [
                Pc.principal(
                  `${DEPLOYER}.lending-pool` as `${string}.${string}`
                )
                  .willSendEq(amount)
                  .ustx(),
              ]
            : [];

        const response = await request("stx_callContract", {
          contract: `${DEPLOYER}.lending-pool`,
          functionName: "withdraw",
          functionArgs: [Cl.uint(amount), Cl.stringAscii(assetId)],
          network: networkName,
          postConditionMode: "deny",
          postConditions,
        });
        if (response && "txid" in response) {
          tx.success(response.txid as string);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
        queryClient.invalidateQueries({ queryKey: ["balances"] });
        queryClient.invalidateQueries({ queryKey: ["lender-deposit"] });
        return true;
      } catch (err: unknown) {
        tx.error(err instanceof Error ? err.message : "Withdrawal failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [queryClient, tx, networkName]
  );

  return { withdraw, loading };
}
