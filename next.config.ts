import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.217", "127.0.0.1"],
  cacheComponents: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  partialPrefetching: true,
  experimental: {
    inlineCss: true,
  },
};

export default nextConfig;
