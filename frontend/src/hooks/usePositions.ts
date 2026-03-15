"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import { DEPLOYER, NETWORK } from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";
import { cvField } from "@/lib/clarity";
import { useWallet } from "@/providers/WalletProvider";
import type { CollateralPosition } from "@/types/protocol";

const COLLATERAL_TYPES = ["sbtc", "stx"];

async function fetchPosition(
  user: string,
  collateralType: string
): Promise<CollateralPosition | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "collateral-manager",
      functionName: "get-position",
      functionArgs: [
        Cl.principal(user),
        Cl.stringAscii(collateralType),
      ],
      network: NETWORK as "mainnet" | "testnet" | "devnet",
      senderAddress: DEPLOYER,
    });

    const raw = cvToValue(result);
    if (raw && typeof raw === "object" && "value" in raw) {
      const v = raw.value as Record<string, unknown>;
      const collateralAmount = BigInt(cvField(v["collateral-amount"]));
      if (collateralAmount <= BigInt(0)) return null;

      let healthFactor = 2.0;
      try {
        const hfResult = await fetchCallReadOnlyFunction({
          contractAddress: DEPLOYER,
          contractName: "liquidation-engine",
          functionName: "get-health-factor",
          functionArgs: [
            Cl.principal(user),
            Cl.stringAscii(collateralType),
          ],
          network: NETWORK as "mainnet" | "testnet" | "devnet",
          senderAddress: DEPLOYER,
        });
        const hfRaw = cvToValue(hfResult);
        if (hfRaw && typeof hfRaw === "object" && "value" in hfRaw) {
          healthFactor = Number(cvField(hfRaw)) / 100;
        }
      } catch {
        // use default
      }

      return {
        user,
        collateralType,
        collateralAmount,
        borrowedAmount: BigInt(cvField(v["borrowed-amount"])),
        depositBlock: Number(cvField(v["deposit-block"])),
        lastInterestBlock: Number(cvField(v["last-interest-block"])),
        isActive: cvField(v["is-active"]) === "true",
        healthFactor,
        ltvRatio: Number(cvField(v["ltv-ratio"])) / 100,
        collateralValueUsd: Number(cvField(v["collateral-value-usd"])) / 1e6,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function usePositions() {
  const { stxAddress } = useWallet();

  return useQuery({
    queryKey: queryKeys.positions.all(stxAddress ?? ""),
    queryFn: async () => {
      if (!stxAddress) return [];
      const results = await Promise.all(
        COLLATERAL_TYPES.map((ct) => fetchPosition(stxAddress, ct))
      );
      return results.filter(
        (p): p is CollateralPosition => p !== null && p.isActive
      );
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!stxAddress,
  });
}
