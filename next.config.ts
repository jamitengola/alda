import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["http://localhost:3000", "http://localhost:3456", "http://127.0.0.1:3000", "http://127.0.0.1:3456"],
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
