import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: "30mb",
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
