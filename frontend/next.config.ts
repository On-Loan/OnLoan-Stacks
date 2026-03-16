import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile @stacks packages so Turbopack can handle CJS→ESM conversion
  // @stacks/connect v8.x uses npm-aliased CJS-only v6 packages internally
  transpilePackages: [
    "@stacks/connect",
    "@stacks/connect-ui",
    "@stacks/transactions",
    "@stacks/network",
    "@stacks/common",
    "@stacks/encryption",
    "@stacks/auth",
    "@stacks/wallet-sdk",
  ],
  // Help Turbopack resolve the npm-aliased v6 packages that @stacks/connect uses
  turbopack: {
    resolveAlias: {
      "@stacks/transactions-v6": "@stacks/transactions-v6",
      "@stacks/network-v6": "@stacks/network-v6",
    },
  },
};

export default nextConfig;
