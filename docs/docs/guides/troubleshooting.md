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

- Set a token: `-nats-token <nats-token>` or `PRIOMPT_NATS_TOKEN=<nats-token>`. Subscribers then connect with `nats://<nats-token>@host:4222`.
- Keep NATS on loopback: remove `-nats-addr`, or set `-nats-addr 127.0.0.1:4222`.
- Turn off pub/sub: `-nats-addr ""`.

In Docker, NATS must listen on `0.0.0.0` to be reachable through a published port, so set the token.

## Fix "unable to open database file" in Docker

```text title="Output"
unable to open database file (14)
```

The server was started with `-db /data/priompt.db`, but `/data` doesn't exist in the image unless you mount a volume there.

To fix it, mount a volume at `/data`, for example `-v priompt-data:/data`, and keep `-db /data/priompt.db`. See [Install with Docker](../installation/docker.mdx).

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

The retry doesn't send a change event. Subscribers pick up the change on their next fetch.

## Fix "not found" for a commit hash

```text title="Output"
ref "c74e161b5a01" not found for "priompt://acme/support/agent"
commit "0cd1e53a2a7a" not found for "priompt://acme/support/agent"
```

`GetPrompt` with a `ref` and `SetBranch` take a branch name or a full 64-character commit hash. Shortened hashes don't resolve, and a hash from another prompt's history doesn't either.

To fix it, copy the full `hash` from `History`, or look it up by prefix. See [Branch, pin, and roll back a prompt](./branch-pin-rollback.mdx).

## Fix a subscriber that gets no events

The broker rejects a subscriber without the right token. The symptom depends on the client:

- **Python**: the subscribe thread logs `nats.errors.Error: nats: 'Authorization Violation'`, and the agent keeps running without events.
- **Node**: `subscribe()` rejects with a `TIMEOUT` error after about 20 seconds.
- **`priompt watch`**: exits with `nats: Authorization Violation`.

To fix it, put the server's NATS token in the URL: `nats://<nats-token>@host:4222`. The NATS port (default `4222`) must also be reachable from the agent.

If events arrive for publishes but not for a merge, that's expected in v0.7.2: `MergeBranch` doesn't send an event. See [Hot-reload prompts safely](./hot-reload.mdx).

## Fix an empty verdict

The subscriber receives an empty `classification`, and `priompt watch` prints `[unknown]`. The server log explains why:

```text title="Output"
classify: semantic verdict unavailable, notifying without one: Post "<embed-url>": <cause>
```

The server couldn't reach its embedding endpoint, so it published the change without a verdict.

To fix it, check `-embed-url` and `-embed-model`, and that the endpoint answers. See [Use a real embedding model](./embedding-model.md). Until it's fixed, agents that follow the [hot-reload](./hot-reload.mdx) pattern hold every change.

## Fix templates written by Windows PowerShell 5.1

In Windows PowerShell 5.1, `>` writes UTF-16, and Priompt rejects the file:

```text title="Output"
validation failed: template has an unclosed or malformed placeholder near "{\x00n\x00a\x00m\x00e\x00}\x00,\x00 ..."
```

`Out-File -Encoding utf8` has the opposite problem: it adds a byte-order mark, and the mark is stored silently as the first character of the template.

To fix it, use one of these forms:

- Pipe the text: `"Hi {name}!" | priompt publish -uri priompt://acme/onboarding/welcome -file - -slot name`.
- For text without accented characters, write the file with `Set-Content`: `Set-Content welcome.txt "Hi {name}!"`.

## Fix "open : no such file or directory" from promptctl

```text title="Output"
open : no such file or directory
```

`promptctl push` and `promptctl publish` with `-tls` need `-ca-cert` in v0.7.0, even for a server with a public certificate.

To fix it, pass the CA that signed the server's certificate. For a public certificate, pass the system bundle, such as `-ca-cert /etc/ssl/certs/ca-certificates.crt` on Debian and Ubuntu.

## Stop the firewall prompt on macOS

The first time `priompt serve` runs, macOS may ask whether to accept incoming connections. By default, the server listens on all interfaces for gRPC (`:8443`) and metrics (`:2112`).

If only local apps connect, bind both to loopback: `-addr 127.0.0.1:8443 -metrics-addr 127.0.0.1:2112`. NATS already binds to `127.0.0.1` by default.

## Next steps

- [Errors](../reference/errors.md): every gRPC status the server returns.
- [Server configuration](../reference/configuration.md): every `priompt serve` flag and environment variable.
- [Monitoring and rate limits](../operations/monitoring.md): watch for errors before users report them.
