"use client"

/**
 * Custom image loader for `next/image`, chosen so the site is safe to run on
 * Cloudflare Workers.
 *
 * Why a custom loader at all: Cloudflare Workers has no Node.js image server
 * (no `sharp`), so Next.js's built-in Image Optimization API cannot run there.
 * A `custom` loader lets `next/image` work without that optimizer.
 *
 * Default behavior: return the original `src` untouched (equivalent to
 * "unoptimized"). Plain image URLs are served directly, which works in every
 * environment — local `next dev`, `next start`, Cloudflare Pages, and
 * Cloudflare Workers — with zero image infrastructure. This is the safe
 * default and is why the loader does NOT rewrite URLs unless explicitly told
 * to.
 *
 * Opt-in edge transformation: set NEXT_PUBLIC_CF_IMAGE_TRANSFORM=1 to route
 * images through Cloudflare's on-the-fly transformation endpoint
 * (`/cdn-cgi/image/...`), which resizes and re-encodes (AVIF/WebP via
 * `format=auto`) at the edge. Only enable this once "Transformations" (Image
 * Resizing) is enabled for the Cloudflare zone — otherwise `/cdn-cgi/image/`
 * paths 404 and images disappear.
 *
 * Docs: https://developers.cloudflare.com/images/transform-images
 */
const CF_TRANSFORM_ENABLED =
  process.env.NEXT_PUBLIC_CF_IMAGE_TRANSFORM === "1"

export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  // Data/blob URLs and the safe default: serve the original source untouched.
  if (
    !CF_TRANSFORM_ENABLED ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src
  }

  const params = [`width=${width}`, `quality=${quality || 75}`, "format=auto"]
  // `src` may be a root-relative path ("/images/x.png") or an absolute URL.
  // Strip a leading slash so the joined path has exactly one separator.
  const target = src.startsWith("/") ? src.slice(1) : src
  return `/cdn-cgi/image/${params.join(",")}/${target}`
}
