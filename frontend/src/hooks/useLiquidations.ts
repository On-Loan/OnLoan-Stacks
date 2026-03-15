"use client";

import { useQuery } from "@tanstack/react-query";
import { principalCV, stringAsciiCV } from "@stacks/transactions";
import { DEPLOYER } from "@/lib/constants";
import { cvField } from "@/lib/clarity";
import { getApiUrl, callReadOnlyValue } from "@/lib/stacks";

interface LiquidatablePosition {
  borrower: string;
  collateralType: string;
  collateralAmount: bigint;
  borrowedAmount: bigint;
  healthFactor: number;
  liquidationBonus: number;
}

const KNOWN_BORROWERS_KEY = ["liquidations", "all"] as const;

const API_URL = getApiUrl();

async function discoverBorrowers(): Promise<string[]> {
  try {
    const url = `${API_URL}/extended/v1/contract/${DEPLOYER}.collateral-manager-v2/events?limit=50`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const events = json?.results;
    if (!Array.isArray(events)) return [];

    const senders = new Set<string>();
    for (const ev of events) {
      if (ev?.contract_log?.value?.repr) {
        // Extract principal from event data if present
        const repr: string = ev.contract_log.value.repr;
        const match = repr.match(/ST[A-Z0-9]{38,}/);
        if (match) senders.add(match[0]);
      }
      // Also check tx_sender from the transaction
      if (ev?.tx_id) {
        try {
          const txRes = await fetch(`${API_URL}/extended/v1/tx/${ev.tx_id}`);
          if (txRes.ok) {
            const txJson = await txRes.json();
            if (txJson?.sender_address) senders.add(txJson.sender_address);
          }
        } catch {
          // skip
        }
      }
    }
    return Array.from(senders);
  } catch {
    return [];
  }
}

async function checkLiquidatable(
  borrower: string,
  collateralType: string
): Promise<LiquidatablePosition | null> {
  try {
    const result = await callReadOnlyValue({
      contractAddress: DEPLOYER,
      contractName: "liquidation-engine-v2",
      functionName: "is-liquidatable",
      functionArgs: [
        principalCV(borrower),
        stringAsciiCV(collateralType),
      ],
      senderAddress: DEPLOYER,
    });

    const raw = result;
    const isLiquidatable =
      raw === true || (typeof raw === "object" && raw !== null && "value" in raw && raw.value === true);

    if (!isLiquidatable) return null;

    const posRaw = await callReadOnlyValue({
      contractAddress: DEPLOYER,
      contractName: "collateral-manager-v2",
      functionName: "get-position",
      functionArgs: [
        principalCV(borrower),
        stringAsciiCV(collateralType),
      ],
      senderAddress: DEPLOYER,
    });

    if (posRaw && typeof posRaw === "object" && "value" in posRaw) {
      const v = posRaw.value as Record<string, unknown>;
      return {
        borrower,
        collateralType,
        collateralAmount: BigInt(cvField(v["collateral-amount"])),
        borrowedAmount: BigInt(cvField(v["borrowed-amount"])),
        healthFactor: Number(cvField(v["health-factor"])) / 100,
        liquidationBonus: 10,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function useLiquidations() {
  return useQuery({
    queryKey: KNOWN_BORROWERS_KEY,
    queryFn: async (): Promise<LiquidatablePosition[]> => {
      const borrowers = await discoverBorrowers();
      const collateralTypes = ["sbtc", "stx"];

      const checks = borrowers.flatMap((b) =>
        collateralTypes.map((ct) => checkLiquidatable(b, ct))
      );

      const results = await Promise.all(checks);
      return results.filter(
        (p): p is LiquidatablePosition => p !== null
      );
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export type { LiquidatablePosition };
