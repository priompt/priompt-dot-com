---
title: Semantic diff
sidebar_label: Semantic diff
description: How Priompt measures how far an edit's change in meaning spreads through a prompt, and how it turns that into a verdict.
doc_type: concept
---

The **semantic diff** measures how far an edit's change in meaning spreads through a prompt, and labels the edit with a **verdict**. Its full name is the Semantic Propagation Diff. A text diff tells you that line 3 changed; the semantic diff tells you whether that change stayed on line 3 or rewired the rest of the prompt.

## Three signals

For each changed region, Priompt computes three signals:

1. **Where**: the changed lines, found with a line-level diff. Lines that differ only in trailing spaces or tabs count as unchanged.
2. **How big at the point**: the **point delta**, `1 - cosine(old, new)` between embeddings of the old and new lines. It runs from 0 (same meaning) to 1. A pure insertion or deletion scores 1, since there's nothing on the other side to compare.
3. **How far it spreads**: the same measurement over a window that grows outward by 2 lines at a time (±2, ±4, ±6, and so on), upward and downward separately. Growth stops when the delta changes by less than 0.02 between steps (the ripple flattened) or when the window reaches the start or end of the prompt (the boundary).

An **embedding** is a vector that represents a text's meaning, produced by an embedding model.

## Verdicts

Each changed region gets one of three verdicts, checked in this order:

| Verdict | Rule |
| --- | --- |
| `structural` | In either direction, the window reached the boundary before flattening, and the delta there is at least 0.15 and at least 60% of the point delta. |
| `localized tweak` | Not structural, and the point delta is at least 0.15. |
| `minor edit` | Everything else. |

The offline lexical embedder uses 40% instead of 60%, because word-overlap distance shrinks as the window takes in unchanged text. A notification carries the most serious verdict across all changed regions, or `new` for a prompt's first version. The thresholds are heuristics, not measured constants.

## Worked example

This base prompt was edited four ways. Each row changes one line, or rewrites five, and shows the point delta and verdict with the default lexical embedder and with `all-MiniLM-L6-v2`, a small open embedding model served locally.

```text title="base.txt"
You are the support agent for {org}.
Greet the customer by name: {name}.
Always answer politely and briefly.
Answer questions about orders and shipping.
Offer a refund when the request is reasonable.
Escalate legal threats to a human.
Keep every reply under 120 words.
```

| Edit | Lexical | `all-MiniLM-L6-v2` |
| --- | --- | --- |
| "shipping" becomes "shipping and returns" | 0.096, `minor edit` | 0.078, `minor edit` |
| "politely" becomes "courteously" | 0.200, `localized tweak` | 0.244, `localized tweak` |
| The refund line becomes "Never offer a refund." | 0.470, `localized tweak` | 0.358, `localized tweak` |
| Lines 3 to 7 become a sales script | 0.517, `structural` | 0.605, `structural` |

The full output for the refund edit, from `priompt diff` against a server with the lexical embedder:

```sh
priompt diff -uri priompt://acme/support/tone -file e_refund.txt
```

```text title="Output"
change @ new lines 5-5 (old 5-5): replace
  Signal 2 (point delta): 0.470
  Signal 3 up:   ±2=0.139 ±4=0.061 (boundary)
  Signal 3 down: ±2=0.146 ±4=0.146 (boundary)
  => localized tweak
```

Both directions reach the boundary, but the delta there (0.061 up, 0.146 down) is below 0.15 and below 40% of 0.470, so the change counts as contained.

The web UI shows the same signals and verdict for each commit:

![A commit view in the web UI: a one-line change, followed by its semantic diff with a point delta of 0.067 and the verdict minor edit](/img/ui/08-commit-diff.png)

:::warning It measures spread, not risk
The refund edit reverses a policy, yet both embedders call it a `localized tweak`. That's accurate: the rest of the prompt still means what it did. `structural` means "this rewired the prompt", not "this is the only change worth reviewing". Use the verdict to triage changes, not to approve them.
:::

## Embedders

With no model configured, Priompt uses an offline **lexical embedder**, a hashed bag of words. It scores word overlap, not meaning, which is enough to catch large rewrites with no extra service. For real semantics, point the server at any OpenAI-compatible `/v1/embeddings` endpoint, such as Ollama, text-embeddings-inference, or a hosted API. Prompts then go to that endpoint for scoring, so self-host it if prompts must stay in your infrastructure. See [Use a real embedding model](/guides/embedding-model).

## Where it runs

The same engine, the `semdiff` package in the `proto` module, runs in every surface:

| Surface | Compares |
| --- | --- |
| `priompt diff`, `DiffPrompt` | The stored served version against a draft. |
| `DiffCommits` | Any two commits in history. |
| SDK `diff(uri, draft)` | The stored served version against a draft, from code. |
| `promptctl diff [ref]` | Files at a git ref against the working tree, on your machine. |
| Publish and rollback notifications | The old served version against the new one. |
| `priompt put` | The stored version against the new file. It refuses a `structural` change unless you pass `-force`. |

Server-side diffs use the embedding model the operator configured, so everyone gets the same scores. `promptctl diff` and `priompt put` run locally and read `PRIOMPT_EMBED_URL`, `PRIOMPT_EMBED_MODEL`, and `PRIOMPT_EMBED_KEY` instead.

## Related

- [Live updates](./live-updates.md): how verdicts reach agents.
- [Use a real embedding model](/guides/embedding-model): configure a semantic embedder.
- [Gate prompt changes in CI](/guides/ci): fail a pull request on a `structural` change.
- [gRPC API](/reference/grpc-api): `DiffPrompt` and `DiffCommits` fields.
- [Glossary](/reference/glossary)
