"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import {
  DEPLOYER,
  NETWORK,
  PYTH_ENDPOINT,
  PYTH_BTC_USD_FEED,
  PYTH_STX_USD_FEED,
  ASSETS,
} from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";
import { cvField } from "@/lib/clarity";
import { useDebounce } from "@/hooks/useDebounce";
import type { BorrowQuote } from "@/types/protocol";

// Asset LTV configs matching on-chain onloan-core-v2
const ASSET_LTV: Record<string, number> = { sbtc: 7500, stx: 6000 };
const PYTH_FEED: Record<string, string> = {
  sbtc: PYTH_BTC_USD_FEED,
  stx: PYTH_STX_USD_FEED,
};

async function fetchOnChainQuote(
  collateralAsset: string,
  amount: bigint
): Promise<BorrowQuote | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "collateral-manager-v2",
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
    // on-chain oracle may not have prices yet; fall through
  }
  return null;
}

async function fetchClientSideQuote(
  collateralAsset: string,
  amount: bigint
): Promise<BorrowQuote | null> {
  const feedId = PYTH_FEED[collateralAsset];
  if (!feedId) return null;

  const res = await fetch(
    `${PYTH_ENDPOINT}/v2/updates/price/latest?ids[]=${feedId}`
  );
  if (!res.ok) return null;
  const json = await res.json();
  const parsed = json?.parsed;
  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  const priceData = parsed[0].price;
  const rawPrice = Number(priceData.price);
  const expo = priceData.expo as number;

  // Convert to 8-decimal uint format matching contract (u100000000 = $1)
  const oraclePrice8d = BigInt(Math.round(rawPrice * Math.pow(10, 8 + expo)));

  const decimals = ASSETS[collateralAsset as keyof typeof ASSETS]?.decimals ?? 6;
  // Match contract math: collateral-value-usd = amount * price / 1e8
  // amount is in asset decimals, price is in 8-decimal USD
  const collateralValueUsd =
    (amount * oraclePrice8d) / BigInt(10 ** decimals);

  const maxLtv = BigInt(ASSET_LTV[collateralAsset] ?? 0);
  const maxBorrowableUsdcx = (collateralValueUsd * maxLtv) / BigInt(10000);

  return {
    collateralValueUsd,
    maxBorrowableUsdcx,
    currentLtv: Number(maxLtv) / 100,
    healthFactor: 100,
    oraclePrice: oraclePrice8d,
    assetLtvLimit: Number(maxLtv) / 100,
  };
}

async function fetchBorrowQuote(
  collateralAsset: string,
  amount: bigint
): Promise<BorrowQuote | null> {
  // Try on-chain first, fall back to Pyth API client-side calculation
  const onChain = await fetchOnChainQuote(collateralAsset, amount);
  if (onChain) return onChain;
  return fetchClientSideQuote(collateralAsset, amount);
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
