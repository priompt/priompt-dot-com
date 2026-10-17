---
title: priompt CLI
---

# `priompt` command reference

One binary does two jobs: it runs the server, and it operates it.

```text
priompt init       first-run setup: mint an admin token + print a PRIOMPT_URL
priompt serve      run the gRPC server
priompt put        validate and store a prompt in a local database (no server needed)
priompt publish    publish a new version through a server and notify subscribers
priompt diff       semantic diff of a stored prompt vs an edited file, via a server
priompt list       browse a URI prefix like a filesystem, via a server
priompt watch      subscribe to a prompt's change events (NATS)
priompt backup     full backup: prompts + commit history + branches
priompt restore    load a full backup (refuses to overwrite history without -force)
priompt export     served content only, as JSON lines (no history)
priompt import     load a served-content export
priompt migrate    apply pending schema migrations and print the version
priompt gen-token  print a fresh random bearer token
```

The client commands (`publish`, `diff`, `list`) default `-addr` to the host in `PRIOMPT_URL` and send `PRIOMPT_TOKEN` (or the URL's token).

## init

| Flag | Default | |
| --- | --- | --- |
| `-tokens-file` | `tokens.txt` | file to create |
| `-addr` | `localhost:8443` | address to embed in the printed `PRIOMPT_URL` |
| `-force` | `false` | overwrite an existing tokens file |

## serve

See [Configuration](./configuration.md#serve-flags) for every flag.

## put

Writes directly to a database, so no server needs to be running. When it overwrites an existing prompt, it runs a semantic diff first and **refuses a structural change** unless you pass `-force`.

| Flag | Default | |
| --- | --- | --- |
| `-uri` | | `priompt://` address |
| `-file` | `-` | template file (`-` for stdin) |
| `-slot` | | declared slot (repeatable) |
| `-db` | `priompt.db` | SQLite path or `postgres://` DSN |
| `-force` | `false` | store even if the edit is structural |
| `-embed-url` / `-embed-model` | `$PRIOMPT_EMBED_*` | model for the pre-commit check |

```sh
priompt put -uri priompt://acme/onboarding/welcome -file welcome.txt -slot name -slot org
```

## publish

| Flag | |
| --- | --- |
| `-addr` | server address |
| `-uri`, `-file`, `-slot` | as in `put` |
| `-tls`, `-ca-cert`, `-cert`, `-key` | TLS / mTLS |

```sh
priompt publish -uri priompt://acme/support/agent -file v2.txt -slot name
# published priompt://acme/support/agent (1e8284f35650) — subscribers notified
```

## diff

`-addr`, `-uri`, `-file`, and the TLS flags. Slots are read from the stored prompt, so there's no `-slot` flag.

## list

`-addr`, `-prefix` (empty lists everything you're scoped to), and the TLS flags.

```sh
priompt list -prefix priompt://acme/support/
# priompt://acme/support/tier1/agent   1e8284f35650
# priompt://acme/support/tier2/agent   80ec4e4d88e6
```

## watch

| Flag | Default | |
| --- | --- | --- |
| `-uri` | | prompt to watch |
| `-nats-url` | `$PRIOMPT_NATS_URL` or `nats://127.0.0.1:4222` | `nats://<token>@host:4222` when the broker requires a token |
| `-exec` | | command run on each change through the OS shell. It receives `PRIOMPT_VERSION` and `PRIOMPT_CLASS`. |

## backup / restore / export / import / migrate

| Command | Flags |
| --- | --- |
| `backup`, `export` | `-db`, `-out` (`-` = stdout) |
| `restore` | `-db`, `-in` (`-` = stdin), `-force` |
| `import` | `-db`, `-in` |
| `migrate` | `-db` |

All of them honor `PRIOMPT_ENCRYPTION_KEY`. See [Storage](../operations/storage.md#backup-and-restore) for when to use which.
