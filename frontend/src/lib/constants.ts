export const DEPLOYER =
  process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER ??
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

export const SBTC_CONTRACT =
  process.env.NEXT_PUBLIC_SBTC_CONTRACT ??
  "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";

export const NETWORK = process.env.NEXT_PUBLIC_NETWORK ?? "devnet";

export const PYTH_ENDPOINT =
  process.env.NEXT_PUBLIC_PYTH_ENDPOINT ?? "https://hermes.pyth.network";

export const PYTH_BTC_USD_FEED =
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

export const PYTH_STX_USD_FEED =
  "0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17";

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
