import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow up to 5 photos per inspection (camera photos can be several MB each).
      bodySizeLimit: "40mb",
    },
  },
};

export default nextConfig;
