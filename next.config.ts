import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DEPLOY_TIME: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
  },
};

export default nextConfig;
