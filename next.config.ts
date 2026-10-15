import type { NextConfig } from "next";
import path from "node:path";

// Cloudflare/Vinext continues to use lib/api.ts and its native D1/R2 bindings.
// Only the explicit Next.js build replaces the API entry with the server proxy.
const vercel = process.env.BOTSTORE_RUNTIME === "vercel" || process.env.VERCEL === "1";
const nextConfig: NextConfig = vercel ? {
  distDir: ".next-vercel",
  env: { BOTSTORE_RUNTIME: "vercel" },
  webpack(config, { webpack }) {
    // Next's tsconfig paths plugin can resolve @/* before resolve.alias.
    // Replace the resolved API module itself so no Cloudflare import is traced.
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(
      /^@\/lib\/api$/,
      (resource:{request:string}) => { resource.request = path.resolve("lib/vercel-api.ts"); },
    ));
    return config;
  },
} : {};

export default nextConfig;
