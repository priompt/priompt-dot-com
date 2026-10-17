---
title: Configuration
---

# Configuration

Everything is set with flags on `priompt serve`, and most flags have an environment-variable twin. Where both are given, the flag wins.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `PRIOMPT_URL` | CLI, Python, Node, web UI | `priompt://<token>@host:port`: one string for both address and credential |
| `PRIOMPT_TOKEN` | server, CLIs, web UI | admin write token (server) or credential (clients) |
| `PRIOMPT_SEED` | server | `false` turns off the demo prompt seeded on first start |
| `PRIOMPT_EMBED_URL` | server, `put`, promptctl | OpenAI-compatible `/v1/embeddings` endpoint |
| `PRIOMPT_EMBED_MODEL` | server, `put`, promptctl | embedding model name |
| `PRIOMPT_EMBED_KEY` | server, `put`, promptctl | API key for the embeddings endpoint |
| `PRIOMPT_REDIS_URL` | server | Redis URL for a shared L2 cache |
| `PRIOMPT_JWKS_URL` | server | priompt-auth `/jwks` URL. When set, the server accepts its JWTs. |
| `PRIOMPT_ENCRYPTION_KEY` | server, `put`, `backup`, … | base64 of 32 bytes. Turns on AES-256-GCM at rest. |
| `PRIOMPT_NATS_TOKEN` | server | credential required of NATS clients |
| `PRIOMPT_NATS_URL` | `priompt watch`, web UI | broker URL to subscribe to (in the web UI, turns on the Live badge) |
| `PRIOMPT_NATS_ROUTES` | server | comma-separated cluster peers |
| `PRIOMPT_NATS_CLUSTER_ADDR` | server | cluster route listen address |
| `PRIOMPT_NATS_CLUSTER_SECRET` | server | shared secret for cluster peers |
| `PRIOMPT_GIT_TOKEN` | promptctl | token for HTTPS git remotes |
| `PRIOMPT_HOST` | web UI | server address; wins over the host in `PRIOMPT_URL` |
| `PRIOMPT_TLS` | web UI | `true` connects over TLS |
| `PRIOMPT_ORG` | web UI | org to list when the token is org-scoped |

### `PRIOMPT_URL` precedence

An explicit host or `-addr` wins over the URL's host. An explicit `PRIOMPT_TOKEN` or `token=` wins over the URL's token. A value with no scheme is treated as a bare host.

## `serve` flags

| Flag | Default | Purpose |
| --- | --- | --- |
| `-addr` | `:8443` | gRPC listen address |
| `-db` | `priompt.db` | SQLite file path, or a `postgres://` DSN |
| `-tls-cert` / `-tls-key` | | turn on TLS |
| `-client-ca` | | verify client certificates (mTLS). Requires TLS. |
| `-tokens-file` | | static tokens: `token [org] [expiry] [rw]` lines |
| `-auth-jwks-url` | `$PRIOMPT_JWKS_URL` | trust priompt-auth JWTs |
| `-cache-ttl` | `30s` | L2 server cache TTL. `0` turns it off. |
| `-redis-url` | `$PRIOMPT_REDIS_URL` | shared L2 cache |
| `-embed-url` / `-embed-model` | `$PRIOMPT_EMBED_*` | embedding endpoint for the semantic diff |
| `-nats-addr` | `127.0.0.1:4222` | embedded NATS. An empty value turns pub/sub off. |
| `-nats-token` | `$PRIOMPT_NATS_TOKEN` | required when `-nats-addr` isn't loopback |
| `-nats-cluster-addr` / `-nats-routes` / `-nats-cluster-secret` | | multi-node NATS clustering |
| `-metrics-addr` | `:2112` | Prometheus `/metrics`. An empty value turns it off. |
| `-rate-limit` | `0` | per-org requests/second. `0` turns it off. |
| `-rate-burst` | `0` | per-org burst. `0` means the same as `-rate-limit`. |
| `-seed` | `true` | seed a demo prompt if it's absent |

## A production example

```sh
priompt serve \
  -addr :8443 \
  -db postgres://priompt:$PGPASS@db:5432/prompts \
  -redis-url redis://cache:6379/0 \
  -tls-cert /etc/priompt/server.crt -tls-key /etc/priompt/server.key \
  -tokens-file /etc/priompt/tokens.txt \
  -auth-jwks-url http://auth:8444/jwks \
  -embed-url http://tei/v1/embeddings -embed-model BAAI/bge-small-en-v1.5 \
  -nats-addr 0.0.0.0:4222 -nats-token $PRIOMPT_NATS_TOKEN \
  -metrics-addr 127.0.0.1:2112 \
  -rate-limit 50 -rate-burst 100 \
  -seed=false
```
