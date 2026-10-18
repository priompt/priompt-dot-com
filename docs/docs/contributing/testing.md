---
title: Testing
sidebar_label: Testing
description: "Run each repository's test suite, and the end-to-end runbook that exercises the whole system."
doc_type: contributor
---

Priompt is tested at two levels: a unit suite in each repository, and an end-to-end runbook in the server repository that drives the real binaries. This page shows how to run both and what each needs.

## Prerequisites

Before you begin, make sure you have:

- **The repositories cloned side by side**: see [Development setup](./development.md).
- **Go 1.25 or later**, and for the SDK suites, **Python 3.9 or later** and **Node 20 or later**.

## Run the unit suites

The Go suites need only the Go toolchain. They start their own servers and brokers on ports the operating system picks, so they don't collide with a running Priompt. Run each one with `GOWORK=off` to test against the published dependencies, as CI does:

```sh
for r in proto db-adapters auth cli priompt; do
  (cd $r && GOWORK=off go test ./...)
done
```

```text title="Output"
?   	github.com/priompt/proto/claims	[no test files]
?   	github.com/priompt/proto/gen/priompt/v1	[no test files]
ok  	github.com/priompt/proto/semdiff	1.887s
ok  	github.com/priompt/proto/validate	1.042s
ok  	github.com/priompt/db-adapters	4.712s
ok  	github.com/priompt/auth/authn	5.245s
ok  	github.com/priompt/auth/cmd/priompt-auth	5.331s
ok  	github.com/priompt/cli/cmd/promptctl	5.748s
ok  	github.com/priompt/priompt/cmd/priompt	7.176s
ok  	github.com/priompt/priompt/internal/auth	1.300s
ok  	github.com/priompt/priompt/internal/pubsub	3.288s
ok  	github.com/priompt/priompt/internal/server	6.685s
```

Each repository takes under 20 seconds. To test your local changes across repositories together, drop `GOWORK=off` so the `go.work` workspace applies.

| Repository | Covers |
| --- | --- |
| `proto` | The semantic diff and validation. |
| `db-adapters` | The store on a live SQLite file, concurrency, backup round trips, and encryption. |
| `auth` | Token minting, `client_credentials`, and the OIDC exchange against a fake identity provider. |
| `cli` | `promptctl`. |
| `priompt` | The CLI commands, authorization, pub/sub authentication, and the gRPC handlers. |

The SDK suites run from their own directories:

- **Python SDK**: `pytest -q` in a virtual environment with the SDK installed in editable mode. It prints `14 passed`.
- **Node SDK**: `npm install`, then `node --check client.js`, then construct a client so the vendored `.proto` is parsed. These are the same checks its CI runs.

The exact commands are in [Development setup](./development.md).

## Run the end-to-end runbook

`RUNBOOK.md` in the server repository is the full-system test: 22 suites of copy-pasteable commands with the output each one should print. It builds every binary, runs them the way a user does, and checks the cases that must fail.

| # | Suite | # | Suite |
| --- | --- | --- | --- |
| T1 | Validation gate on writes | T12 | Node SDK |
| T2 | AES-256-GCM encryption at rest | T13 | `priompt-auth` lifecycle, including token expiry |
| T3 | Backup and restore round trip | T14 | `promptctl` authoring loop |
| T4 | Schema migrations | T15 | Stress: writes, parallel reads, cache |
| T5 | Static tokens: scoping, write grant, expiry | T16 | Per-repository unit suites |
| T6 | Pub/sub with the diff verdict | T17 | TLS and mTLS |
| T7 | Semantic diff: tweak and structural | T18 | PostgreSQL, and migrating from SQLite |
| T8 | Per-org rate limiting | T19 | Redis L2 cache and invalidation |
| T9 | Prometheus metrics | T20 | The published Docker image |
| T10 | Python SDK | T21 | Real embeddings (Text Embeddings Inference) |
| T11 | Branch, merge, history, rollback, pin | T22 | SSO against a live Keycloak |

What each group needs:

- **T1 to T4**: Only the `priompt` binary. No server.
- **T5 to T12**: One `priompt serve`. T13 adds `priompt-auth serve`, and T14 runs in any git repository.
- **T17**: `openssl`, to create certificates.
- **T18 to T22**: Docker, which pulls `postgres:16-alpine`, `redis:7-alpine`, `text-embeddings-inference:cpu-1.6`, and `keycloak:26.0`.

The runbook doesn't exercise publishing to the registries. The release workflows do that when a `v*` tag is pushed.

For the current pass status, see [Status and roadmap](../roadmap.md).

## Stress numbers

The runbook's T15 measures a single-node server on SQLite, run on a Windows 11 laptop with Go 1.26 and Python 3.13 (captured on 2026-07-23). They're a floor for one node, not a ceiling for a deployment:

| Load | Result |
| --- | --- |
| 100 sequential publishes | 0.52 s, about 192 writes/s |
| 200 parallel gets, 32 threads | 0.03 s, about 6,350 reads/s |
| 1,000 gets with the Python client's L1 cache, against the network | Under 1 ms against 173 ms |

## CI

The server repository runs `go test ./...` on every push to `main` and every pull request. Its release workflow runs the same tests first, and publishes the image only when they pass.

## Next steps

- [Development setup](./development.md): build everything from a checkout.
- [Write docs](./docs.mdx): document what you changed.
