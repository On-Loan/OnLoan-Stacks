import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/stacks/:path*",
        destination: "https://api.testnet.hiro.so/:path*",
      },
    ];
  },
};

export default nextConfig;
