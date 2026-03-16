import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile @stacks packages: they ship CJS-only and @stacks/connect v8.x
  // uses npm-aliased v6 packages that need explicit handling
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
  turbopack: {
    resolveAlias: {
      "@stacks/transactions-v6": "@stacks/transactions-v6",
      "@stacks/network-v6": "@stacks/network-v6",
    },
  },
  webpack: (config) => {
    // Resolve npm-aliased v6 packages used internally by @stacks/connect
    config.resolve.alias = {
      ...config.resolve.alias,
      "@stacks/transactions-v6": require.resolve("@stacks/transactions-v6"),
      "@stacks/network-v6": require.resolve("@stacks/network-v6"),
    };
    // Polyfill/ignore Node.js builtins for browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      buffer: false,
    };
    return config;
  },
};

export default nextConfig;
