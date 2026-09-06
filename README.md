# priompt.com

Marketing site for **Priompt** — a self-hosted prompt registry ("Git, but for
your AI prompts"): version, roll back, semantic-diff, and live-distribute
prompts to AI agents. This repo is the public-facing landing page; the product
itself lives at https://github.com/priompt/priompt.

## Stack

- **Next.js 16** (App Router) + React 19, TypeScript
- **Tailwind CSS v4** + shadcn/ui components
- **Framer Motion** for the mobile nav sheet and hero interactions
- Deployed to **Cloudflare Workers** via the [OpenNext](https://opennext.js.org/cloudflare) adapter

## Project layout

- `app/(landing)/` — the single landing page (`page.tsx`) and root layout
  (metadata, JSON-LD, fonts)
- `components/sections/` — page sections (navbar, video hero, problems,
  solutions, numbers, compare, cta, faq, footer)
- `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`,
  `app/opengraph-image.tsx`, `app/llms.txt/route.ts` — SEO/AEO metadata routes
- `lib/site.ts` — single source of truth for site URL, name, and description
- `lib/cloudflare-image-loader.ts` — image loader for Cloudflare Workers

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Build & deploy

```bash
pnpm build        # next build
pnpm preview      # build + preview in the Workers runtime locally
pnpm deploy       # build + deploy to Cloudflare Workers
```

Deployment runs through Cloudflare's Git integration; the deploy command is
`pnpm run deploy` (which runs `opennextjs-cloudflare build && … deploy`), not
`wrangler deploy` directly.

> **Image optimization:** the Next.js optimizer does not run on Cloudflare
> Workers, so images are served unoptimized by default. Set
> `NEXT_PUBLIC_CF_IMAGE_TRANSFORM=1` to route them through Cloudflare's
> `/cdn-cgi/image/` transformation endpoint (requires "Transformations" enabled
> on the zone).

## Adding UI components

```bash
npx shadcn@latest add button
```

Components are placed in `components/ui/`.
