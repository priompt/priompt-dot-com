---
title: Web UI
---

# Web UI

A SvelteKit front end for browsing prompts, history, and semantic diffs, and for editing prompts in the browser.

Browsers can't speak gRPC, so the SvelteKit server acts as the bridge. Every page loads through `+page.server.ts`, which calls the Priompt server over `@grpc/grpc-js`. No gRPC code ships to the browser.

## Run it

```sh
cd ui
pnpm install
pnpm sync-proto                          # copy the contract from ../proto

echo "PRIOMPT_ADDR=localhost:8443" > .env
# PRIOMPT_TOKEN=…                        # if the server has auth on
pnpm dev
```

Seed a dev server with prompts and real commit history:

```sh
sh ../priompt/seed-dev.sh localhost:8443
```

The script uses `publish`, not `put`. `put` writes content without a commit, which would leave the history and diff views with nothing to show.

## What works

| Wired to the server | Still on mock data |
| --- | --- |
| `/`, `/[namespace]`, tree, blob, commits, `commit/[hash]`, edit. Saving publishes for real, and the commit view shows the server's verdict. | branches, compare, search, new, namespace settings |

Branches are **per prompt** on the server, and there's no `ListBranches` RPC yet, so the repo-wide branch view has nothing behind it.
