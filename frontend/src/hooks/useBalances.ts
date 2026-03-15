"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import { DEPLOYER, NETWORK, SBTC_CONTRACT, USDCX_CONTRACT } from "@/lib/constants";
import { getApiUrl } from "@/lib/stacks";
import { cvField } from "@/lib/clarity";
import { useWallet } from "@/providers/WalletProvider";

interface Balances {
  stx: bigint;
  sbtc: bigint;
  usdcx: bigint;
}

interface LenderDeposit {
  amount: bigint;
  depositBlock: number;
}

async function fetchStxBalance(address: string): Promise<bigint> {
  const url = `${getApiUrl()}/extended/v1/address/${address}/stx`;
  const res = await fetch(url);
  if (!res.ok) return BigInt(0);
  const json = await res.json();
  return BigInt(json.balance ?? "0");
}

async function fetchFtBalance(
  address: string,
  tokenContract: string
): Promise<bigint> {
  try {
    const url = `${getApiUrl()}/extended/v1/address/${address}/balances`;
    const res = await fetch(url);
    if (!res.ok) return BigInt(0);
    const json = await res.json();
    const ftBalances = json?.fungible_tokens ?? {};
    const key = Object.keys(ftBalances).find((k) =>
      k.includes(tokenContract)
    );
    if (key) return BigInt(ftBalances[key].balance ?? "0");
    return BigInt(0);
  } catch {
    return BigInt(0);
  }
}

async function fetchLenderDeposit(
  address: string,
  assetId: string
): Promise<LenderDeposit> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "lending-pool-v2",
      functionName: "get-lender-balance",
      functionArgs: [Cl.principal(address), Cl.stringAscii(assetId)],
      network: NETWORK as "mainnet" | "testnet" | "devnet",
      senderAddress: DEPLOYER,
    });
    const raw = cvToValue(result);
    if (raw && typeof raw === "object" && "value" in raw) {
      const v = raw.value as Record<string, unknown>;
      return {
        amount: BigInt(cvField(v["amount"])),
        depositBlock: Number(cvField(v["deposit-block"])),
      };
    }
  } catch {
    // no deposit
  }
  return { amount: BigInt(0), depositBlock: 0 };
}

export function useBalances() {
  const { stxAddress } = useWallet();

  return useQuery({
    queryKey: ["balances", stxAddress],
    queryFn: async (): Promise<Balances> => {
      if (!stxAddress) return { stx: BigInt(0), sbtc: BigInt(0), usdcx: BigInt(0) };
      const [stx, sbtc, usdcx] = await Promise.all([
        fetchStxBalance(stxAddress),
        fetchFtBalance(stxAddress, SBTC_CONTRACT),
        fetchFtBalance(stxAddress, USDCX_CONTRACT),
      ]);
      return { stx, sbtc, usdcx };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: !!stxAddress,
  });
}

export function useLenderDeposit(assetId: string) {
  const { stxAddress } = useWallet();

  return useQuery({
    queryKey: ["lender-deposit", stxAddress, assetId],
    queryFn: () => fetchLenderDeposit(stxAddress!, assetId),
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: !!stxAddress,
  });
}
