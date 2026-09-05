import * as React from "react";

import { cn } from "@/lib/utils";

interface LogoProps {
  url?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Logo wrapper. Renders an anchor that links to the provided `url` and
 * contains the desktop/mobile logo images.
 */
const Logo = ({ url = "#", className, children }: LogoProps) => {
  return (
    <a
      href={url}
      className={cn("flex items-center gap-2", className)}
      aria-label="Home"
    >
      {children}
    </a>
  );
};

type LogoImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

/** Logo image shown on desktop viewports (hidden below the `lg` breakpoint). */
const LogoImageDesktop = ({ className, alt = "", ...props }: LogoImageProps) => {
  return (
    <img
      {...props}
      alt={alt}
      className={cn("hidden lg:block", className)}
    />
  );
};

/** Logo image shown on mobile viewports (hidden at and above the `lg` breakpoint). */
const LogoImageMobile = ({ className, alt = "", ...props }: LogoImageProps) => {
  return (
    <img
      {...props}
      alt={alt}
      className={cn("block lg:hidden", className)}
    />
  );
};

export { Logo, LogoImageDesktop, LogoImageMobile };
