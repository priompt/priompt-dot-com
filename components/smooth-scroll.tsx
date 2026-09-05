"use client"

import { ReactLenis } from "lenis/react"

/**
 * Global Lenis smooth-scroll provider. `root` attaches Lenis to the document
 * scroll (no wrapper element needed). `anchors` lets in-page `#` links
 * (Features, Compare, FAQ) animate through Lenis instead of jumping.
 */
function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  )
}

export { SmoothScroll }
