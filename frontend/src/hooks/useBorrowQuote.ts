"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import { DEPLOYER, NETWORK } from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";
import { cvField } from "@/lib/clarity";
import { useDebounce } from "@/hooks/useDebounce";
import type { BorrowQuote } from "@/types/protocol";

async function fetchBorrowQuote(
  collateralAsset: string,
  amount: bigint
): Promise<BorrowQuote | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "collateral-manager",
      functionName: "get-borrow-quote",
      functionArgs: [Cl.stringAscii(collateralAsset), Cl.uint(amount)],
      network: NETWORK as "mainnet" | "testnet" | "devnet",
      senderAddress: DEPLOYER,
    });

    const raw = cvToValue(result);
    if (raw && typeof raw === "object" && "value" in raw) {
      const v = raw.value as Record<string, unknown>;
      return {
        collateralValueUsd: BigInt(cvField(v["collateral-value-usd"])),
        maxBorrowableUsdcx: BigInt(cvField(v["max-borrowable-usdcx"])),
        currentLtv: Number(cvField(v["current-ltv"])) / 100,
        healthFactor: Number(cvField(v["health-factor"])) / 100,
        oraclePrice: BigInt(cvField(v["oracle-price"])),
        assetLtvLimit: Number(cvField(v["asset-ltv-limit"])) / 100,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function useBorrowQuote(
  collateralAsset: "sbtc" | "stx",
  amount: bigint
) {
  const debouncedAmount = useDebounce(amount, 300);

  return useQuery({
    queryKey: queryKeys.quotes.borrow(
      collateralAsset,
      debouncedAmount.toString()
    ),
    queryFn: () => fetchBorrowQuote(collateralAsset, debouncedAmount),
    staleTime: 10_000,
    enabled: debouncedAmount > BigInt(0),
  });
}
