import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
  },
  async rewrites() {
    return [
      {
        source: '/AI',
        destination: '/ai',
      },
      {
        source: '/MATH',
        destination: '/math',
      },
      {
        source: '/ALPHABET',
        destination: '/alphabet',
      },
      {
        source: '/PROFILE',
        destination: '/profile',
      },
      {
        source: '/MISTAKES',
        destination: '/mistakes',
      }
    ]
  },
};

export default nextConfig;
