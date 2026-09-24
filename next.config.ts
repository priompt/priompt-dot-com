import type { NextConfig } from "next"

// Static export for Cloudflare Pages: `next build` writes the whole site to `out/`.
// There is no Node.js image optimizer on Pages (no `sharp`). Two safe modes:
//   default              -> images.unoptimized (served as-is, works everywhere)
//   CF transform enabled -> custom loader hitting Cloudflare's /cdn-cgi/image/
// Flip with NEXT_PUBLIC_CF_IMAGE_TRANSFORM=1 once the zone has "Transformations".
const cfTransform = process.env.NEXT_PUBLIC_CF_IMAGE_TRANSFORM === "1"

const nextConfig: NextConfig = {
  output: "export",
  images: cfTransform
    ? {
        loader: "custom",
        loaderFile: "./lib/cloudflare-image-loader.ts",
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
          {
            protocol: "https",
            hostname: "deifkwefumgah.cloudfront.net",
          },
        ],
      }
    : {
        // Pass-through: no optimizer required, no missing-loader-width warning.
        unoptimized: true,
        remotePatterns: [
          {
            protocol: "https",
            hostname: "deifkwefumgah.cloudfront.net",
          },
        ],
      },
}

export default nextConfig
