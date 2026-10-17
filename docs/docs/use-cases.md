---
title: Use cases
---

# Who uses Priompt, and how

## The users

| User | What they touch | What they get |
| --- | --- | --- |
| **Solo developer** | `priompt` binary + one SDK | A local prompt store with history. No auth, no infra. |
| **Prompt author** | `promptctl` + git | Prompts as files, validated commits, and a semantic safety check before shipping |
| **Python / Node developer** | an SDK | Fetch prompts by address, cache them, pin versions, and live-reload on change |
| **Any-language developer** | the `.proto` | The full API over plain gRPC. Generate a client in any language. |
| **Platform operator / SRE** | `priompt serve` + Docker/Postgres/Redis/Prometheus | Storage, caching, TLS, metrics, rate limits, backups |
| **Security / IT admin** | `priompt-auth` + IdP | SSO, service accounts, 15-minute credentials, offboarding through IdP groups |
| **CI/CD pipeline** | `promptctl` or an SDK + a service-account JWT | Automated validation and publishing when changes merge |
| **Reviewer / team lead** | `priompt diff`, `promptctl diff`, `DiffCommits` | Tell a safe tweak from a structural rewrite |
| **Tool builder** | `github.com/priompt/db-adapters`, `github.com/priompt/proto` | Versioned, encrypted storage and the validation and diff engines, all as Go libraries with no server |

## Scenarios

**"My agent broke and I don't know what the old prompt said."**
`History` shows every version with its author and message. `SetBranch(uri, "main", old_commit)` is an instant, atomic rollback, and every agent converges through push or within one cache TTL.

**"Marketing edits prompts, and engineering doesn't want 3am surprises."**
Authors use promptctl, agents subscribe, and the server uses a real embedding model. A safe rewording auto-reloads across the fleet in about a second. A policy inversion comes back as `structural`: agents hold their current version and a human gets paged.

**"We A/B test prompt variants."**
Publish the candidate to a branch and have cohort B read `ref="feat"`. `MergeBranch` ships the winner, and `SetBranch` reverts it. See [Versioning](./concepts/versioning.md#example-ab-test-a-prompt).

**"Compliance asks who can read prompts, who changed them, and whether they're encrypted."**
Org-scoped tokens and JWTs answer *who can*. Commit authorship and the JSON audit log answer *who did*. `PRIOMPT_ENCRYPTION_KEY` covers *at rest*, and Prometheus counts every denial by gRPC code.

**"Prompts must go through review like code."**
Prompts live in a git repo. PRs run `promptctl commit` (validation) and `promptctl diff` (block on `structural`). A merge triggers `promptctl push` with a short-lived CI JWT, and subscribed agents are notified in the same step.

**"One prompt store, many teams."**
Orgs are the first URI segment. An `acme` token can't see `priompt://other/…`, write access is opt-in per token, and per-org rate limits stop one team from starving another.

**"I'm building my own prompt tool in Go."**
Use `github.com/priompt/db-adapters` for versioned, encrypted storage, `github.com/priompt/proto/validate` for the server's exact validity rules, and `github.com/priompt/proto/semdiff` for the diff engine. No server is needed.

## Three reference profiles

To grow, you only ever *add* flags. The binaries, SDKs, and URIs stay the same at every tier.

| | Hobbyist | Startup team | Enterprise |
| --- | --- | --- | --- |
| Storage | SQLite | SQLite or Postgres | Postgres + Redis |
| Auth | open | `tokens.txt` (org-scoped, rw) | priompt-auth + SSO + service accounts |
| Transport | plaintext | TLS | mTLS |
| Diff | lexical | Ollama | TEI (`bge-small-en-v1.5`) |
| Authoring | `priompt put` | promptctl + git | promptctl + CI + review gates |
| Ops | none | Docker Compose | metrics + rate limits + encryption + backups |

## The configuration axes

Every axis is independent, and every combination is reachable with flags on the same binary.

| Axis | Options (default first) | Chosen by |
| --- | --- | --- |
| Storage | SQLite · PostgreSQL | `-db` (a path, or a `postgres://` DSN) |
| Cache | in-process L2 · + shared Redis · + client L1 | `-cache-ttl`, `-redis-url`, `cache_ttl=` |
| Auth | open · `PRIOMPT_TOKEN` · `-tokens-file` · + JWTs · + SSO | env / flags; they can be combined |
| Transport | plaintext · TLS · mTLS | `-tls-cert/-tls-key` (+ `-client-ca`) |
| Diff engine | offline lexical · any OpenAI-compatible endpoint | `-embed-url` / `-embed-model` |
| Pub/sub | embedded NATS on · off | `-nats-addr ""` |
| Encryption at rest | off · AES-256-GCM | `PRIOMPT_ENCRYPTION_KEY` |
| Guardrails | metrics · per-org rate limit | `-metrics-addr`, `-rate-limit` / `-rate-burst` |

Moving along an axis never strands data. SQLite to Postgres is `backup` followed by `restore`. Static tokens and SSO run side by side on one server. Turning on encryption needs no migration.
