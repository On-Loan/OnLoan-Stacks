"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { request } from "@stacks/connect";
import { Cl, Pc } from "@stacks/transactions";
import { DEPLOYER, SBTC_CONTRACT } from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";
import { useTransactionToast } from "@/components/common/TransactionToast";
import { useNetwork } from "@/providers/NetworkProvider";
import { useWallet } from "@/providers/WalletProvider";

export function useBorrow() {
  const queryClient = useQueryClient();
  const tx = useTransactionToast();
  const { networkName } = useNetwork();
  const { stxAddress } = useWallet();
  const [loading, setLoading] = useState(false);

  const depositAndBorrow = useCallback(
    async (
      collateralAsset: "sbtc" | "stx",
      collateralAmount: bigint,
      borrowAmount: bigint
    ) => {
      setLoading(true);
      try {
        tx.pending("Depositing collateral...");
        const depositFn =
          collateralAsset === "sbtc"
            ? "deposit-collateral-sbtc"
            : "deposit-collateral-stx";

        const collateralPostConditions =
          collateralAsset === "stx"
            ? [Pc.principal(stxAddress!).willSendEq(collateralAmount).ustx()]
            : [
                Pc.principal(stxAddress!)
                  .willSendEq(collateralAmount)
                  .ft(
                    SBTC_CONTRACT as `${string}.${string}`,
                    "sbtc-token"
                  ),
              ];

        await request("stx_callContract", {
          contract: `${DEPLOYER}.collateral-manager`,
          functionName: depositFn,
          functionArgs: [Cl.uint(collateralAmount)],
          network: networkName,
          postConditionMode: "deny",
          postConditions: collateralPostConditions,
        });

        tx.pending("Borrowing USDCx...");
        const response = await request("stx_callContract", {
          contract: `${DEPLOYER}.collateral-manager`,
          functionName: "borrow",
          functionArgs: [
            Cl.uint(borrowAmount),
            Cl.stringAscii(collateralAsset),
          ],
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
        tx.error(err instanceof Error ? err.message : "Borrow failed");
      } finally {
        setLoading(false);
      }
    },
    [queryClient, tx, networkName, stxAddress]
  );

  const borrowOnly = useCallback(
    async (borrowAmount: bigint, collateralAsset: "sbtc" | "stx") => {
      setLoading(true);
      try {
        tx.pending("Borrowing USDCx...");
        const response = await request("stx_callContract", {
          contract: `${DEPLOYER}.collateral-manager`,
          functionName: "borrow",
          functionArgs: [
            Cl.uint(borrowAmount),
            Cl.stringAscii(collateralAsset),
          ],
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
        tx.error(err instanceof Error ? err.message : "Borrow failed");
      } finally {
        setLoading(false);
      }
    },
    [queryClient, tx, networkName, stxAddress]
  );

  return { depositAndBorrow, borrowOnly, loading };
}
