import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "qianwen-res.oss-cn-beijing.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "www.aokitech.com.ar",
      },
    ],
  },
};

export default nextConfig;
