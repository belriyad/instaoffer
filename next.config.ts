import type { NextConfig } from "next";

// Backend API base (used by the /api/proxy route too). Uploaded photos are served
// from the backend ORIGIN ROOT at /uploads/*, outside the /api prefix, so they
// can't go through /api/proxy. Rewrite /uploads/* to the backend root instead.
const BACKEND_API = process.env.API_BASE_URL || "http://174.165.78.29:8090/api";
const BACKEND_ROOT = BACKEND_API.replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DEPLOY_TIME: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
  },
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: `${BACKEND_ROOT}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
