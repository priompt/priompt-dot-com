---
title: Testing
---

# Testing

## Unit suites

Each of these needs only its toolchain, and each finishes in under a minute:

```sh
proto        go test ./...      # semdiff, validate
priompt      go test ./...      # cmd/priompt, internal/{auth,pubsub,server}
auth         go test ./...      # minting, client_credentials, OIDC vs a fake IdP
cli          go test ./...      # promptctl
db-adapters  go test ./...      # store (SQLite live), crypt
python-sdk   pytest -q
js-sdk       node --check client.js
```

## The end-to-end runbook

`priompt/RUNBOOK.md` is the full-system verification: 22 suites, all copy-pasteable, with real captured output. **All 22 pass.**

| # | Suite | # | Suite |
| --- | --- | --- | --- |
| T1 | validation gate on writes | T12 | JavaScript SDK |
| T2 | AES-256-GCM at rest | T13 | priompt-auth lifecycle incl. TTL expiry |
| T3 | backup/restore roundtrip | T14 | promptctl authoring loop |
| T4 | schema migrations | T15 | stress: writes, parallel reads, cache |
| T5 | static tokens: scoping, rw, expiry | T16 | per-repo unit suites |
| T6 | pub/sub with diff verdict | T17 | TLS + mTLS |
| T7 | semantic diff: tweak and structural | T18 | PostgreSQL + SQLite migration |
| T8 | per-org rate limiting | T19 | Redis L2 + invalidation |
| T9 | Prometheus metrics | T20 | the shipped Docker image |
| T10 | Python SDK | T21 | real embeddings (TEI) |
| T11 | branch / merge / history / rollback / pin | T22 | SSO against a live Keycloak |

T1–T4 need no server. T5–T12 need one `priompt serve`. T13 adds `priompt-auth serve`, and T17 needs openssl. T18–T22 need Docker (`postgres:16-alpine`, `redis:7-alpine`, `text-embeddings-inference:cpu-1.6`, `keycloak:26.0`).

The only thing the runbook doesn't exercise is registry publishing, which the release workflows do on a tag.

## Stress numbers (single SQLite node, laptop)

| Load | Result |
| --- | --- |
| 100 sequential publishes | 0.52 s, 192 writes/s |
| 200 parallel gets, 32 threads | 0.03 s, ~6,350 reads/s |
| 1,000 gets with the client L1 cache vs the network | under 1 ms vs 173 ms |
