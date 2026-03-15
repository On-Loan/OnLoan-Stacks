"use client";

import { useCallback, useState } from "react";
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";
import { DEPLOYER, PYTH_ENDPOINT, PYTH_BTC_USD_FEED, PYTH_STX_USD_FEED } from "@/lib/constants";
import { useTransactionToast } from "@/components/common/TransactionToast";
import { useNetwork } from "@/providers/NetworkProvider";

interface PythPrice {
  price: number;
  confidence: number;
  timestamp: number;
}

const FEED_MAP: Record<string, string> = {
  sbtc: PYTH_BTC_USD_FEED,
  stx: PYTH_STX_USD_FEED,
};

async function fetchPythPrice(assetId: string): Promise<PythPrice> {
  const feedId = FEED_MAP[assetId];
  if (!feedId) throw new Error(`No feed for ${assetId}`);

  const url = `${PYTH_ENDPOINT}/v2/updates/price/latest?ids[]=${feedId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch Pyth price");

  const json = await res.json();
  const parsed = json?.parsed;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("No price data");
  }

  const priceData = parsed[0].price;
  const rawPrice = Number(priceData.price);
  const expo = priceData.expo;

  // Normalize to 8 decimal places (contract uses u100000000)
  // Pyth returns price with expo (e.g. price=25400003, expo=-8 means $0.254)
  // We need price * 10^(8 + expo) to get the price in 8-decimal format
  const normalizedPrice = Math.round(rawPrice * Math.pow(10, 8 + expo));

  return {
    price: normalizedPrice,
    confidence: Math.max(Math.round(Math.abs(Number(priceData.conf ?? 1000))), 100),
    timestamp: Number(parsed[0].price.publish_time ?? Math.floor(Date.now() / 1000)),
  };
}

export function useUpdateOracle() {
  const tx = useTransactionToast();
  const { networkName } = useNetwork();
  const [loading, setLoading] = useState(false);

  const updatePrices = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch latest prices for STX and sBTC
      const [stxPrice, sbtcPrice] = await Promise.all([
        fetchPythPrice("stx"),
        fetchPythPrice("sbtc"),
      ]);

      // Update STX price
      tx.pending("Updating STX price oracle...");
      await request("stx_callContract", {
        contract: `${DEPLOYER}.pyth-oracle-adapter`,
        functionName: "update-price",
        functionArgs: [
          Cl.stringAscii("stx"),
          Cl.uint(stxPrice.price),
          Cl.uint(stxPrice.confidence),
          Cl.uint(stxPrice.timestamp),
        ],
        network: networkName,
        postConditionMode: "deny",
        postConditions: [],
      });

      // Update sBTC price
      tx.pending("Updating sBTC price oracle...");
      await request("stx_callContract", {
        contract: `${DEPLOYER}.pyth-oracle-adapter`,
        functionName: "update-price",
        functionArgs: [
          Cl.stringAscii("sbtc"),
          Cl.uint(sbtcPrice.price),
          Cl.uint(sbtcPrice.confidence),
          Cl.uint(sbtcPrice.timestamp),
        ],
        network: networkName,
        postConditionMode: "deny",
        postConditions: [],
      });

      // Update USDCx price (always $1 = 100000000 in 8-decimal format)
      tx.pending("Updating USDCx price oracle...");
      const response = await request("stx_callContract", {
        contract: `${DEPLOYER}.pyth-oracle-adapter`,
        functionName: "update-price",
        functionArgs: [
          Cl.stringAscii("usdcx"),
          Cl.uint(100000000),
          Cl.uint(10000),
          Cl.uint(Math.floor(Date.now() / 1000)),
        ],
        network: networkName,
        postConditionMode: "deny",
        postConditions: [],
      });

      if (response && "txid" in response) {
        tx.success(response.txid as string);
      }
    } catch (err: unknown) {
      tx.error(err instanceof Error ? err.message : "Oracle update failed");
    } finally {
      setLoading(false);
    }
  }, [tx, networkName]);

  return { updatePrices, loading };
}
