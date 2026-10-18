---
title: Errors
sidebar_label: Errors
description: "Every gRPC status the server returns, what causes it, and how to fix it."
doc_type: reference
---

Every Priompt RPC fails with a standard gRPC status code and a short, stable message. This page lists each code the server returns, the exact message, its cause, and the fix.

## Codes

| Code | Number | Retry | Typical cause |
| --- | --- | --- | --- |
| [`InvalidArgument`](#invalidargument) | 3 | No | The prompt failed validation, or a required field is empty. |
| [`NotFound`](#notfound) | 5 | No | No prompt, branch, ref, or commit at that identifier. |
| [`AlreadyExists`](#alreadyexists) | 6 | No | `CreateBranch` with a name that's taken. |
| [`PermissionDenied`](#permissiondenied) | 7 | No | The token's org doesn't match the URI, or a read-only token tried to write. |
| [`ResourceExhausted`](#resourceexhausted) | 8 | After a pause | Over the per-org rate limit. |
| [`Aborted`](#aborted) | 10 | Yes, re-read first | The branch moved during a write. |
| [`Unimplemented`](#unimplemented) | 12 | No | The server doesn't have that RPC. |
| [`Internal`](#internal) | 13 | Maybe | The embedding endpoint or the database failed unexpectedly. |
| [`Unavailable`](#unavailable) | 14 | Yes | The server, the database, or the shared cache is unreachable. |
| [`DataLoss`](#dataloss) | 15 | No | A stored prompt failed serve-time validation. |
| [`Unauthenticated`](#unauthenticated) | 16 | No | Missing, wrong, or expired token. |
| [`Canceled`, `DeadlineExceeded`](#canceled-and-deadlineexceeded) | 1, 4 | Yes | The client gave up before the server answered. |

The server checks a request in this order: authentication, then the rate limit, then the org scope, then the write grant, then validation, then storage. The first check that fails decides the code.

## How each client shows an error

- **`priompt` and `promptctl`** print the status on stderr and exit with code `1`:

  ```text
  rpc error: code = PermissionDenied desc = token is read-only
  ```

- **grpcurl** prints the code and the message:

  ```text
  ERROR:
    Code: NotFound
    Message: prompt "priompt://acme/support/missing" not found
  ```

- **The SDKs** raise the gRPC error of their language with the same code and message. See [Python](../sdks/python.mdx) and [JavaScript](../sdks/javascript.mdx).

The server logs the full cause of every `Internal` and storage `Unavailable` error. The client only gets the stable sentence, so database and embedding-endpoint details never cross the wire.

## InvalidArgument

The request can't succeed as sent. Don't retry it unchanged.

| Message | Cause | Fix |
| --- | --- | --- |
| `invalid prompt: <reason>` | `PublishPrompt` with a prompt that fails validation. The common reasons are listed below. | Fix the template, the slot list, or the URI. |
| `branch name required` | `CreateBranch` with an empty `name`. | Set `name`. |
| `commit_hash required` | `SetBranch` with an empty `commit_hash`. | Set `commit_hash` to a full commit hash from `History`. |

The validation reasons come from `github.com/priompt/proto/validate`, the same check `priompt put`, `promptctl commit`, and serve-time validation use:

| Reason | Fix |
| --- | --- |
| `uri is empty`, `uri must start with "priompt://"` | Use an address like `priompt://acme/support/agent`. |
| `uri has no org segment`, `uri has an org but no prompt path` | Add the org and at least one path segment after it. |
| `uri has an empty path segment`, `uri path segment "<s>" contains illegal characters` | Use letters, digits, `_`, `-`, and single dots between them. |
| `template is empty` | Send a non-empty template. |
| `slot name is empty` | Remove the empty entry from `slots`. |
| `template uses undeclared slots: <names>` | Add each `{name}` in the template to `slots`. |
| `declared slots never used in template: <names>` | Remove the unused names from `slots`, or use them in the template. |
| `template uses doubled braces near "<text>"` | Write a slot as `{name}`. A formatter reads `{{name}}` as a literal brace. |
| `template has an unclosed or malformed placeholder near "<text>"`, `template has an unmatched "}" near "<text>"` | Close the brace, or remove the stray one. |

**Example**

```text
ERROR:
  Code: InvalidArgument
  Message: invalid prompt: template uses undeclared slots: name
```

## NotFound

The identifier doesn't exist, or it exists for a different prompt. Don't retry.

| Message | RPCs | Fix |
| --- | --- | --- |
| `prompt "<uri>" not found` | `GetPrompt`, `DiffPrompt` | Check the URI with `ListPrompts`. Publish the prompt first if it's new. |
| `ref "<ref>" not found for "<uri>"` | `GetPrompt` with `ref` | Use a branch name, or a full 64-character commit hash of this prompt. Short hashes and version hashes aren't accepted. |
| `branch not found` | `History`, `CreateBranch`, `MergeBranch` | The prompt has no such branch, or the prompt has no commits yet. `MergeBranch` needs `from`. |
| `commit not found` | `DiffCommits` | Use full commit hashes from `History` of the same prompt. Both commits must belong to the requested URI. |
| `commit "<hash>" not found for "<uri>"` | `SetBranch` | Use a full commit hash that belongs to this prompt. |

## AlreadyExists

| Message | Cause | Fix |
| --- | --- | --- |
| `branch already exists` | `CreateBranch` with a `name` the prompt already has. | Pick another name, or move the existing branch with `SetBranch`. |

## PermissionDenied

The token is valid but isn't allowed to do this. Don't retry with the same token.

| Message | Cause | Fix |
| --- | --- | --- |
| `token is read-only` | `PublishPrompt`, `CreateBranch`, `MergeBranch`, or `SetBranch` with a token that has no write grant. | Use a token with `rw` in the tokens file, or a JWT with `"rw": true`. |
| `token not authorized for org "<org>"` | The token is scoped to another org than the URI's first segment. | Use a token for that org, or an admin token (no org). |
| `token not authorized for prefix "<prefix>"` | `ListPrompts` with an org-scoped token and a prefix outside its org. An empty prefix is outside every org. | Pass `priompt://<org>` or `priompt://<org>/<path>` as the prefix. |

In v0.7.2 and earlier, the tokens file ignores whole-line `#` comments only. A trailing comment on a token line becomes part of the line, and its last plain word becomes the org: `<token> acme rw # ci runner` scopes the token to the org `runner`. Put comments on their own line, or upgrade to v0.7.3, where a trailing `#` starts a comment.

**Example**

```text
ERROR:
  Code: PermissionDenied
  Message: token not authorized for prefix ""
```

## ResourceExhausted

| Message | Cause | Fix |
| --- | --- | --- |
| `rate limit exceeded for org "<org>"` | The caller's org used up its token bucket (`-rate-limit`, `-rate-burst`). | Back off and retry, or raise the limit. |

Every org has its own bucket on each server node. Admin tokens and servers without auth share the bucket of the empty org `""`. See [Monitoring](../operations/monitoring.md).

## Aborted

| Message | Cause | Fix |
| --- | --- | --- |
| `the branch moved while this write was in flight; re-read and retry` | Another write moved the same branch between this write's read and its commit. | Read the prompt again, then retry the write. |

A publish that returns `Aborted` didn't happen. Nothing was half-written. In a test with 30 concurrent publishes to one prompt, 29 succeeded and 1 returned `Aborted`.

## Unimplemented

| Message | Cause | Fix |
| --- | --- | --- |
| `unknown method <Method> for service priompt.v1.PromptService` | The client called an RPC this server doesn't have. For example, a client built from a newer `prompt.proto` calls an older server. | Upgrade the server, or use the RPCs listed in the [gRPC API](./grpc-api.md). |

The server has no reflection service, so `grpcurl list` fails with `server does not support the reflection API`. Pass the `.proto` file to grpcurl instead.

## Internal

| Message | Cause | Fix |
| --- | --- | --- |
| `diff failed` | `DiffPrompt` or `DiffCommits` couldn't get embeddings from `-embed-url`. | Check that the embedding endpoint is reachable and that `-embed-model` and `PRIOMPT_EMBED_KEY` are right. The server log has the cause. |
| `<operation> failed` | An unexpected storage error during `publish`, `lookup`, `list`, `branch`, `resolve`, `set branch`, or `diff commits`. | Read the server log line that starts with the same operation name. |

A failing embedding endpoint doesn't fail a publish. The publish succeeds, and subscribers get the change event without a verdict. The server logs `classify: semantic verdict unavailable, notifying without one`.

## Unavailable

`Unavailable` means "try again". It has three causes.

| Message | Cause | Fix |
| --- | --- | --- |
| `the change is stored but the cache could not be cleared; retry so readers see it` | `PublishPrompt`, `MergeBranch` into `main`, or `SetBranch` on `main` stored the change, but the shared Redis cache didn't respond. | Fix Redis, then retry the same call. The retry clears the cache and returns success. |
| `storage backend unavailable` | The database refused the connection, timed out, or was locked. | Check the database and the `-db` value, then retry. |
| `connection error: ...` | The client couldn't reach the server, or the TLS setup doesn't match. | See below. |

Connection errors come from the client, before any request reaches the server:

- Nothing listens at the address: check `-addr`, the host in `PRIOMPT_URL`, and the firewall.
- `error reading server preface: EOF`: the server uses TLS and the client doesn't. Add `-tls`, plus `-ca-cert` for a certificate from a private CA.
- `authentication handshake failed: tls: failed to verify certificate`: the client doesn't trust the server's certificate. Pass the CA that signed it with `-ca-cert`.

For TLS and certificates, see [Security](../operations/security.md).

## DataLoss

| Message | Cause | Fix |
| --- | --- | --- |
| `stored prompt invalid: <reason>` | `GetPrompt` read a stored prompt that fails validation. The server refuses to serve it rather than hand a broken prompt to an agent. | Publish a valid version, or roll `main` back with `SetBranch`. |

A database written through the server or the `priompt` CLI never holds an invalid prompt. This error means the data was changed outside them, for example by editing the database directly, or by `priompt import` in v0.7.2 or earlier, which didn't validate.

## Unauthenticated

| Message | Cause | Fix |
| --- | --- | --- |
| `invalid or missing token` | No `authorization` header, a token that isn't in the tokens file, or a JWT that fails verification (bad signature, expired, unknown key). | Send `authorization: Bearer <token>`. For JWTs, request a fresh one from `priompt-auth`. |
| `token expired` | A static token whose expiry date in the tokens file has passed. | Use a current token, or update the expiry. |

The server only checks tokens when it has some: a `-tokens-file`, `PRIOMPT_TOKEN`, or `-auth-jwks-url`. Without any of them, every request is accepted with admin rights. The CLIs send `PRIOMPT_TOKEN`, or the token in `PRIOMPT_URL`. See [`priompt-auth`](./priompt-auth.md) and [Configuration](./configuration.md).

## Canceled and DeadlineExceeded

| Message | Cause | Fix |
| --- | --- | --- |
| `request canceled` | The client canceled the call. | None needed. Retry if the cancel wasn't intended. |
| `request deadline exceeded`, or a client-side deadline error | The client's deadline passed before the server answered. | Raise the client timeout, or find out why the server is slow (database, embedding endpoint). |
