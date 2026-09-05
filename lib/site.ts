/**
 * Central site configuration — the single source of truth for anything that
 * needs the canonical URL, product name, or the marketing one-liner:
 * metadata, sitemap, robots, the OG image, llms.txt, and JSON-LD.
 *
 * If the production domain ever changes, update `url` here and everything
 * downstream (canonical tags, OG URLs, sitemap, robots) follows.
 */
export const site = {
  name: "Priompt",
  domain: "priompt.com",
  // Absolute production origin — no trailing slash. Override at build time via
  // NEXT_PUBLIC_SITE_URL if you deploy to a preview/staging host.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://priompt.com",
  // <title> for the home page and the OG/Twitter title.
  title: "Priompt — Git, but for your AI prompts",
  // ~155 chars, tuned for search snippets and social cards.
  description:
    "Priompt is a self-hosted prompt registry with a semantic diff that tells a typo from a policy flip, then pushes that verdict to every agent running it. Version, roll back, and distribute prompts like code.",
  // Short tagline reused in the OG image and structured data.
  tagline: "Your prompts are your product. Stop renting them.",
  // Keywords help some crawlers/LLMs; invisible to visitors, so this is where
  // we cover high-intent and category terms without touching on-page copy.
  keywords: [
    "prompt registry",
    "prompt versioning",
    "prompt version control",
    "prompt management",
    "prompt management tool",
    "prompt management platform",
    "prompt CMS",
    "prompt repository",
    "prompt ops",
    "promptops",
    "LLM prompt management",
    "AI prompt management",
    "manage AI prompts",
    "prompt engineering tools",
    "semantic diff",
    "semantic prompt diff",
    "prompt rollback",
    "prompt A/B testing",
    "self-hosted prompt server",
    "open source prompt management",
    "git for prompts",
    "version control for AI prompts",
    "prompt deployment",
    "serve prompts to AI agents",
    "gRPC prompt server",
    "LLM prompts",
    "AI agents",
  ],
  githubUrl: "https://github.com/priompt/priompt",
  githubOrg: "https://github.com/priompt",
  ogImageAlt: "Priompt — a version-controlled home for your AI prompts",
} as const

export type Site = typeof site
