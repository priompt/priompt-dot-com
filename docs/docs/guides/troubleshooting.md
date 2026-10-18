---
title: Troubleshoot common problems
sidebar_label: Troubleshooting
description: Find the error you see, learn what causes it, and fix it, for the problems people hit most often with Priompt.
doc_type: how-to
---

This page lists the errors people hit most often, by the message you see. Each entry gives the cause and the fix. For every gRPC status code the server returns, see [Errors](../reference/errors.md).

## Prerequisites

Before you begin, make sure you have:

- **The exact error text**: from the CLI, your SDK, or the server log. The server logs one JSON line per RPC, with the method, org, URI, and status code.
- **The server's flags**: the first log line of `priompt serve` lists them, for example `serving on :8443 (tls=false ... nats=127.0.0.1:4222 ...)`.

## Fix a validation error

Priompt checks every template before it stores or serves it. The same rules run in `promptctl commit`, `promptctl push`, `priompt put`, and every publish.

```text title="Output"
rpc error: code = InvalidArgument desc = invalid prompt: template uses undeclared slots: org
validation failed: declared slots never used in template: extra
invalid prompt: uri has an org but no prompt path
invalid acme/support/greeting.prompt: template uses doubled braces near "{{name}}, how ..."
```

To fix it:

1. Declare every `{placeholder}` in the template with `-slot`, and remove `-slot` flags the template doesn't use. `promptctl` derives slots from the template, so this error doesn't occur there.
2. Write slots as `{name}`, not `{{name}}`.
3. Give the URI an org and a path: `priompt://acme/support/agent`, not `priompt://welcome`.

The full rules are on [Prompts and addresses](../concepts/prompts.md).

## Fix a server that won't start

```text title="Output"
-nats-addr 0.0.0.0:4222 is not loopback: set -nats-token (or PRIOMPT_NATS_TOKEN) so subscribers must authenticate, or bind NATS to 127.0.0.1
```

The embedded NATS broker carries change events for every org. The server refuses to expose it beyond loopback without a token.

To fix it, do one of the following:

