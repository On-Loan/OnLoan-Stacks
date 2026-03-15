import { ASSETS, type AssetId } from "./constants";

export function formatAmount(
  value: bigint,
  assetId: AssetId,
  maxDecimals?: number
): string {
  const { decimals, symbol } = ASSETS[assetId];
  const divisor = 10 ** decimals;
  const num = Number(value) / divisor;
  const dp = maxDecimals ?? (decimals > 6 ? 4 : 2);
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: dp })} ${symbol}`;
}

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
