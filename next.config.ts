import type { NextConfig } from "next";

import { PRODUCT_IMAGES_BUCKET } from "./lib/domain/product-images";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    remotePatterns: [
      ...(supabaseUrl
        ? [
            new URL(
              `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/**`,
              supabaseUrl,
            ),
          ]
        : []),
      ...(process.env.ALLOW_LEGACY_CLOUDINARY_IMAGES === "false"
        ? []
        : [{ protocol: "https" as const, hostname: "res.cloudinary.com" }]),
    ],
  },
};

export default nextConfig;
