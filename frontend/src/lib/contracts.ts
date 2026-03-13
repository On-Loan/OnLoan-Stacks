import { Cl } from "@stacks/transactions";
import type { ClarityValue } from "@stacks/transactions";
import { DEPLOYER } from "./constants";

export function contractId(name: string): string {
  return `${DEPLOYER}.${name}`;
}

export function buildDepositArgs(
  amount: bigint,
  assetId: string
): ClarityValue[] {
  return [Cl.uint(amount), Cl.stringAscii(assetId)];
}

export function buildWithdrawArgs(
  amount: bigint,
  assetId: string
): ClarityValue[] {
  return [Cl.uint(amount), Cl.stringAscii(assetId)];
}

export function buildBorrowArgs(
  amount: bigint,
  collateralType: string
): ClarityValue[] {
  return [Cl.uint(amount), Cl.stringAscii(collateralType)];
}

export function buildRepayArgs(
  amount: bigint,
  collateralType: string
): ClarityValue[] {
  return [Cl.uint(amount), Cl.stringAscii(collateralType)];
}

export function buildDepositCollateralArgs(amount: bigint): ClarityValue[] {
  return [Cl.uint(amount)];
}

export function buildGetBorrowQuoteArgs(
  collateralType: string,
  amount: bigint
): ClarityValue[] {
  return [Cl.stringAscii(collateralType), Cl.uint(amount)];
}
