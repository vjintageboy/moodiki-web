import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the root to avoid Next.js inferring a parent folder with a lockfile.
    root: __dirname,
  },
};

export default nextConfig;
