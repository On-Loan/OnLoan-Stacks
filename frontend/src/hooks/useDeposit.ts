"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { request } from "@stacks/connect";
import { Cl, Pc } from "@stacks/transactions";
import { DEPLOYER, SBTC_CONTRACT, USDCX_CONTRACT } from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";
import { useTransactionToast } from "@/components/common/TransactionToast";
import { useNetwork } from "@/providers/NetworkProvider";
import { useWallet } from "@/providers/WalletProvider";

export function useDeposit() {
  const queryClient = useQueryClient();
  const tx = useTransactionToast();
  const { networkName } = useNetwork();
  const { stxAddress } = useWallet();
  const [loading, setLoading] = useState(false);

  const deposit = useCallback(
    async (amount: bigint, assetId: string): Promise<boolean> => {
      setLoading(true);
      try {
        tx.pending(`Depositing ${assetId.toUpperCase()}...`);

        const postConditions = !stxAddress
          ? []
          : assetId === "stx"
            ? [Pc.principal(stxAddress).willSendEq(amount).ustx()]
            : assetId === "sbtc"
              ? [
                  Pc.principal(stxAddress)
                    .willSendEq(amount)
                    .ft(SBTC_CONTRACT as `${string}.${string}`, "sbtc-token"),
                ]
              : assetId === "usdcx"
                ? [
                    Pc.principal(stxAddress)
                      .willSendEq(amount)
                      .ft(USDCX_CONTRACT as `${string}.${string}`, "usdcx-token"),
                  ]
                : [];

        const response = await request("stx_callContract", {
          contract: `${DEPLOYER}.lending-pool-v2`,
          functionName: "deposit",
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
        tx.error(err instanceof Error ? err.message : "Deposit failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [queryClient, tx, networkName, stxAddress]
  );

  return { deposit, loading };
}
