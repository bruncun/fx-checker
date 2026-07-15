import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  cacheComponents: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  partialPrefetching: true,
  reactCompiler: true,
  experimental: {
    inlineCss: true,
    staleTimes: {
      dynamic: 300,
    },
  },
};

export default nextConfig;
