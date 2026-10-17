---
title: Prompts and addresses
---

# Prompts and addresses

A prompt in Priompt is a small versioned record with four fields:

| Field | Example | In plain words |
| --- | --- | --- |
| `uri` | `priompt://acme/onboarding/welcome` | Its unique address |
| `template` | `Hi {name}, welcome to {org}!` | The text, with `{placeholders}` |
| `slots` | `["name", "org"]` | The blanks the template expects to be filled |
| `version_hash` | `80ec4e4d…` | A fingerprint of the content. The same text always gets the same fingerprint. |

Agents fetch the template and fill in the slots themselves. Priompt doesn't render templates or call a model.

## Addresses

```text
priompt://acme/support/agents/tier1/greeting
          └┬─┘ └──────────────┬────────────┘
          org        free-form path (any depth)
```

- The **first segment is the org**. It's the unit of access control: a token scoped to `acme` can only reach `priompt://acme/…`.
- Everything after it is a free-form path.
- A "repo" is just a URI prefix you can browse like a folder (`priompt list -prefix priompt://acme/support/`). There's no separate repo object.
- Each prompt has its own, independent history.

On the NATS bus, each address maps to a subject: `priompt://acme/support/agent` becomes `priompt.acme.support.agent`.

## Validation

A prompt is valid when:

1. The URI is non-empty.
2. The template is non-empty.
3. No slot name is empty.
4. Every `{placeholder}` in the template is a declared slot. Nothing is undeclared.
5. Every declared slot appears in the template. Nothing is unused.

Placeholders match `{word}`: letters, digits, and underscores.

The **same function** (`github.com/priompt/proto/validate`) runs when a prompt is written *and* when it's served. A malformed prompt can never reach an agent, even from a corrupted database. At serve time a failure returns `DataLoss` rather than bad text.

```sh
priompt put -uri priompt://acme/bad/x -file welcome.txt -slot name
# validation failed: template uses undeclared slots: org   (exit 1, nothing written)
```

`promptctl` derives slots from the template, so an "undeclared slot" can't happen there. It catches the typos that auto-derived slots would miss instead: `{{name}}` (an escaped literal brace) and `{name` (an unclosed brace).

## The version hash

`version_hash = sha256(template + "\0" + slots)`, recomputed on every write. It identifies *content*. Commits have a separate `commit_hash` that also covers lineage (see [Versioning](./versioning.md)). The version hash stays plaintext even with encryption at rest, so caching and deduplication keep working.
