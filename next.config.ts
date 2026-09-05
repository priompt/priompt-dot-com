import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Cloudflare Workers has no Node.js image optimizer (no `sharp`), so we use
    // a `custom` loader instead of the built-in Image Optimization API.
    //
    // The loader's default is a pass-through (serves the original src), so
    // images work everywhere — local dev, `next start`, and Cloudflare — out of
    // the box. Set NEXT_PUBLIC_CF_IMAGE_TRANSFORM=1 to enable edge resizing/
    // format conversion via Cloudflare's /cdn-cgi/image/ endpoint, but only
    // after "Transformations" is enabled on the zone.
    loader: "custom",
    loaderFile: "./lib/cloudflare-image-loader.ts",
    formats: ["image/avif", "image/webp"],
    // Allow next/image to reference the shadcnblocks demo CDN used in a few
    // marketing sections (without this, next/image throws on remote hosts).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "deifkwefumgah.cloudfront.net",
      },
    ],
  },
}

export default nextConfig
