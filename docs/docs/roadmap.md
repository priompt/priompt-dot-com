---
title: Status and roadmap
---

# Status and roadmap

## Where things stand

Priompt is working, pre-release software, currently **v0.7**, and all 22 end-to-end suites pass.

| Version | Shipped |
| --- | --- |
| v0.1 | gRPC server, Python adapter, validation |
| v0.2 | L1/L2 caching (TTL), keyed on `version_hash` |
| v0.3 | `promptctl`: commit/diff/log/promote/push/pull on go-git |
| v0.4 | pub/sub over embedded NATS, TTL sync, subscriber model |
| v0.5 | PostgreSQL, Redis L2, org-scoped multi-token auth |
| v0.6 | token expiry/rotation, mTLS, Prometheus + audit log, per-org rate limits, backup/restore, migrations |
| v0.7 | server-side versioning: commit DAG, branches, merges, history, commit diffs, pinning, rollback, verdict-carrying notifications |

## Before the first public release

- [ ] Final registry names: Docker image, PyPI distribution, npm package
- [ ] Public Go module paths (replace `priomptproto`, `priomptdb`, `priomptauth`, and drop the `replace` directives)
- [ ] License
- [ ] Prebuilt binaries for Linux, macOS, and Windows

Once the names are picked, tag `v*` and the existing release workflows publish to GHCR and PyPI.

## Known gaps

- Merges take the source branch's content. Three-way auto-merge isn't implemented.
- There's no `ListBranches` RPC, so the web UI's branch, compare, search, and settings pages are still on mock data.
- Key rotation for encryption at rest isn't automated (re-`put` a prompt to re-encrypt it).
- Authorization works at org-prefix granularity. Per-prompt rules aren't modeled.

## Proposed: the eval gate

*Priompt already does CD. This proposal adds the CI.*

The validation gate proves a prompt is well-formed, and the semantic diff estimates how much it changed. Neither answers "did it get worse?" The proposal:

- **The server never calls a model.** An external runner you own (promptfoo, deepeval, custom) evaluates the candidate branch and posts scores. The server stores them on the commit graph and gates the merge to `main`.
- **Scores are compared with statistics, not a bare threshold.** A candidate is compared against a baseline with an explicit noise band, and each verdict carries a reason code: `ABOVE_BASELINE`, `WITHIN_NOISE`, `REGRESSION_EXCEEDS_TOLERANCE`, `AMBIGUOUS`, `MODEL_CHANGED`, and so on. A changed model, dataset, or grader is flagged instead of being averaged into a pass.
- **The semantic diff schedules the evals.** A `minor edit` runs a cheap tier and a `structural` change runs the full suite.
- **It reuses what Priompt already has.** Invisible branches give zero-exposure candidates. Content-addressed commits guarantee that what was measured is exactly what ships. NATS triggers the runner.

A server with no eval policy configured behaves exactly as it does today.
