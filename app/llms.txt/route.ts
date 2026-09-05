import { site } from "@/lib/site"
import { social } from "@/lib/social"

// Serves /llms.txt — a plain-text summary for LLMs and answer engines,
// following the llms.txt convention (https://llmstxt.org). Built from the
// shared site config so it stays in sync with the rest of the metadata.
export const dynamic = "force-static"

export function GET() {
  const body = `# ${site.name}

> ${site.description}

${site.tagline}

## What it is

${site.name} is Git, but for your AI prompts. You run the server; your prompts
live in your own infrastructure. Agents fetch prompts by address over gRPC
instead of hard-coding them.

Core capabilities:
- Versioning: every prompt has a URI, with commits, branches, and merges.
- Instant rollback: move a branch pointer to any earlier version.
- Semantic diff: measures how far an edit's meaning ripples through a prompt,
  telling a contained tweak apart from a change that reshapes the whole prompt.
- Live distribution: publishing a change notifies every subscribed agent
  instantly, including the diff verdict.
- Self-hosted: one Go binary, SQLite or PostgreSQL, encrypted at rest.

## Repositories

- Server: ${site.githubUrl}
- CLI: https://github.com/priompt/cli
- Python SDK: https://github.com/priompt/python-sdk
- JavaScript SDK: https://github.com/priompt/js-sdk
- Database adapters: https://github.com/priompt/db-adapters
- Web UI: https://github.com/priompt/ui

## Links

- Website: ${site.url}
- GitHub: ${social.github}
`

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  })
}
