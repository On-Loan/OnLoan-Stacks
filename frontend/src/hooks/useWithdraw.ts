"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { request } from "@stacks/connect";
import { uintCV, stringAsciiCV, Pc } from "@stacks/transactions";
import { DEPLOYER, SBTC_CONTRACT, USDCX_CONTRACT } from "@/lib/constants";
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

        // The contract (as-contract) sends assets back to the user
        const poolPrincipal = `${DEPLOYER}.lending-pool-v2` as `${string}.${string}`;
        const postConditions =
          assetId === "stx"
            ? [
                Pc.principal(poolPrincipal)
                  .willSendEq(amount)
                  .ustx(),
              ]
            : assetId === "sbtc"
              ? [
                  Pc.principal(poolPrincipal)
                    .willSendEq(amount)
                    .ft(SBTC_CONTRACT as `${string}.${string}`, "sbtc-token"),
                ]
              : assetId === "usdcx"
                ? [
                    Pc.principal(poolPrincipal)
                      .willSendEq(amount)
                      .ft(USDCX_CONTRACT as `${string}.${string}`, "usdcx-token"),
                  ]
                : [];

        const response = await request("stx_callContract", {
          contract: `${DEPLOYER}.lending-pool-v2`,
          functionName: "withdraw",
          functionArgs: [uintCV(amount), stringAsciiCV(assetId)],
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
