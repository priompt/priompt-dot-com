---
title: Prompts and addresses
sidebar_label: Prompts
description: What a Priompt prompt is, how its address works, and the rules every prompt must pass before Priompt stores or serves it.
doc_type: concept
---

A **prompt** is a versioned, validated template stored at a `priompt://` address. This page covers the four fields of a prompt, how addresses and orgs work, and the validation rules Priompt enforces on every write and every read.

## Fields

Every prompt has four fields:

| Field | Example | Meaning |
| --- | --- | --- |
| `uri` | `priompt://acme/onboarding/welcome` | The prompt's unique address. |
| `template` | `Hi {name}, welcome to {org}!` | The text, with placeholders. |
| `slots` | `["name", "org"]` | The declared slots, in order. |
| `version_hash` | `e345dcf74d01…` | A fingerprint of the content. The server computes it. |

A **slot** is a named blank like `{name}` that your app fills in. Agents fetch the template and fill in the slots themselves. Priompt doesn't render templates or call a model.

## Addresses

An address has an org and a path:

```text
priompt://acme/support/agents/tier1/greeting
          └┬─┘ └──────────────┬────────────┘
          org        path (any depth)
```

- **Org**: the first segment, `acme` here. The org is the unit of access control: a token scoped to `acme` can reach only `priompt://acme/…`. See [Orgs, tokens, and access](./access-control.md).
- **Path**: one or more segments after the org. An address needs at least one, so `priompt://acme` alone isn't a prompt.
- **Segments**: letters, digits, `_`, and `-`, optionally joined by dots (`v1.2`). Spaces, `*`, `>`, empty segments, `.`, and `..` are rejected.

There's no separate repository or folder object. A **repo** is a URI prefix that you browse like a folder, for example `priompt list -prefix priompt://acme/support/`. Each prompt has its own independent history, described in [Versioning](./versioning.md).

## Validation rules

A prompt is valid when all of these hold:

| Rule | Error when it fails |
| --- | --- |
| The address starts with `priompt://`. | `uri must start with "priompt://"` |
| The address has an org and a path. | `uri has an org but no prompt path` |
| Each segment uses only legal characters. | `uri path segment "sup port" contains illegal characters` |
| The template isn't empty or only whitespace. | `template is empty` |
| Each placeholder is `{word}`, where a word is letters, digits, and underscores. | `template has an unclosed or malformed placeholder near "{name!"` |
| No doubled braces. `{{name}}` is an escaped literal to most formatters, not a slot. | `template uses doubled braces near "{{name}}!"…` |
| No `}` without a matching `{`. | `template has an unmatched "}" near "Hi name}!"` |
| No slot name is empty. | `slot name is empty` |
| Every placeholder is a declared slot. | `template uses undeclared slots: org` |
| Every declared slot appears in the template. | `declared slots never used in template: plan` |

Because every `{` must open a slot, a template can't contain literal braces. A template such as `Reply as JSON like {"answer": "..."}` fails with `unclosed or malformed placeholder`.

## Where validation runs

One function, the `validate` package in the `proto` module, defines "valid" everywhere:

- **On write**: `PublishPrompt` rejects an invalid prompt with `InvalidArgument`, and `priompt put` exits before it writes anything. `promptctl` derives slots from the template and validates each file before it publishes.
- **On read**: `GetPrompt` validates the stored prompt again before it returns or caches it. A stored prompt that fails returns `DataLoss` instead of the text, so a malformed prompt never reaches an agent, even one written around the write check by a hand-edited database or a `priompt import` file.

For example, publishing a template that uses `{org}` without declaring it fails:

```sh
priompt publish -uri priompt://acme/onboarding/welcome -file welcome.txt -slot name
```

```text title="Output"
2026/10/18 06:09:02 rpc error: code = InvalidArgument desc = invalid prompt: template uses undeclared slots: org
```

The full list of status codes is in [Errors](/reference/errors).

## Version hash

The **version hash** identifies a prompt's content. It's the SHA-256 of the template, a NUL byte, and the slot names joined by NUL bytes, written as 64 hex characters. The CLI shows the first 12.

- The same template and slots always produce the same version hash, in any prompt.
- Slot order is part of the content: `["name", "org"]` and `["org", "name"]` hash differently.
- The version hash stays in plaintext when encryption at rest is on, so caching and deduplication keep working.

A version hash names content, not a point in history. Each commit has a separate **commit hash** that also covers the prompt's address and lineage. See [Versioning](./versioning.md).

## Related

- [Versioning](./versioning.md): commits, branches, and the served HEAD.
- [Orgs, tokens, and access](./access-control.md): how the org segment scopes tokens.
- [Errors](/reference/errors): `InvalidArgument`, `DataLoss`, and the other status codes.
- [promptctl](/guides/promptctl): author prompts as files and validate them before you publish.
- [Glossary](/reference/glossary)
