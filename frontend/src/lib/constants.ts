export const DEPLOYER =
  process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER ??
  "ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV";

export const SBTC_CONTRACT =
  process.env.NEXT_PUBLIC_SBTC_CONTRACT ??
  "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token";

export const USDCX_CONTRACT =
  process.env.NEXT_PUBLIC_USDCX_CONTRACT ??
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx";

export const NETWORK = process.env.NEXT_PUBLIC_NETWORK ?? "testnet";

export const PYTH_ENDPOINT =
  process.env.NEXT_PUBLIC_PYTH_ENDPOINT ?? "https://hermes.pyth.network";

export const PYTH_BTC_USD_FEED =
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

export const PYTH_STX_USD_FEED =
  "0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17";

export const PYTH_USDC_USD_FEED =
  "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";

export const ASSETS = {
  sbtc: {
    name: "sBTC",
    symbol: "sBTC",
    decimals: 8,
    icon: "/icons/sbtc.svg",
  },
  stx: {
    name: "STX",
    symbol: "STX",
    decimals: 6,
    icon: "/icons/stx.svg",
  },
  usdcx: {
    name: "USDCx",
    symbol: "USDCx",
    decimals: 6,
    icon: "/icons/usdcx.svg",
  },
} as const;

export type AssetId = keyof typeof ASSETS;
