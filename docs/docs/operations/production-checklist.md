---
title: Production checklist
sidebar_label: Production checklist
description: Every setting to check before a Priompt server takes real traffic, and a complete production serve command.
doc_type: how-to
---

This checklist hardens a Priompt server before it serves real agents. Each item names the setting, why it matters, and the page that explains it, and the last sections give a complete `priompt serve` command and a way to verify it.

## Prerequisites

Before you begin, make sure you have:

- **A server you can start with `priompt serve`**: see [Install Priompt](../installation/index.mdx).
- **TLS certificates** for the server's hostname: see [Secure a server](./security.md#tls-and-mtls).
- **For more than one node**: PostgreSQL and Redis. See [Scale to multiple nodes](./scaling.md).

## Pick a profile

To grow, you only ever add flags. The binaries, SDKs, and addresses stay the same at every tier.

| | Hobbyist | Startup team | Enterprise |
| --- | --- | --- | --- |
| Storage | SQLite | SQLite or PostgreSQL | PostgreSQL + Redis |
| Auth | open | tokens file (org-scoped, rw) | priompt-auth + SSO + service accounts |
| Transport | plaintext | TLS | mTLS |
| Diff | lexical | Ollama | TEI (`bge-small-en-v1.5`) |
| Authoring | `priompt publish` | promptctl + git | promptctl + CI + review gates |
| Ops | none | Docker Compose | metrics + rate limits + encryption + backups |

Each setting is independent, and every combination is reachable with flags on the same binary:

| Setting | Options (default first) | Chosen by |
| --- | --- | --- |
| Storage | SQLite · PostgreSQL | `-db` (a path, or a `postgres://` DSN) |
| Cache | in-process L2 · + shared Redis · + client L1 | `-cache-ttl`, `-redis-url`, `cache_ttl=` |
| Auth | open · `PRIOMPT_TOKEN` · `-tokens-file` · + JWTs · + SSO | env / flags; they can be combined |
| Transport | plaintext · TLS · mTLS | `-tls-cert`/`-tls-key` (+ `-client-ca`) |
| Diff engine | offline lexical · any OpenAI-compatible endpoint | `-embed-url` / `-embed-model` |
| Pub/sub | embedded NATS on · off | `-nats-addr ""` |
| Encryption at rest | off · AES-256-GCM | `PRIOMPT_ENCRYPTION_KEY` |
| Guardrails | metrics · per-org rate limit | `-metrics-addr`, `-rate-limit` / `-rate-burst` |

Moving from SQLite to PostgreSQL is `backup` followed by `restore`, and static tokens and SSO run side by side on one server.

## Check each setting

- [ ] **Tokens are configured.** Without a tokens file, `PRIOMPT_TOKEN`, or `-auth-jwks-url`, every request has admin rights. Run `priompt init` and start with `-tokens-file`. See [Secure a server](./security.md).
- [ ] **Tokens are scoped and read-only by default.** Give `rw` only to the services and people that publish, and an org to every token that serves one team.
- [ ] **TLS is on.** Pass both `-tls-cert` and `-tls-key`. Add `-client-ca` for service-to-service mTLS.
- [ ] **The demo prompt is off.** Set `-seed=false` or `PRIOMPT_SEED=false`, so the server doesn't create `priompt://acme/onboarding/welcome`.
- [ ] **The broker has a token.** If port `4222` is reachable from other hosts, set `PRIOMPT_NATS_TOKEN`. Never expose the NATS cluster port publicly.
- [ ] **Metrics are internal.** `-metrics-addr` defaults to `:2112` on every interface. Bind it to an internal address such as `127.0.0.1:2112`.
- [ ] **Encryption at rest is on, and the key is backed up.** Set `PRIOMPT_ENCRYPTION_KEY` and store the key apart from database backups. See [Storage and backups](./storage.md).
- [ ] **Backups run.** Schedule `priompt backup` and test a restore.
- [ ] **Rate limits are set** if several teams share the server: `-rate-limit` and `-rate-burst`. See [Monitoring and rate limits](./monitoring.md).
- [ ] **Secrets stay out of the command line.** Pass the broker token and the encryption key as environment variables. Make the tokens file and any env file readable only by the service account.
- [ ] **The database is on a volume.** In the Docker image, pass `-db /data/priompt.db` and mount a volume at `/data`. Without `-db`, the database is written to the container's own filesystem and is lost with the container.

