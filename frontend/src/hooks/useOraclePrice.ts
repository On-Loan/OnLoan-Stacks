"use client";

import { useQuery } from "@tanstack/react-query";
import {
  PYTH_ENDPOINT,
  PYTH_BTC_USD_FEED,
  PYTH_STX_USD_FEED,
  PYTH_USDC_USD_FEED,
} from "@/lib/constants";
import { queryKeys } from "@/lib/queryKeys";

const FEED_MAP: Record<string, string> = {
  sbtc: PYTH_BTC_USD_FEED,
  stx: PYTH_STX_USD_FEED,
  usdcx: PYTH_USDC_USD_FEED,
};

interface PythPriceData {
  price: string;
  expo: number;
}

async function fetchOraclePrice(assetId: string): Promise<number> {
  const feedId = FEED_MAP[assetId];
  if (!feedId) return 0;

  const url = `${PYTH_ENDPOINT}/v2/updates/price/latest?ids[]=${feedId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch oracle price");

  const json = await res.json();
  const parsed = json?.parsed;
  if (!Array.isArray(parsed) || parsed.length === 0) return 0;

  const priceData: PythPriceData = parsed[0].price;
  const price = Number(priceData.price);
  const expo = priceData.expo;
  return price * Math.pow(10, expo);
}

export function useOraclePrice(assetId: string) {
  return useQuery({
    queryKey: queryKeys.oracle.price(assetId),
    queryFn: () => fetchOraclePrice(assetId),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!FEED_MAP[assetId],
  });
}
