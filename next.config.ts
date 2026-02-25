import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: "30mb",
    serverActions: {
      allowedOrigins: ["q8ptjfxn-3000.asse.devtunnels.ms", "localhost:3000"],
    },
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
