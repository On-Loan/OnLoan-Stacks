"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import { DEPLOYER, NETWORK, type AssetId } from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";
import { cvField } from "@/lib/clarity";
import type { PoolStats } from "@/types/protocol";

const POOL_ASSETS: AssetId[] = ["stx", "sbtc", "usdcx"];

async function fetchPoolStats(assetId: string): Promise<PoolStats> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "lending-pool",
      functionName: "get-pool-stats",
      functionArgs: [Cl.stringAscii(assetId)],
      network: NETWORK as "mainnet" | "testnet" | "devnet",
      senderAddress: DEPLOYER,
    });

    const raw = cvToValue(result);
    if (raw && typeof raw === "object" && "value" in raw) {
      const v = raw.value as Record<string, unknown>;
      const totalDeposits = BigInt(cvField(v["total-deposits"]));
      const totalBorrows = BigInt(cvField(v["total-borrows"]));
      const utilization =
        totalDeposits > BigInt(0)
          ? Number((totalBorrows * BigInt(10000)) / totalDeposits) / 100
          : 0;
      return {
        assetId,
        totalDeposits,
        totalBorrows,
        totalReserves: BigInt(cvField(v["total-reserves"])),
        utilizationRate: utilization,
        supplyApy: utilization * 0.03,
        borrowApy: utilization * 0.05,
      };
    }
  } catch {
    // noop
  }

  return {
    assetId,
    totalDeposits: BigInt(0),
    totalBorrows: BigInt(0),
    totalReserves: BigInt(0),
    utilizationRate: 0,
    supplyApy: 0,
    borrowApy: 0,
  };
}

export function usePoolStats() {
  return useQuery({
    queryKey: queryKeys.pools.all,
    queryFn: async () => {
      const results = await Promise.all(
        POOL_ASSETS.map((id) => fetchPoolStats(id))
      );
      return results;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function usePoolStatsForAsset(assetId: string) {
  return useQuery({
    queryKey: queryKeys.pools.stats(assetId),
    queryFn: () => fetchPoolStats(assetId),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
