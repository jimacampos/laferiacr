import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for a minimal production container image (Azure Container Apps).
  output: "standalone",
  // Keep the Prisma driver adapter and pg out of the Server Components bundle.
  serverExternalPackages: ["@prisma/adapter-pg", "@prisma/client", "pg"],
};

export default nextConfig;
