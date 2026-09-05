import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SmoothScroll } from "@/components/smooth-scroll"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"
import { defaultItems as faqItems } from "@/components/sections/faq"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  // Resolves all relative metadata URLs (OG image, canonical) against the site origin.
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    // Sub-pages can set their own title; it becomes "<page> — Priompt".
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  applicationName: site.name,
  authors: [{ name: site.name, url: site.githubOrg }],
  creator: site.name,
  publisher: site.name,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: site.url,
    locale: "en_US",
    // opengraph-image.tsx in the app root is picked up automatically, but we
    // list it explicitly so the alt text and dimensions are set.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: site.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    // Files live in public/favicon/. Next.js renders these as <link> tags.
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
}

// JSON-LD structured data — helps search engines and answer engines (AEO)
// understand what Priompt is. Rendered as a script tag in the document head.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: site.name,
      alternateName: "Priompt prompt registry",
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "Prompt management / prompt version control",
      operatingSystem: "Linux, macOS, Windows",
      description: site.description,
      url: site.url,
      downloadUrl: site.githubUrl,
      softwareHelp: `${site.githubUrl}#readme`,
      programmingLanguage: ["Go", "Python", "JavaScript"],
      featureList: [
        "Prompt version control (commits, branches, merges)",
        "Semantic propagation diff",
        "Instant rollback",
        "Live change distribution to agents",
        "Self-hosted (SQLite or PostgreSQL)",
        "gRPC access from any language",
      ],
      license: "https://opensource.org/licenses",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "Organization",
      name: site.name,
      url: site.url,
      logo: `${site.url}/images/black-priompt-icon.png`,
      sameAs: [site.githubOrg, site.githubUrl],
    },
    {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
    },
    {
      "@type": "FAQPage",
      // Built from the same FAQ content shown on the page, so structured data
      // stays in sync with visible copy (no duplicated wording to maintain).
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body>
        <script
          type="application/ld+json"
          // JSON-LD is trusted, static content built from our own config.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  )
}
