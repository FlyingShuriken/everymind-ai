import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: "30mb",
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
