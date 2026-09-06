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

## Performance and reliability

Measured in a 90-minute soak test against the full stack (PostgreSQL, Redis,
Priompt server) at 40 concurrent workers over a 40-prompt pool:
- 1,420,771 actions processed at ~263 actions/second.
- 0 lost writes and 0 incorrect reads (verified against an independent
  reference model); 0 incidents.
- p95 latency stayed in single-digit milliseconds throughout (reads ~5 ms p95),
  with no latency drift and no memory growth over the run.
- Concurrent writes to the same prompt use compare-and-swap: conflicting
  writers are cleanly rejected (ABORTED) and retry, never corrupted or
  silently dropped.
- Semantic diff verdicts are deterministic: across a labeled corpus of 21 edit
  types, every repeated round produced the same verdict.

(Load was synthetic, from a scripted worker pool; figures are from the offline
lexical embedder run for throughput, and a separate real-model run
(BAAI/bge-small-en-v1.5) confirms diff-quality determinism.)

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
