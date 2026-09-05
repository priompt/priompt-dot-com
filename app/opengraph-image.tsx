import { ImageResponse } from "next/og"

import { site } from "@/lib/site"

// Route segment config
export const alt = site.ogImageAlt
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Dynamically generated social share image. Rendered at build time for the
// static home route, so no runtime cost. Only flexbox + a CSS subset are
// supported by ImageResponse (satori) — no grid, no external CSS.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          padding: "80px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {site.name}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#8a8a8a" }}>
            · {site.domain}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            {site.tagline}
          </div>
          <div
            style={{
              fontSize: 34,
              color: "#a1a1a1",
              fontWeight: 500,
            }}
          >
            Git, but for your AI prompts.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            fontSize: 24,
            color: "#8a8a8a",
          }}
        >
          <span>Versioned</span>
          <span>·</span>
          <span>Semantic diff</span>
          <span>·</span>
          <span>Self-hosted</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
