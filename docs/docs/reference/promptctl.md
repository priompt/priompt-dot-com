---
title: promptctl CLI
sidebar_label: promptctl
description: "Every promptctl command, its flags, output, and exit codes."
doc_type: reference
---

`promptctl` manages prompts stored as `*.prompt` files in a git repository. It validates prompts before they're committed, runs the semantic diff between git revisions, promotes prompts between branches, and publishes them to a Priompt server.

```text
promptctl commit|diff|log|promote|push|pull|publish [args]
```

Run `promptctl` from the root of the repository. It finds every `*.prompt` file under the current directory, and the file's path becomes its address: `acme/support/agent.prompt` is `priompt://acme/support/agent`. The first directory is the org, so a `.prompt` file at the root is invalid.

Slots come from the template: every `{name}` is a slot. `promptctl` has no `-slot` flag.

## Commands

| Command | Description |
| --- | --- |
| [`commit`](#commit) | Validate every prompt, then commit all changes in the working tree. |
| [`diff`](#diff) | Semantic diff of every changed prompt against a git revision. |
| [`log`](#log) | List the commits that touched one prompt. |
| [`promote`](#promote) | Copy one prompt from one branch to another and commit it there. |
| [`push`](#push) | Validate, push to the git remote, and optionally publish to a server. |
| [`pull`](#pull) | Pull from the git remote. |
| [`publish`](#publish) | Publish prompts to a server without touching git. |

## Exit codes

- **`0`**: Success. `diff` without `-fail-on` exits `0` whatever the verdicts are.
- **`1`**: The command failed, or `diff -fail-on` matched a verdict. The reason is on stderr, for example `2 invalid prompt(s); nothing committed`.
- **`2`**: Unknown command, a flag that isn't defined, or an unknown verdict name in `-fail-on`.

To block a structural change in CI, run `promptctl diff -fail-on structural`. See [Gate prompt changes in CI](../guides/ci.mdx).

## Environment

| Env var | Read by | Description |
| --- | --- | --- |
| `PRIOMPT_TOKEN` | `push`, `publish` | Bearer token sent to the server. Needs write access. |
| `PRIOMPT_GIT_TOKEN` | `push`, `pull` | Password for an HTTPS remote. SSH remotes use the running ssh-agent. |
| `PRIOMPT_EMBED_URL`, `PRIOMPT_EMBED_MODEL`, `PRIOMPT_EMBED_KEY` | `diff` | Embedding endpoint for the semantic diff. Without a URL, `diff` uses the offline lexical embedder. |

`promptctl` doesn't read `PRIOMPT_URL`. Pass the server address with `-server`.

## commit

Validates every `*.prompt` file in the working tree, then stages all changes and commits them. One invalid prompt blocks the whole commit. The author comes from the repository's git config.

```text
promptctl commit -m <message>
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-m` | | | Commit message. Required. |

**Example**

```sh
promptctl commit -m "add support agent"
```

```text title="Output"
committed d9643f658d3c
```

With invalid prompts, each one is listed and nothing is committed:

```text title="Output"
invalid acme/support/bad.prompt: template uses doubled braces near "{{name}}\n": slots are written {name}; {{name}} is an escaped literal brace to a formatter, not a slot
invalid root.prompt: uri has an org but no prompt path
2 invalid prompt(s); nothing committed
```

For every validation message, see [Errors](./errors.md#invalidargument).

## diff

Runs the semantic diff for every `*.prompt` file that differs between a git revision and the working tree, including added and deleted files.

```text
promptctl diff [-fail-on <verdicts>] [<revision>]
```

`<revision>` is any git revision: a branch, a tag, a commit hash, or `HEAD~1`. The default is `HEAD`.

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-fail-on` | | | Comma-separated verdicts that make `diff` exit `1`: `new`, `structural`, `tweak` (`localized tweak`), `minor` (`minor edit`). Empty never fails. |

A prompt that doesn't exist in `<revision>` prints `new prompt (not in <revision>)` and the verdict `new`.

**Example**

```sh
promptctl diff
```

```text title="Output"
## acme/support/agent.prompt
change @ new lines 2-2 (old 2-2): replace
  Signal 2 (point delta): 0.329
  Signal 3 up:   ±2=0.114 (boundary)
  Signal 3 down: ±2=0.134 (boundary)
  => localized tweak

```

With no changes, it prints `no prompt changes vs HEAD`. An unknown revision prints `unknown ref "<revision>": reference not found` and exits `1`.

With `-fail-on`, a match prints the matching prompts on stderr after the diff and exits `1`:

```sh
promptctl diff -fail-on structural main
```

```text title="Output"
## acme/support/agent.prompt
change @ new lines 4-4 (old 4-4): replace
  Signal 2 (point delta): 0.908
  Signal 3 up:   ±2=0.369 ±4=0.254 (boundary)
  Signal 3 down: ±2=0.494 (boundary)
  => structural

## acme/support/greeting.prompt
new prompt (not in main)
  => new

2026/10/19 01:03:58 diff: 1 prompt(s) match -fail-on structural: acme/support/agent.prompt (structural)
```

## log

Lists the commits that touched one prompt file, newest first, as a short hash and the first line of the message.

```text
promptctl log <file.prompt>
```

**Example**

```sh
promptctl log acme/support/agent.prompt
```

```text title="Output"
2b638773 cover refunds
d9643f65 add support agent
```

## promote

Copies one prompt from the `<from>` branch onto the `<to>` branch, validates it, and commits it on `<to>` with the message `promote <file>: <from> -> <to>`. Both branches must exist, and the working tree should be clean.

```text
promptctl promote <file.prompt> <from> <to>
```

**Example**

```sh
promptctl promote acme/support/agent.prompt dev prod
```

```text title="Output"
promoted acme/support/agent.prompt onto prod (18bd98a235c4)
```

`promote` returns to the branch you started on. If the prompt already matches, it prints `already up to date: acme/support/agent.prompt on prod matches dev` and exits `0`.

## push

Validates every prompt, pushes all local branches to `origin`, and then, with `-server`, publishes every `*.prompt` file in the working tree to that server.

```text
promptctl push [-server <host:port>] [-tls [-ca-cert <file>]]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-server` | | | Server to publish to after the push. Without it, `push` only pushes. |
| `-tls` | | `false` | Connect to `-server` over TLS. Without `-ca-cert`, it trusts the system CA roots. |
| `-ca-cert` | | | CA certificate that signed the server's certificate. |

**Example**

```sh
promptctl push -server localhost:8443
```

```text title="Output"
pushed
published priompt://acme/support/agent (03dd6040bee8)
```

When the remote already has every commit, the first line is `already up to date`, and the publish step still runs. Publishing unchanged content is a no-op on the server, so only changed prompts notify subscribers. The server records the publish on `main`, whichever git branch is checked out.

## pull

Pulls the current branch from `origin`.

```text
promptctl pull
```

```text title="Output"
already up to date
```

Without a remote named `origin`, `push` and `pull` print `remote not found` and exit `1`.

## publish

Publishes prompts to a server without touching git. With no paths, it publishes every `*.prompt` file in the working tree.

```text
promptctl publish -server <host:port> [-tls [-ca-cert <file>]] [<file.prompt>...]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-server` | | | Server address. Required. |
| `-tls` | | `false` | Connect over TLS. Without `-ca-cert`, it trusts the system CA roots. |
| `-ca-cert` | | | CA certificate that signed the server's certificate. |

**Example**

```sh
PRIOMPT_TOKEN=<token> promptctl publish -server localhost:8443 acme/support/agent.prompt
```

```text title="Output"
published priompt://acme/support/agent (0d7b8729099a)
```

`<token>` is a token with write access. Each prompt is validated before it's sent, and the first failure stops the run.
