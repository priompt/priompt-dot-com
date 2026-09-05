"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"

import { Button } from "@/components/ui/button"

function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  // `mounted` is false on the server and on the client's first render, so the
  // initial output matches the server HTML exactly. It flips to true only after
  // the component has mounted, at which point we can safely read the theme.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Render a stable placeholder until mounted to avoid a hydration
          mismatch, then swap in the correct icon. suppressHydrationWarning
          covers the icon swap that happens immediately after mount. */}
      <span suppressHydrationWarning className="flex size-4 items-center justify-center">
        {mounted ? (
          isDark ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )
        ) : null}
      </span>
    </Button>
  )
}

export { ThemeToggle }
