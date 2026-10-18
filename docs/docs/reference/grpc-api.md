---
title: gRPC API
sidebar_label: gRPC API
description: "Every PromptService RPC with its request and response fields, auth requirement, errors, and a grpcurl example."
doc_type: reference
---

The Priompt server exposes one gRPC service, `priompt.v1.PromptService`, defined in `proto/priompt/v1/prompt.proto` in the `proto` repository. The SDKs, the CLIs, and the web UI all call these nine RPCs.

## RPCs

| RPC | Writes | Description |
| --- | --- | --- |
| [`GetPrompt`](#getprompt) | No | Fetch the served version of a prompt, or a pinned branch or commit. |
| [`ListPrompts`](#listprompts) | No | List the served prompts under a URI prefix. |
| [`DiffPrompt`](#diffprompt) | No | Semantic diff of the served version against an edited template. |
| [`PublishPrompt`](#publishprompt) | Yes | Validate and commit a new version to a branch. |
| [`History`](#history) | No | Commit log of a branch, newest first. |
| [`CreateBranch`](#createbranch) | Yes | Create a branch at another branch's tip. |
| [`MergeBranch`](#mergebranch) | Yes | Merge one branch into another with a merge commit. |
| [`DiffCommits`](#diffcommits) | No | Semantic diff between any two commits. |
| [`SetBranch`](#setbranch) | Yes | Point a branch at an existing commit, to roll back or pin. |

## Conventions

- **Auth**: Send the metadata header `authorization: Bearer <token>` when the server has auth on. Every RPC checks that the token's org matches the URI's org. The RPCs marked **Writes** also need a token with write access. See [Errors](./errors.md#permissiondenied).
- **Branches**: An empty branch field means `main`. Only `main` is served: changes to other branches don't move the served version, clear the cache, or notify subscribers.
- **Hashes**: `version_hash` is the SHA-256 of a prompt's content (template and slots). `hash` and `commit_hash` identify a commit: the SHA-256 of its URI, content hash, parents, author, and message. Every hash is 64 hex characters, and RPCs only accept full commit hashes. See the [Glossary](./glossary.md).
- **Errors**: Standard gRPC status codes. Each RPC section lists its own; [Errors](./errors.md) has the cause and fix for each.
- **Reflection**: The server doesn't register gRPC reflection, so tools such as grpcurl need the `.proto` file.

The examples use grpcurl from a checkout of the `proto` repository against a local server:

```sh
call() {
  grpcurl -plaintext -import-path proto -proto priompt/v1/prompt.proto \
    -H "authorization: Bearer $PRIOMPT_TOKEN" \
    -d "$2" localhost:8443 "priompt.v1.PromptService/$1"
}
```

grpcurl takes and prints fields in lowerCamelCase (`versionHash`) and omits fields that hold their default value. Examples ran against a server without auth, which records commit authors as `anonymous`.

## GetPrompt

Returns the served version of a prompt (the tip of `main`), or the version at `ref`. Without `ref`, the response comes from the server cache when it can.

**Request**: `GetPromptRequest`

| Field | Type | Description |
| --- | --- | --- |
| `uri` | `string` | Prompt address, `priompt://<org>/<path>`. |
| `ref` | `string` | Optional. A branch name, or a full commit hash of this prompt. Empty returns the served version. |

**Response**: `GetPromptResponse`

| Field | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The prompt address. |
| `template` | `string` | The template, with `{slot}` placeholders. |
| `slots` | `repeated string` | The slot names the template declares. |
| `version_hash` | `string` | Hash of the content. |
| `commit_hash` | `string` | The commit served. Set only when `ref` is set. |

**Errors**: `NotFound`, `DataLoss`, `PermissionDenied`.

```sh
call GetPrompt '{"uri":"priompt://acme/support/agent","ref":"refunds"}'
```

```json title="Output"
{
  "uri": "priompt://acme/support/agent",
  "template": "You are a support agent for {org}.\nAnswer billing and refund questions only.\nBe polite.\n",
  "slots": [
    "org"
  ],
  "versionHash": "0c07a41e74813f83275d38037df660b3416afa2473ad3d42c3f44e911855edac",
  "commitHash": "4498a4bc2f408ddfc7f2565ee5ab037fd1598476a3a6fc00205c1ca3e2f00641"
}
```

## ListPrompts

Returns the served prompts whose URI starts with `prefix`, sorted by URI. A "repo" is a prefix: split the URIs on `/` to build a tree.

**Request**: `ListPromptsRequest`

| Field | Type | Description |
| --- | --- | --- |
| `prefix` | `string` | URI prefix, such as `priompt://acme/support/`. Empty lists every prompt, which only an admin token may do. |

**Response**: `ListPromptsResponse`

| Field | Type | Description |
| --- | --- | --- |
| `entries` | `repeated PromptEntry` | One entry per prompt: `uri` and `version_hash`. |

With an org-scoped token, an empty `prefix` lists the token's org.

**Errors**: `PermissionDenied` when an org-scoped token lists outside `priompt://<org>` or `priompt://<org>/...`.

```sh
call ListPrompts '{"prefix":"priompt://acme/"}'
```

```json title="Output"
{
  "entries": [
    {
      "uri": "priompt://acme/onboarding/welcome",
      "versionHash": "22e5cc10ac0f3d70fd97c6b554a36abcb3173731412212dc222106e9cbcac402"
    },
    {
      "uri": "priompt://acme/support/agent",
      "versionHash": "0085fceb6d1d12a6a399bcaef2c40bb20a581966354ee2385b1d99f33c7ca247"
    }
  ]
}
```

## DiffPrompt

Runs the semantic diff between the served version and an edited template, with the server's embedding model. Nothing is stored.

**Request**: `DiffPromptRequest`

| Field | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The stored prompt, the original side of the diff. |
| `new_template` | `string` | The edited template. |

**Response**: `DiffPromptResponse`, a list of [`Change`](#change) messages, one per changed region. An empty list means no change.

**Errors**: `NotFound`, `Internal` (`diff failed`, when the embedding endpoint fails), `PermissionDenied`.

```sh
call DiffPrompt '{"uri":"priompt://acme/support/agent","newTemplate":"You are a support agent for {org}.\nAnswer billing and refund questions only.\nBe polite.\n"}'
```

```json title="Output"
{
  "changes": [
    {
      "oldStart": 1,
      "oldEnd": 2,
      "newStart": 1,
      "newEnd": 2,
      "kind": "replace",
      "pointDelta": 0.18350341907227385,
      "up": [
        {
          "radius": 2,
          "delta": 0.0658012670061725
        }
      ],
      "down": [
        {
          "radius": 2,
          "delta": 0.1339745962155613
        }
      ],
      "upBoundary": true,
      "downBoundary": true,
      "classification": "localized tweak"
    }
  ]
}
```

### Change

| Field | Type | Description |
| --- | --- | --- |
| `old_start`, `old_end` | `int32` | The changed lines in the original, as a 0-based, half-open range. |
| `new_start`, `new_end` | `int32` | The changed lines in the edit, as a 0-based, half-open range. |
| `kind` | `string` | `replace`, `insert`, or `delete`. |
| `point_delta` | `double` | Meaning shift at the changed lines, from `0` to `1`. |
| `up`, `down` | `repeated Window` | How the shift spreads above and below the change. Each `Window` has a `radius` in lines and a `delta`. |
| `up_boundary`, `down_boundary` | `bool` | `true` when that curve reached the start or end of the template before it flattened. |
| `classification` | `string` | The verdict: `minor edit`, `localized tweak`, or `structural`. |

How the signals and verdicts work is in [Semantic diff](../concepts/semantic-diff.md).

## PublishPrompt

Validates the prompt and commits it to a branch. On `main` it also moves the served version, clears the cache, and notifies subscribers with the verdict of the change. Publishing content that equals the served version of `main` is a no-op: no commit, no event, and the same `version_hash`.

**Request**: `PublishPromptRequest`

| Field | Type | Description |
| --- | --- | --- |
| `uri` | `string` | Prompt address. |
| `template` | `string` | The template. |
| `slots` | `repeated string` | Every slot the template uses, and no others. |
| `message` | `string` | Optional commit message. |
| `branch` | `string` | Target branch. Empty means `main`. |

**Response**: `PublishPromptResponse`

| Field | Type | Description |
| --- | --- | --- |
| `version_hash` | `string` | Hash of the published content. |

**Errors**: `InvalidArgument`, `PermissionDenied`, `Aborted`, `Unavailable`.

The commit's author is the JWT `sub` claim, else the static token's org, else `anonymous`.

```sh
call PublishPrompt '{"uri":"priompt://acme/support/agent","template":"You are a support agent for {org}.\nAnswer billing questions only.","slots":["org"],"message":"first version"}'
```

```json title="Output"
{
  "versionHash": "0085fceb6d1d12a6a399bcaef2c40bb20a581966354ee2385b1d99f33c7ca247"
}
```

## History

Returns a branch's commits, newest first, following first parents only (like `git log --first-parent`).

**Request**: `HistoryRequest`

| Field | Type | Description |
| --- | --- | --- |
| `uri` | `string` | Prompt address. |
| `branch` | `string` | Branch. Empty means `main`. |

**Response**: `HistoryResponse` with `commits`, a list of `Commit`:

| Field | Type | Description |
| --- | --- | --- |
| `hash` | `string` | Commit hash. |
| `version_hash` | `string` | Hash of the content at this commit. |
| `parent` | `string` | Previous commit on the branch. Empty for the first commit. |
| `parent2` | `string` | The merged branch's tip. Set only on merge commits. |
| `author` | `string` | Who published it. |
| `message` | `string` | Commit message. |
| `created_at` | `string` | UTC timestamp in RFC 3339 with variable-length fractional seconds (Go's `RFC3339Nano`), for example `2026-10-18T09:41:10.123456Z`. Don't assume a fixed width. |

**Errors**: `NotFound` (`branch not found`), `PermissionDenied`.

```sh
call History '{"uri":"priompt://acme/support/agent"}'
```

```json title="Output"
{
  "commits": [
    {
      "hash": "7243eec584c5c7475942b4b21d453b4c73120bbb3496dd883244b66d1a7c3ce8",
      "versionHash": "fe8bf00e2bce93f6dc5112bcaf5595a59515054e688f1be2dfc8b3e22fcf70a4",
      "parent": "360bb2f4f27076bee7f99c0e6533b801982956c7e4b06ef5a66c437e1cbc9fbb",
      "author": "anonymous",
      "message": "add tone",
      "createdAt": "2026-10-18T04:45:25.5540023Z"
    },
    {
      "hash": "360bb2f4f27076bee7f99c0e6533b801982956c7e4b06ef5a66c437e1cbc9fbb",
      "versionHash": "0085fceb6d1d12a6a399bcaef2c40bb20a581966354ee2385b1d99f33c7ca247",
      "author": "anonymous",
      "message": "first version",
      "createdAt": "2026-10-18T04:45:11.3913954Z"
    }
  ]
}
```

## CreateBranch

Creates a branch that points at the tip of another branch.

**Request**: `CreateBranchRequest`

| Field | Type | Description |
| --- | --- | --- |
| `uri` | `string` | Prompt address. |
| `name` | `string` | New branch name. Required. |
| `from` | `string` | Source branch. Empty means `main`. |

**Response**: `CreateBranchResponse`

| Field | Type | Description |
| --- | --- | --- |
| `commit_hash` | `string` | The commit the new branch points at. |

**Errors**: `InvalidArgument` (`branch name required`), `AlreadyExists`, `NotFound`, `PermissionDenied`.

```sh
call CreateBranch '{"uri":"priompt://acme/support/agent","name":"refunds"}'
```

```json title="Output"
{
  "commitHash": "7243eec584c5c7475942b4b21d453b4c73120bbb3496dd883244b66d1a7c3ce8"
}
```

## MergeBranch

Merges `from` into `into` and records a merge commit with two parents. The merge takes the content of `from`; there's no three-way content merge. Merging into `main` moves the served version, clears the cache, and notifies subscribers with the verdict when the content changes.

**Request**: `MergeBranchRequest`

| Field | Type | Description |
| --- | --- | --- |
| `uri` | `string` | Prompt address. |
| `into` | `string` | Target branch. Empty means `main`. |
| `from` | `string` | Source branch. Required. |
| `message` | `string` | Optional commit message. |

**Response**: `MergeBranchResponse`

| Field | Type | Description |
| --- | --- | --- |
| `commit_hash` | `string` | The merge commit. |

**Errors**: `NotFound` (`branch not found`, also when `from` is empty), `Aborted`, `Unavailable`, `PermissionDenied`.

```sh
call MergeBranch '{"uri":"priompt://acme/support/agent","from":"refunds","message":"ship refunds"}'
```

```json title="Output"
{
  "commitHash": "9c5623c2b72764219b216a469f4b757d906fc1fff6a77b8a8d254b05f39b9e65"
}
```

## DiffCommits

Runs the semantic diff between two commits of the prompt at `uri`. Both commits must belong to that prompt; a commit of any other prompt returns `commit not found`. The response has the same shape as [`DiffPrompt`](#diffprompt).

**Request**: `DiffCommitsRequest`

| Field | Type | Description |
| --- | --- | --- |
| `uri` | `string` | Prompt address. |
| `from_hash` | `string` | The original commit. |
| `to_hash` | `string` | The edited commit. |

**Response**: `DiffPromptResponse`, a list of [`Change`](#change) messages.

**Errors**: `NotFound` (`commit not found`), `Internal`, `PermissionDenied`.

```sh
call DiffCommits '{"uri":"priompt://acme/support/agent","fromHash":"7243eec584c5c7475942b4b21d453b4c73120bbb3496dd883244b66d1a7c3ce8","toHash":"4498a4bc2f408ddfc7f2565ee5ab037fd1598476a3a6fc00205c1ca3e2f00641"}'
```

The output is one `replace` change classified `localized tweak`, like the `DiffPrompt` example.

## SetBranch

Points a branch at an existing commit of the same prompt. On `main` this is a rollback: the served version changes at once, the cache is cleared, and subscribers are notified with the verdict of the change. Nothing is deleted, and the later commits stay reachable by hash.

**Request**: `SetBranchRequest`

| Field | Type | Description |
| --- | --- | --- |
| `uri` | `string` | Prompt address. |
| `branch` | `string` | Branch to move. Empty means `main`. |
| `commit_hash` | `string` | Full hash of the commit to point at. Required. |

**Response**: `SetBranchResponse`

| Field | Type | Description |
| --- | --- | --- |
| `version_hash` | `string` | Hash of the content the branch now holds. |

**Errors**: `InvalidArgument` (`commit_hash required`), `NotFound`, `Unavailable`, `PermissionDenied`.

```sh
call SetBranch '{"uri":"priompt://acme/support/agent","commitHash":"7243eec584c5c7475942b4b21d453b4c73120bbb3496dd883244b66d1a7c3ce8"}'
```

```json title="Output"
{
  "versionHash": "fe8bf00e2bce93f6dc5112bcaf5595a59515054e688f1be2dfc8b3e22fcf70a4"
}
```

## Change events

When `main` moves, the server publishes an event on its embedded NATS broker (`-nats-addr`). The subject is `priompt.` followed by the URI's segments joined by `.`, with every byte other than a letter, a digit, `_`, or `-` percent-encoded inside a segment: `priompt://acme/support/agent` becomes `priompt.acme.support.agent`, and `priompt://acme.corp/x/a.b` becomes `priompt.acme%2Ecorp.x.a%2Eb`. The payload is JSON:

```json
{"version":"222aa819c4988059c57f9c8805fdd451cc76dac2fdc875a98a6b2bfe86896c1a","classification":"structural"}
```

- **`version`**: The new version hash.
- **`classification`**: `new` for a first publish, else the worst verdict of the change. Absent when the server couldn't compute one.

`priompt watch` and the SDKs' subscribe methods read these events. For how to act on them, see [Hot-reload prompts](../guides/hot-reload.mdx).
