---
title: priompt CLI
sidebar_label: priompt
description: "Every priompt subcommand, its flags, defaults, output, and exit codes."
doc_type: reference
---

`priompt` is one binary that runs the server and operates it. The client commands (`publish`, `diff`, `list`) talk to a running server over gRPC, and the storage commands (`put`, `backup`, `restore`, `export`, `import`, `migrate`) open the database directly.

```text
priompt init|serve|put|diff|list|publish|watch|backup|restore|export|import|migrate|gen-token|version [flags]
```

## Commands

| Command | Description |
| --- | --- |
| [`init`](#init) | Mint an admin token, write it to a tokens file, and print a `PRIOMPT_URL`. |
| [`serve`](#serve) | Run the gRPC server. |
| [`publish`](#publish) | Publish a new version through a server and notify subscribers. |
| [`diff`](#diff) | Semantic diff of a stored prompt against an edited file, through a server. |
| [`list`](#list) | List the prompts under a URI prefix, through a server. |
| [`watch`](#watch) | Subscribe to a prompt's change events over NATS. |
| [`put`](#put) | Validate a prompt and write it straight into a database, without a server. |
| [`backup`](#backup) | Write prompts, commits, and branches to a JSON-lines file. |
| [`restore`](#restore) | Load a backup into a database. |
| [`export`](#export) | Write the served content only, as JSON lines. |
| [`import`](#import) | Load an export into a database. |
| [`migrate`](#migrate) | Apply pending schema migrations and print the schema version. |
| [`gen-token`](#gen-token) | Print a new random bearer token. |
| [`version`](#version) | Print the version, commit, and Go version. |

## Exit codes

Every command uses the same exit codes:

- **`0`**: Success. `-h` also exits `0`.
- **`1`**: The command failed. The reason is on stderr, for example a validation error or an RPC error such as `rpc error: code = Unauthenticated desc = invalid or missing token`.
- **`2`**: Unknown command, or a flag that isn't defined.

For the RPC errors, see [Errors](./errors.md).

## Environment

| Env var | Read by | Description |
| --- | --- | --- |
| `PRIOMPT_URL` | `publish`, `diff`, `list` | `priompt://<token>@host:port`. Its host is the default `-addr`, and its token is sent when `PRIOMPT_TOKEN` is unset. A value without `priompt://` is a bare `host:port`. |
| `PRIOMPT_TOKEN` | `publish`, `diff`, `list`, `serve` | Clients send it as `authorization: Bearer <token>`. It wins over the token in `PRIOMPT_URL`. `serve` accepts it as an admin token. |
| `PRIOMPT_NATS_URL` | `watch` | Default for `-nats-url`. |
| `PRIOMPT_EMBED_URL`, `PRIOMPT_EMBED_MODEL`, `PRIOMPT_EMBED_KEY` | `put`, `serve` | Embedding endpoint for the semantic diff. |
| `PRIOMPT_ENCRYPTION_KEY` | Every command with `-db` | Base64 of a 32-byte key. Encrypts templates at rest with AES-256-GCM. |

`serve` reads more variables. See [Configuration](./configuration.md).

## init

Mints an admin token with write access, writes it to a tokens file, and prints the commands to start a server and point a client at it. It refuses to overwrite an existing file.

```text
priompt init [-tokens-file tokens.txt] [-addr localhost:8443] [-force]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-tokens-file` | | `tokens.txt` | Tokens file to create. |
| `-addr` | | `localhost:8443` | Server address to put in the printed `PRIOMPT_URL`. |
| `-force` | | `false` | Overwrite an existing tokens file. |

**Example**

```sh
priompt init
```

```text title="Output"
wrote admin token to tokens.txt

  start server:  priompt serve -tokens-file tokens.txt
  point client:  export PRIOMPT_URL=priompt://<token>@localhost:8443
```

On Windows, the last line uses PowerShell syntax: `$env:PRIOMPT_URL = "priompt://<token>@localhost:8443"`.

`<token>` is 64 hex characters. The file holds one line, `<token> rw`. A second run prints `tokens.txt already exists; pass -force to overwrite` and exits `1`.

## serve

Runs the gRPC server. With no flags it listens on `:8443`, stores data in `./priompt.db`, runs NATS on `127.0.0.1:4222` and metrics on `:2112`, and accepts every request without a token.

```text
priompt serve [flags]
```

Every flag, default, and env var is in [Configuration](./configuration.md#serve-flags).

**Example**

```sh
PRIOMPT_TOKEN=<token> priompt serve
```

```text title="Output"
2026/10/18 04:42:32 seeded demo prompt priompt://acme/onboarding/welcome
2026/10/18 04:42:33 priompt v0.7.3 (b917a28eac1eab73904841432d8cfa8da1ea4618) serving on :8443 (tls=false mtls=false auth=1-token cache=mem embed=lexical(offline) nats=127.0.0.1:4222 metrics=:2112 ratelimit=0/s)
2026/10/18 04:42:33 metrics on :2112/metrics
```

`<token>` is an admin token, for example from [`gen-token`](#gen-token). The startup line summarizes the configuration: `auth` counts the static tokens, and `cache`, `embed`, `nats`, `metrics`, and `ratelimit` show what's on.

`serve` exits `1` at startup if a flag combination is unsafe or incomplete. For example, `-nats-addr` on a non-loopback address without `-nats-token`, `-tls-cert` without `-tls-key` (or the reverse), or `-client-ca` without `-tls-cert` and `-tls-key`. It also exits `1` when the database holds encrypted prompts that `PRIOMPT_ENCRYPTION_KEY` can't decrypt, with `encryption key missing or wrong: ...`.

## publish

Validates a prompt and publishes it as a new commit on `main` through a running server. The server moves the served HEAD, clears the cache, and notifies subscribers. Publishing content identical to the served HEAD is a no-op that returns the same hash.

`publish` reads the file as UTF-8. It strips a UTF-8 byte-order mark, converts CRLF line endings to LF, and rejects a UTF-16 file with `<file>: file is UTF-16; save as UTF-8`.

```text
priompt publish -uri <uri> [-file <path|->] [-slot <name>]... [flags]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-uri` | | | Prompt address, `priompt://<org>/<path>`. Required. |
| `-file` | | `-` | Template file. `-` reads stdin. |
| `-slot` | | | A slot the template declares. Repeat it for each slot. |
| `-addr` | `PRIOMPT_URL` (host) | `localhost:8443` | Server address. |
| `-tls` | | `false` | Connect over TLS. |
| `-ca-cert` | | | CA certificate that signed the server's certificate. |
| `-cert`, `-key` | | | Client certificate and key, for a server with `-client-ca` (mTLS). |

`publish` has no branch or message flag. To publish to a branch or set a commit message, call `PublishPrompt` from an SDK or the [gRPC API](./grpc-api.md#publishprompt).

**Example**

```sh
priompt publish -uri priompt://acme/support/agent -file v1.txt -slot org -slot name
```

```text title="Output"
published priompt://acme/support/agent (54de006fe157) — subscribers notified
```

The value in parentheses is the first 12 characters of the version hash. Running the same command again changes nothing:

```text title="Output"
unchanged priompt://acme/support/agent (54de006fe157) — already served; no change event sent
```

## diff

Asks the server to run the semantic diff between the stored prompt and an edited template, with the server's embedding model. Slots come from the stored prompt, so there's no `-slot` flag.

```text
priompt diff -uri <uri> [-file <path|->] [flags]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-uri` | | | Stored prompt to compare against. Required. |
| `-file` | | `-` | Edited template. `-` reads stdin. |
| `-addr` | `PRIOMPT_URL` (host) | `localhost:8443` | Server address. |
| `-tls`, `-ca-cert`, `-cert`, `-key` | | | As in [`publish`](#publish). |

**Example**

```sh
priompt diff -uri priompt://acme/support/agent -file v2.txt
```

```text title="Output"
change @ new lines 1-1 (old 1-1): replace
  Signal 2 (point delta): 0.069
  Signal 3 up:   ±2=0.069 (boundary)
  Signal 3 down: ±2=0.069 (boundary)
  => minor edit
```

The last line of each hunk is the verdict: `minor edit`, `localized tweak`, or `structural`. `priompt diff` exits `0` whatever the verdict is; to gate on a verdict, use `promptctl diff -fail-on`. See [Semantic diff](../concepts/semantic-diff.md).

## list

Lists the served prompts whose URI starts with a prefix, sorted, one per line, with the short version hash.

```text
priompt list [-prefix <uri-prefix>] [flags]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-prefix` | | | URI prefix, for example `priompt://acme/support/`. Empty lists everything. |
| `-addr` | `PRIOMPT_URL` (host) | `localhost:8443` | Server address. |
| `-tls`, `-ca-cert`, `-cert`, `-key` | | | As in [`publish`](#publish). |

With an org-scoped token, an empty prefix lists that token's org, and any other prefix must be inside the org (`priompt://acme` or `priompt://acme/...`).

**Example**

```sh
priompt list -prefix priompt://acme/
```

```text title="Output"
priompt://acme/onboarding/welcome	22e5cc10ac0f
priompt://acme/support/agent	54de006fe157
```

## watch

Subscribes to one prompt's change events on the server's NATS broker and logs each one. With `-exec`, it also runs a command on every change, so it can act as a reload sidecar.

```text
priompt watch -uri <uri> [-nats-url <url>] [-exec <command>]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-uri` | | | Prompt to watch. Required. |
| `-nats-url` | `PRIOMPT_NATS_URL` | `nats://127.0.0.1:4222` | Broker URL. When the server sets `-nats-token`, put your API token in it: `nats://<api-token>@host:4222`. The log shows it as `nats://***@host:4222`. |
| `-exec` | | | Command to run on each change, through `sh -c` (or `cmd /c` on Windows). |

The `-exec` command gets three environment variables:

- **`PRIOMPT_URI`**: The prompt that changed.
- **`PRIOMPT_VERSION`**: The new version hash, all 64 characters.
- **`PRIOMPT_CLASS`**: The verdict: `new`, `minor edit`, `localized tweak`, `structural`, or empty when the server had no verdict.

**Example**

```sh
priompt watch -uri priompt://acme/onboarding/welcome -exec 'echo "reload $PRIOMPT_VERSION ($PRIOMPT_CLASS)"'
```

After a publish to that prompt:

```text title="Output"
2026/10/18 04:42:35 watching priompt://acme/onboarding/welcome on nats://127.0.0.1:4222
2026/10/18 04:42:36 priompt://acme/onboarding/welcome updated -> 222aa819c4988059c57f9c8805fdd451cc76dac2fdc875a98a6b2bfe86896c1a [structural]
reload 222aa819c4988059c57f9c8805fdd451cc76dac2fdc875a98a6b2bfe86896c1a (structural)
```

On Windows, `cmd /c` runs the hook, so write the variables as `%PRIOMPT_VERSION%`.

`watch` runs until you stop it. Only changes to `main` produce events. For the reload policy, see [Hot-reload prompts](../guides/hot-reload.mdx).

## put

Validates a prompt and writes it straight into a database, with no server. When it overwrites a prompt, it runs the semantic diff first and refuses a `structural` change unless you pass `-force`.

```text
priompt put -uri <uri> [-file <path|->] [-slot <name>]... [-db <dsn>] [-force]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-uri` | | | Prompt address. Required. |
| `-file` | | `-` | Template file. `-` reads stdin. |
| `-slot` | | | A slot the template declares. Repeat it for each slot. |
| `-db` | | `priompt.db` | SQLite file path, or a `postgres://` DSN. |
| `-force` | | `false` | Store the prompt even if the change is `structural`. |
| `-embed-url` | `PRIOMPT_EMBED_URL` | Offline lexical embedder | OpenAI-compatible `/v1/embeddings` URL for the pre-write diff. |
| `-embed-model` | `PRIOMPT_EMBED_MODEL` | | Embedding model name. |

`put` commits the prompt to `main` with the author `priompt` and the message `put`. Content identical to the served version is a no-op that prints `unchanged`. `put` writes the database directly, so it sends no notification, and a running server keeps serving its cached copy until the cache TTL expires. Use [`publish`](#publish) for anything a server already serves.

**Example**

```sh
priompt put -uri priompt://acme/onboarding/welcome -file welcome.txt -slot name -slot org
```

```text title="Output"
stored priompt://acme/onboarding/welcome (22e5cc10ac0f)
```

A structural edit without `-force` prints the diff, then exits `1`:

```text title="Output"
change @ new lines 1-5 (old 1-5): replace
  Signal 2 (point delta): 0.550
  Signal 3 up:   ±2=0.550 (boundary)
  Signal 3 down: ±2=0.550 (boundary)
  => structural
structural change detected; re-run with -force to store
```

## backup

Writes the whole store to a JSON-lines file: a header line, then every commit, branch pointer, and served prompt. The summary goes to stderr.

```text
priompt backup [-db <dsn>] [-out <path|->]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-db` | | `priompt.db` | SQLite file path, or a `postgres://` DSN. |
| `-out` | | `-` | Output file. `-` writes to stdout. |

**Example**

```sh
priompt backup -db priompt.db -out priompt.backup
```

```text title="Output"
backed up 2 prompts, 3 commits, 2 branch pointers
```

## restore

Loads a backup. It refuses a database that already has commits, unless you pass `-force` to merge the two histories. It also reads files written by `export`, but those restore no history.

```text
priompt restore [-db <dsn>] [-in <path|->] [-force]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-db` | | `priompt.db` | SQLite file path, or a `postgres://` DSN. |
| `-in` | | `-` | Input file. `-` reads stdin. |
| `-force` | | `false` | Restore into a database that already has commits. |

**Example**

```sh
priompt restore -db fresh.db -in priompt.backup
```

```text title="Output"
restored 2 prompts, 3 commits, 2 branch pointers
```

Into a database with history, without `-force`, it exits `1`:

```text title="Output"
refusing to restore: priompt.db already holds 3 commits.
Restore into an empty database, or pass -force to merge this backup into the existing history.
```

## export

Writes the served content only, one prompt per line, with no commits or branches. Use it to move content between servers. Use [`backup`](#backup) to protect data.

```text
priompt export [-db <dsn>] [-out <path|->]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-db` | | `priompt.db` | SQLite file path, or a `postgres://` DSN. |
| `-out` | | `-` | Output file. `-` writes to stdout. |

```text title="Output"
exported 2 prompts (served content only — commits and branches are not included; use `priompt backup` for those)
```

## import

Loads an export into a database. It validates every prompt first, and writes nothing if one is invalid. Then it commits each prompt to `main` with the message `import`. Prompts that already serve the same content count as unchanged, so running it twice is safe.

```text
priompt import [-db <dsn>] [-in <path|->]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-db` | | `priompt.db` | SQLite file path, or a `postgres://` DSN. |
| `-in` | | `-` | Input file. `-` reads stdin. |

```text title="Output"
imported 2 prompts, 0 unchanged (served content only — history was not part of this file; use `priompt restore` for a full backup)
```

## migrate

Opens the database, applies any pending schema migrations, and prints the schema version. Every command that opens a database also migrates it.

```text
priompt migrate [-db <dsn>]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-db` | | `priompt.db` | SQLite file path, or a `postgres://` DSN. |

```text title="Output"
schema up to date (version 4)
```

## gen-token

Prints a new random bearer token: 32 random bytes as 64 hex characters. Add it to a tokens file with an org and `rw` as needed.

```sh
priompt gen-token
# => <token>
```

## version

```sh
priompt version
```

```text title="Output"
priompt v0.7.3 (commit unknown, go1.26.4)
```

A binary from `go install` reports the module version. A `go build` inside a checkout reports the git commit, and release images report both.