## Start the server with production settings

This command runs one node with PostgreSQL, a shared Redis cache, TLS, static tokens plus `priompt-auth` JWTs, a real embedding model, a broker reachable from other hosts, internal metrics, and rate limits:

```sh
export PRIOMPT_NATS_TOKEN=<nats-token>
export PRIOMPT_ENCRYPTION_KEY=<encryption-key>

priompt serve \
  -addr :8443 \
  -db postgres://priompt:$PGPASS@db:5432/prompts \
  -redis-url redis://cache:6379/0 \
  -tls-cert /etc/priompt/server.crt -tls-key /etc/priompt/server.key \
  -tokens-file /etc/priompt/tokens.txt \
  -auth-jwks-url http://auth:8444/jwks \
  -embed-url http://tei/v1/embeddings -embed-model BAAI/bge-small-en-v1.5 \
  -nats-addr 0.0.0.0:4222 \
  -metrics-addr 127.0.0.1:2112 \
  -rate-limit 50 -rate-burst 100 \
  -seed=false
```

```text title="Output"
2026/10/18 10:20:22 metrics on 127.0.0.1:2112/metrics
2026/10/18 10:20:22 priompt v0.7.2 (unknown) serving on :8443 (tls=true mtls=false auth=1-token cache=redis embed=BAAI/bge-small-en-v1.5@http://tei/v1/embeddings nats=0.0.0.0:4222 metrics=127.0.0.1:2112 ratelimit=50/s)
```

Replace the placeholders:

- `<nats-token>`: a value from `priompt gen-token`. Subscribers put it in their broker URL.
- `<encryption-key>`: 32 random bytes in base64, from `openssl rand -base64 32`.
- `$PGPASS`, `db`, `cache`, `auth`, and `tei`: your PostgreSQL password and the hostnames of PostgreSQL, Redis, [`priompt-auth`](../guides/sso.md), and your [embedding service](../guides/embedding-model.md).

Drop `-auth-jwks-url` if you use only the tokens file, and drop the two `-embed-*` flags to keep the built-in offline embedder. [Configuration](../reference/configuration.md) lists every flag and its environment variable.

## Verify the server

To check the running server:

1. List prompts with a token over TLS:

   ```sh
   export PRIOMPT_URL=priompt://<token>@prompts.example.com:8443
   priompt list -tls -ca-cert ca.pem -prefix priompt://acme/support/
   ```

   ```text title="Output"
   priompt://acme/support/agent	bd45a4721079
   priompt://acme/support/summarize	7d17782c44f4
   ```

2. Check that a token scoped to `acme` can't read another org:

   ```text title="Output"
   rpc error: code = PermissionDenied desc = token not authorized for prefix "priompt://globex/"
   ```

3. On the server host, check the build in the metrics:

   ```sh
   curl -s 127.0.0.1:2112/metrics | grep priompt_build_info
   ```

   ```text title="Output"
   # HELP priompt_build_info Always 1; labels identify the running build.
   # TYPE priompt_build_info gauge
   priompt_build_info{commit="unknown",goversion="go1.26.4",version="v0.7.2"} 1
   ```

## Next steps

- [Secure a server](./security.md): create scoped tokens, certificates, and the broker token.
- [Storage and backups](./storage.md): schedule backups and turn on encryption at rest.
- [Monitoring and rate limits](./monitoring.md): scrape metrics and read the audit log.
- [Scale to multiple nodes](./scaling.md): run several nodes behind a load balancer.
