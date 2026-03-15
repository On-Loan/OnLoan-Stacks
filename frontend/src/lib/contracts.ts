import { uintCV, stringAsciiCV } from "@stacks/transactions";
import type { ClarityValue } from "@stacks/transactions";
import { DEPLOYER } from "./constants";

export function contractId(name: string): string {
  return `${DEPLOYER}.${name}`;
}

export function buildDepositArgs(
  amount: bigint,
  assetId: string
): ClarityValue[] {
  return [uintCV(amount), stringAsciiCV(assetId)];
}

export function buildWithdrawArgs(
  amount: bigint,
  assetId: string
): ClarityValue[] {
  return [uintCV(amount), stringAsciiCV(assetId)];
}

export function buildBorrowArgs(
  amount: bigint,
  collateralType: string
): ClarityValue[] {
  return [uintCV(amount), stringAsciiCV(collateralType)];
}

export function buildRepayArgs(
  amount: bigint,
  collateralType: string
): ClarityValue[] {
  return [uintCV(amount), stringAsciiCV(collateralType)];
}

export function buildDepositCollateralArgs(amount: bigint): ClarityValue[] {
  return [uintCV(amount)];
}

export function buildGetBorrowQuoteArgs(
  collateralType: string,
  amount: bigint
): ClarityValue[] {
  return [stringAsciiCV(collateralType), uintCV(amount)];
}
