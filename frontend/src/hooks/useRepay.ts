"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";
import { DEPLOYER } from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";
import { useTransactionToast } from "@/components/common/TransactionToast";
import { useNetwork } from "@/providers/NetworkProvider";
import { useWallet } from "@/providers/WalletProvider";

export function useRepay() {
  const queryClient = useQueryClient();
  const tx = useTransactionToast();
  const { networkName } = useNetwork();
  const { stxAddress } = useWallet();
  const [loading, setLoading] = useState(false);

  const repay = useCallback(
    async (amount: bigint, collateralType: string) => {
      setLoading(true);
      try {
        tx.pending("Repaying USDCx...");
        const response = await request("stx_callContract", {
          contract: `${DEPLOYER}.collateral-manager`,
          functionName: "repay",
          functionArgs: [Cl.uint(amount), Cl.stringAscii(collateralType)],
          network: networkName,
          postConditionMode: "deny",
          postConditions: [],
        });
        if (response && "txid" in response) {
          tx.success(response.txid as string);
        }
        if (stxAddress) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.positions.all(stxAddress),
          });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
      } catch (err: unknown) {
        tx.error(err instanceof Error ? err.message : "Repay failed");
      } finally {
        setLoading(false);
      }
    },
    [queryClient, tx, networkName, stxAddress]
  );

  return { repay, loading };
}
