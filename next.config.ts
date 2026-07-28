import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 uses native Node.js bindings
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
