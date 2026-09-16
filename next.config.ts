import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * A self-contained server bundle, so the runtime image needs neither the
   * sources nor node_modules — just node and the native sqlite binding.
   */
  output: "standalone",
  // better-sqlite3 is a native addon; tracing it breaks the .node binary.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
