---
title: Server configuration
sidebar_label: Configuration
description: "Every priompt serve flag, every PRIOMPT_ environment variable, and the tokens file format."
doc_type: reference
---

`priompt serve` is configured with flags, and most flags take their default from an environment variable. When both are set, the flag wins. This page lists every flag, every `PRIOMPT_*` variable across the Priompt binaries and clients, and the tokens file format.

## serve flags

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-addr` | | `:8443` | gRPC listen address. |
| `-db` | | `priompt.db` | SQLite file path, or a `postgres://` DSN. |
| `-tls-cert` | | | TLS certificate file. Set it together with `-tls-key`; one without the other stops the server. |
| `-tls-key` | | | TLS private key file. |
| `-client-ca` | | | CA certificate for client certificates. Turns on mTLS. Requires `-tls-cert` and `-tls-key`. |
| `-tokens-file` | | | Static tokens file. See [Tokens file](#tokens-file). |
| | `PRIOMPT_TOKEN` | | An extra admin token with write access that never expires. |
| `-auth-jwks-url` | `PRIOMPT_JWKS_URL` | | `priompt-auth` `/jwks` URL. The server then also accepts its JWTs. |
| `-cache-ttl` | | `30s` | Server-side (L2) cache TTL. `0` turns the in-process cache off. |
| `-redis-url` | `PRIOMPT_REDIS_URL` | | `redis://` URL for a cache shared by several nodes. Replaces the in-process cache. |
| `-embed-url` | `PRIOMPT_EMBED_URL` | | OpenAI-compatible `/v1/embeddings` URL for the semantic diff. Empty uses the offline lexical embedder. |
| `-embed-model` | `PRIOMPT_EMBED_MODEL` | | Embedding model name sent to `-embed-url`. |
| | `PRIOMPT_EMBED_KEY` | | API key sent to `-embed-url` as a bearer token. |
| `-nats-addr` | | `127.0.0.1:4222` | Listen address of the embedded NATS broker for change events. Empty turns pub/sub off. |
| `-nats-token` | `PRIOMPT_NATS_TOKEN` | | The broker's full-rights credential, which the server publishes with. Required when `-nats-addr` isn't a loopback address. With API authentication on, subscribers present their own API token instead, with subscribe-only access to their org. |
| `-nats-cluster-addr` | `PRIOMPT_NATS_CLUSTER_ADDR` | | Listen address for NATS cluster routes between server nodes. |
| `-nats-cluster-secret` | `PRIOMPT_NATS_CLUSTER_SECRET` | | Shared secret for cluster peers. Required when `-nats-cluster-addr` isn't a loopback address. |
| `-nats-routes` | `PRIOMPT_NATS_ROUTES` | | Comma-separated cluster routes of the other nodes. |
| `-metrics-addr` | | `:2112` | Prometheus `/metrics` listen address. Empty turns metrics off. |
| `-rate-limit` | | `0` | Requests per second allowed per org. `0` turns rate limiting off. |
| `-rate-burst` | | `0` | Burst size per org. `0` means the same as `-rate-limit`. |
| `-seed` | `PRIOMPT_SEED` | `true` | Create the demo prompt `priompt://acme/onboarding/welcome` if it's absent. `PRIOMPT_SEED=false` turns it off. |
| | `PRIOMPT_ENCRYPTION_KEY` | | Base64 of a 32-byte key. Encrypts stored templates, and the Redis cache, with AES-256-GCM. |

Authentication is on when the server has at least one credential source: a `-tokens-file` with tokens, `PRIOMPT_TOKEN`, or `-auth-jwks-url`. Without any, every request has admin rights. See [Security](../operations/security.md).

### Startup refusals

`serve` exits with code `1` instead of starting in an unsafe or broken state:

| Message | Fix |
| --- | --- |
| `-nats-addr 0.0.0.0:4222 is not loopback: set -nats-token (or PRIOMPT_NATS_TOKEN) so subscribers must authenticate, or bind NATS to 127.0.0.1` | Set `-nats-token`, or keep NATS on `127.0.0.1`. |
| `-nats-cluster-addr <addr> is not loopback: set -nats-cluster-secret ...` | Set `-nats-cluster-secret`. |
| `-client-ca requires -tls-cert and -tls-key` | Turn on TLS, or drop `-client-ca`. |
| `-tls-cert and -tls-key must be set together` | Pass both, or neither. |
| `encryption key missing or wrong: ...` | The database holds encrypted prompts that the current `PRIOMPT_ENCRYPTION_KEY` can't decrypt. Set the key they were written with. |
| `PRIOMPT_ENCRYPTION_KEY: not valid base64: ...`, `PRIOMPT_ENCRYPTION_KEY: want 32 bytes base64-encoded, got <n>` | Set a base64-encoded 32-byte key. |
| `<tokens-file> already exists; pass -force to overwrite` | This one comes from `priompt init`, not `serve`. |

To create an encryption key:

```sh
openssl rand -base64 32
# => <base64 key>
```

Keep the key outside the database host. Without it, the encrypted rows can't be read.

## Tokens file

`-tokens-file` names a text file with one token per line:

```text title="tokens.txt"
# admin: every org, write access
<token-1> rw
# read-only for org acme
<token-2> acme
# write access to acme until the end of 2026
<token-3> acme 2026-12-31 rw
```

Each `<token-n>` is a token from `priompt gen-token`. The fields after the token can come in any order:

- **Org**: Any word that isn't `rw`, `ro`, or a date. The token can only reach `priompt://<org>/...`. No org means admin, which reaches every org.
- **Expiry**: A date (`2026-12-31`) or an RFC 3339 timestamp (`2026-12-31T18:00:00Z`). After it, the server answers `Unauthenticated` with `token expired`. No expiry means the token never expires.
- **`rw`**: Grants write access (publish, branch, merge, roll back). Without it the token is read-only. `ro` states read-only explicitly.

Blank lines and lines that start with `#` are ignored. From v0.7.3, a `#` after the token also starts a comment, and a line with two org words or two expiries is an error that stops the server from starting. In v0.7.2 and earlier, a later `#` isn't a comment: its words become fields and the last plain word becomes the org, so keep comments on their own lines.

The server reads the file at startup. To rotate a token, add the new token, give the old one an expiry, restart, and remove the old line once it has expired.

## Environment variables

| Env var | Read by | Description |
| --- | --- | --- |
| `PRIOMPT_URL` | `priompt` client commands, Python SDK, Node SDK, web UI | `priompt://<token>@host:port`: the server address and credential in one value. |
| `PRIOMPT_TOKEN` | `priompt serve`, `priompt` client commands, `promptctl`, web UI | On the server, an admin token. On a client, the bearer token to send. |
| `PRIOMPT_JWKS_URL` | `priompt serve` | Default for `-auth-jwks-url`. |
| `PRIOMPT_REDIS_URL` | `priompt serve` | Default for `-redis-url`. |
| `PRIOMPT_EMBED_URL` | `priompt serve`, `priompt put`, `promptctl` | Embedding endpoint for the semantic diff. |
| `PRIOMPT_EMBED_MODEL` | `priompt serve`, `priompt put`, `promptctl` | Embedding model name. |
| `PRIOMPT_EMBED_KEY` | `priompt serve`, `priompt put`, `promptctl` | API key for the embedding endpoint. |
| `PRIOMPT_ENCRYPTION_KEY` | `priompt serve` and every `priompt` command with `-db` | Base64 of a 32-byte key for encryption at rest. |
| `PRIOMPT_SEED` | `priompt serve` | `false` turns off the demo prompt. |
| `PRIOMPT_NATS_TOKEN` | `priompt serve` | Default for `-nats-token`. |
| `PRIOMPT_NATS_CLUSTER_ADDR` | `priompt serve` | Default for `-nats-cluster-addr`. |
| `PRIOMPT_NATS_CLUSTER_SECRET` | `priompt serve` | Default for `-nats-cluster-secret`. |
| `PRIOMPT_NATS_ROUTES` | `priompt serve` | Default for `-nats-routes`. |
| `PRIOMPT_NATS_URL` | `priompt watch`, web UI | Broker URL to subscribe to, `nats://<token>@host:4222` when the broker needs a token. |
| `PRIOMPT_GIT_TOKEN` | `promptctl` | Password for HTTPS git remotes on `push` and `pull`. |
| `PRIOMPT_HOST` | web UI | Server address. Wins over the host in `PRIOMPT_URL`. |
| `PRIOMPT_TLS` | web UI | `true` connects over TLS. |
| `PRIOMPT_ORG` | web UI | Org to list when the token is scoped to one org. |

`promptctl` doesn't read `PRIOMPT_URL`. Pass the server with `-server` and the token with `PRIOMPT_TOKEN`.

### PRIOMPT_URL precedence

Every client that reads `PRIOMPT_URL` resolves it the same way:

1. An explicit address wins over the URL's host: `-addr` for the CLI, `host` for the SDKs, `PRIOMPT_HOST` for the web UI.
2. An explicit token wins over the URL's token: `PRIOMPT_TOKEN` for the CLI and web UI, `token` for the SDKs.
3. A value without `priompt://` is a bare `host:port` with no token.
4. With no address anywhere, the `priompt` CLI uses `localhost:8443`, and the SDKs raise an error.

## Related

- [priompt CLI](./cli.md): the other `priompt` commands and their flags.
- [Production checklist](../operations/production-checklist.md): a complete production `serve` command.
- [Security](../operations/security.md): TLS, mTLS, tokens, and the NATS broker.
