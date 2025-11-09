import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      {
        hostname: "*.supabase.co",
        protocol: "https",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
