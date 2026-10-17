---
title: Web UI
---

# Web UI

The web UI lets you browse, edit, and publish prompts in the browser. You can read every version of a prompt, check the semantic impact of an edit before you publish it, and branch, promote, and roll back.

It's a SvelteKit app. Browsers can't speak gRPC, so the app's server side calls Priompt over gRPC and sends the page plain JSON. Your token stays on that server and never reaches the browser.

## Run it

You need Node 20+, pnpm, and a running Priompt server (see [Quick start](../quickstart.mdx)).

```sh
git clone https://github.com/priompt/ui.git && cd ui
pnpm install
echo "PRIOMPT_URL=priompt://localhost:8443" > .env
pnpm dev                                   # http://127.0.0.1:5173
```

If the server has auth on, put the token in the URL: `PRIOMPT_URL=priompt://<token>@localhost:8443`.

:::note Sample data
With no `PRIOMPT_URL` or `PRIOMPT_HOST` set, the UI runs on built-in sample data and shows an amber banner at the top. Set the variable and restart `pnpm dev`.
:::

### Configuration

The UI reads these from `.env` or the environment:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PRIOMPT_URL` | none | `priompt://[token@]host:port`. Sets the host and token unless they're set separately. |
| `PRIOMPT_HOST` | none | Server address. Wins over the host in `PRIOMPT_URL`. |
| `PRIOMPT_TOKEN` | empty | Bearer token. Wins over the token in `PRIOMPT_URL`. |
| `PRIOMPT_TLS` | `false` | `true` connects over TLS. |
| `PRIOMPT_ORG` | empty | The org to list when the token is org-scoped. |
| `PRIOMPT_NATS_URL` | none | NATS broker, for example `nats://127.0.0.1:4222`. Turns on the **Live** badge, which refreshes an open prompt when someone changes it. |

## Add sample prompts

On a fresh server there's only the demo prompt. To get several prompts with history, run the seed script from a clone of the server repo:

```sh
sh priompt/seed-dev.sh localhost:8443
```

It publishes about seven prompts under `acme`, some with several versions. It uses `publish`, not `put`: `put` writes content without a commit, which leaves the history and diff views empty. Commits made from the CLI have no message. Commits you make in the UI do.

## What you can do

| Task | Where |
| --- | --- |
| Browse orgs and folders | `/`, then an org |
| Read a prompt and its slots | Open a `.prompt` file |
| Check an edit's impact, then publish it | **Edit** → **Check impact** → **Commit changes** |
| Create a prompt | **New prompt** in an org |
| See a prompt's history and each diff | **History** on a prompt, then a commit |
| Branch, merge, promote, and roll back | **Branches** tab, then pick a prompt |
| Compare two branches | `/<org>/compare/main...dev?path=<prompt path>` |
| Search paths and content | `/<org>/search?q=<text>` |
| Check the server connection | Org **Settings** → **Connection** |

## Limitations

- Branch lists show only `main`, `dev`, `staging`, and `prod`. The server has no `ListBranches` RPC yet, so the UI checks those names for each prompt.
- Compare and search have no menu entry yet. Use the URLs in the table above.
- Some controls are placeholders that do nothing yet: the account menu, pull requests, inbox, upload, the Ctrl+K dialog, `/settings`, `/init`, and everything below **Connection** on an org's settings page.
