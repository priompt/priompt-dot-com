# priompt.com

Marketing site for **Priompt** — a self-hosted prompt registry ("Git, but for
your AI prompts"): version, roll back, semantic-diff, and live-distribute
prompts to AI agents. This repo is the public-facing landing page; the product
itself lives at https://github.com/priompt/priompt.

## Stack

- **Next.js 16** (App Router) + React 19, TypeScript
- **Tailwind CSS v4** + shadcn/ui components
- **Framer Motion** for the mobile nav sheet and hero interactions
- Static export (`output: "export"`) deployed to **Cloudflare Pages**

## Project layout

- `app/(landing)/` — the single landing page (`page.tsx`) and root layout
  (metadata, JSON-LD, fonts)
- `components/sections/` — page sections (navbar, video hero, problems,
  solutions, numbers, compare, cta, faq, footer)
- `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`,
  `app/opengraph-image.tsx`, `app/llms.txt/route.ts` — SEO/AEO metadata routes
- `lib/site.ts` — single source of truth for site URL, name, and description
- `lib/cloudflare-image-loader.ts` — optional Cloudflare image loader

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Build & deploy

```bash
pnpm build        # next build -> static site in out/
pnpm preview      # build + serve out/ locally
```

Deployment runs through Cloudflare Pages' Git integration:

- Build command: `pnpm run build`
- Build output directory: `out`

`public/_headers` is copied into `out/` and applied by Pages.

> **Image optimization:** the Next.js optimizer does not run on Cloudflare
> Pages, so images are served unoptimized by default. Set
> `NEXT_PUBLIC_CF_IMAGE_TRANSFORM=1` to route them through Cloudflare's
> `/cdn-cgi/image/` transformation endpoint (requires "Transformations" enabled
> on the zone).

## Docs (`docs/`)

Product documentation is a separate Docusaurus site in `docs/` (a pnpm
workspace package), built to static files and meant for `docs.priompt.com`.

```bash
pnpm docs:dev     # http://localhost:3000
pnpm docs:build   # -> docs/build (deploy as static assets / Pages)
```

Unreleased names (Docker image, PyPI and npm packages) live in
`docs/src/vars.ts` and render through `<Var>` / `<Cmd>`. Set them there, or via
`PRIOMPT_DOCKER_IMAGE` / `PRIOMPT_PYPI_NAME` / `PRIOMPT_NPM_NAME` at build time.

## Adding UI components

```bash
npx shadcn@latest add button
```

Components are placed in `components/ui/`.
