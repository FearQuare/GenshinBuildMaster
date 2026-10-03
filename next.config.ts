import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let phones on the home network use the dev server (JS + hot reload) via the Mac's LAN IP.
  // Dev-only; ignored by `next build`.
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
