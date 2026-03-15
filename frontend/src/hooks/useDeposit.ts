"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { request } from "@stacks/connect";
import { Cl, Pc } from "@stacks/transactions";
import { DEPLOYER } from "@/lib/constants";
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

        const postConditions =
          assetId === "stx" && stxAddress
            ? [Pc.principal(stxAddress).willSendEq(amount).ustx()]
            : [];

        const response = await request("stx_callContract", {
          contract: `${DEPLOYER}.lending-pool`,
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
