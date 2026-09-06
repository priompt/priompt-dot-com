import type { NextConfig } from "next"

// Cloudflare Workers has no Node.js image optimizer (no `sharp`). Two safe modes:
//   default              -> images.unoptimized (served as-is, works everywhere)
//   CF transform enabled -> custom loader hitting Cloudflare's /cdn-cgi/image/
// Flip with NEXT_PUBLIC_CF_IMAGE_TRANSFORM=1 once the zone has "Transformations".
const cfTransform = process.env.NEXT_PUBLIC_CF_IMAGE_TRANSFORM === "1"

const nextConfig: NextConfig = {
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

// Enables Cloudflare bindings (and OpenNext integration) during local
// `next dev`. Harmless in production builds. See:
// https://opennext.js.org/cloudflare/get-started
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"
initOpenNextCloudflareForDev()
