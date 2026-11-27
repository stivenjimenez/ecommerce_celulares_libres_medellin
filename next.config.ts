import type { NextConfig } from "next";

import { getR2PublicBaseUrl } from "./lib/media/public-assets";

const r2PublicBaseUrl = getR2PublicBaseUrl();

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // TODO: Configure the custom domain in Cloudflare or use an *.r2.dev public URL.
      { protocol: "https", hostname: "media.celulareslibresmedellin.co" },
      { protocol: "https", hostname: "*.r2.dev" },
      ...(r2PublicBaseUrl ? [new URL(`${r2PublicBaseUrl}/**`)] : []),
    ],
  },
};

export default nextConfig;
