export const queryKeys = {
  pools: {
    all: ["pools"] as const,
    stats: (assetId: string) => ["pools", "stats", assetId] as const,
    userBalance: (address: string, assetId: string) =>
      ["pools", "balance", address, assetId] as const,
  },
  positions: {
    all: (address: string) => ["positions", address] as const,
    single: (address: string, asset: string) =>
      ["positions", address, asset] as const,
  },
  oracle: {
    price: (assetId: string) => ["oracle", "price", assetId] as const,
  },
  quotes: {
    borrow: (asset: string, amount: string) =>
      ["quotes", "borrow", asset, amount] as const,
  },
} as const;
