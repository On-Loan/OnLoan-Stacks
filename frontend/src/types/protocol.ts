export interface PoolStats {
  assetId: string;
  totalDeposits: bigint;
  totalBorrows: bigint;
  totalReserves: bigint;
  utilizationRate: number;
  supplyApy: number;
  borrowApy: number;
}

export interface CollateralPosition {
  user: string;
  collateralType: string;
  collateralAmount: bigint;
  borrowedAmount: bigint;
  depositBlock: number;
  lastInterestBlock: number;
  isActive: boolean;
  healthFactor: number;
  ltvRatio: number;
  collateralValueUsd: number;
}

export interface BorrowQuote {
  collateralValueUsd: bigint;
  maxBorrowableUsdcx: bigint;
  currentLtv: number;
  healthFactor: number;
  oraclePrice: bigint;
  assetLtvLimit: number;
}

export interface AssetConfig {
  maxLtv: number;
  liquidationThreshold: number;
  liquidationBonus: number;
  minCollateral: bigint;
  isActive: boolean;
  isCollateralEnabled: boolean;
  isBorrowEnabled: boolean;
}

export type HealthFactorStatus = "healthy" | "caution" | "at-risk" | "liquidatable";

export function getHealthFactorStatus(hf: number): HealthFactorStatus {
  if (hf >= 1.5) return "healthy";
  if (hf >= 1.2) return "caution";
  if (hf >= 1.0) return "at-risk";
  return "liquidatable";
}