- Set a token: `-nats-token <nats-token>` or `PRIOMPT_NATS_TOKEN=<nats-token>`. With API authentication on, subscribers then connect with their own API token: `nats://<api-token>@host:4222`. See [Secure a server](../operations/security.md#require-a-token-on-the-broker).
- Keep NATS on loopback: remove `-nats-addr`, or set `-nats-addr 127.0.0.1:4222`.
- Turn off pub/sub: `-nats-addr ""`.

In Docker, NATS must listen on `0.0.0.0` to be reachable through a published port, so set the token.

```text title="Output"
encryption key missing or wrong: the database holds encrypted prompts but PRIOMPT_ENCRYPTION_KEY is not set
encryption key missing or wrong: PRIOMPT_ENCRYPTION_KEY does not decrypt the stored prompts (it must be the key they were written with)
```

The database holds prompts encrypted at rest, and the server can't read them with the key it has. Set `PRIOMPT_ENCRYPTION_KEY` to the key the prompts were written with. See [Storage and backups](../operations/storage.md#turn-on-encryption-at-rest).

```text title="Output"
-tls-cert and -tls-key must be set together
```

Pass both flags, or neither. See [Secure a server](../operations/security.md).

## Fix "publish failed" after upgrading the Docker image

```text title="Output"
rpc error: code = Internal desc = publish failed
```

The server log shows `publish: attempt to write a readonly database`. From v0.7.3 the image runs as uid 10001 instead of root, and the volume still holds files that an older image wrote as root.

To fix it, change the owner once, then restart the container:

```sh
docker run --rm -v priompt-data:/data alpine chown -R 10001:10001 /data
```

For a bind mount, pass the host directory instead of `priompt-data`. See [Install with Docker](../installation/docker.mdx).

## Fix "Unavailable" when a client connects

```text title="Output"
rpc error: code = Unavailable desc = connection error: desc = "transport: Error while dialing: dial tcp [::1]:8443: connect: connection refused"
```

The client can't reach a gRPC server at that address. On Windows, the same error reads `No connection could be made because the target machine actively refused it`.

To fix it:

1. Check that the server is running, and read its first log line for the address it listens on.
2. Check the address the client uses. The CLI reads `-addr`, then the host in `PRIOMPT_URL`, then defaults to `localhost:8443`.
3. Match TLS on both sides. If the server runs with `-tls-cert`, pass `-tls` to the CLI, or `tls=True` (Python) or `tls: true` (Node).

## Fix "Unavailable" after a publish or rollback

```text title="Output"
rpc error: code = Unavailable desc = the change is stored but the cache could not be cleared; retry so readers see it
```

The server stored the change but couldn't clear its cache, usually because Redis is down. The server log shows `cache invalidate <uri>: <cause>`. Readers keep getting the old version until the cache entry expires.

To fix it:

1. Restore the cache backend. Check the `-redis-url` the server uses.
2. Retry the same publish. The retry stores nothing new, clears the cache, and succeeds.

The server sends the change event even when the cache clear fails, so the retry prints `unchanged` and sends no second event.

## Fix "not found" for a commit hash

```text title="Output"
ref "c74e161b5a01" not found for "priompt://acme/support/agent"
commit "0cd1e53a2a7a" not found for "priompt://acme/support/agent"
```

`GetPrompt` with a `ref` and `SetBranch` take a branch name or a full 64-character commit hash. Shortened hashes don't resolve, and a hash from another prompt's history doesn't either.

To fix it, copy the full `hash` from `History`, or look it up by prefix. See [Branch, pin, and roll back a prompt](./branch-pin-rollback.mdx).

## Fix a subscriber that gets no events

The broker rejects a subscriber without the right token:

```text title="Output"
ConnectionError: subscribe: cannot connect to NATS at 127.0.0.1:4222: nats: 'Authorization Violation'
NATS broker rejected the connection: Authorization Violation (check natsToken or the token in natsUrl)
nats: Authorization Violation
```

The first line is from Python, the second from Node, and the third from `priompt watch`.

To fix it, put the agent's API token in the URL: `nats://<api-token>@host:4222`. The NATS port (default `4222`) must also be reachable from the agent.

A subscription to a prompt outside the token's org is refused with `Permissions Violation for Subscription to "priompt.<org>...."`. Use a token for that org, or an admin token.

## Fix an empty verdict

The subscriber receives an empty `classification`, and `priompt watch` prints `[unknown]`. The server log explains why:

```text title="Output"
classify: semantic verdict unavailable, notifying without one: Post "<embed-url>": <cause>
```

The server couldn't reach its embedding endpoint, so it published the change without a verdict.

To fix it, check `-embed-url` and `-embed-model`, and that the endpoint answers. See [Use a real embedding model](./embedding-model.md). Until it's fixed, agents that follow the [hot-reload](./hot-reload.mdx) pattern hold every change.

## Fix templates written by Windows PowerShell 5.1

In Windows PowerShell 5.1, `>` and `Out-File` write UTF-16, and `priompt` rejects the file:

```text title="Output"
welcome.txt: file is UTF-16; save as UTF-8
```

To fix it, pipe the text (`"Hi {name}!" | priompt publish -uri priompt://acme/onboarding/welcome -file - -slot name`), or write the file with `Set-Content`. `priompt` strips a UTF-8 byte-order mark and converts CRLF line endings to LF, so either form stores the same template as on Linux. Before v0.7.3, a byte-order mark was stored as part of the template.

## Stop the firewall prompt on macOS

The first time `priompt serve` runs, macOS may ask whether to accept incoming connections. By default, the server listens on all interfaces for gRPC (`:8443`) and metrics (`:2112`).

If only local apps connect, bind both to loopback: `-addr 127.0.0.1:8443 -metrics-addr 127.0.0.1:2112`. NATS already binds to `127.0.0.1` by default.

## Next steps

- [Errors](../reference/errors.md): every gRPC status the server returns.
- [Server configuration](../reference/configuration.md): every `priompt serve` flag and environment variable.
- [Monitoring and rate limits](../operations/monitoring.md): watch for errors before users report them.
