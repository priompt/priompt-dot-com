---
title: Semantic diff
---

# The Semantic Propagation Diff

A text diff tells you *that* line 3 changed. It can't tell you whether that change quietly rewired how the rest of the prompt behaves. Priompt's diff can.

Think of dropping a stone in a pond and watching how far the ripples travel:

```text
Edit on line 3:  "Be helpful"  ->  "Never help with refunds"

           line 1  ────────────────  meaning unchanged?
           line 2  ──────────────    meaning unchanged?      ← ripples measured
  [EDIT]   line 3  ██████████████    the change itself         outward, ±2, ±4,
           line 4  ──────────────    meaning unchanged?         ±6 lines… until
           line 5  ────────────────  meaning unchanged?         they flatten out
```

## Three signals per changed hunk

1. **Where:** the changed region, from a line-level LCS diff hunk.
2. **How big at the point:** the semantic distance between the old and new text at the change, `1 - cosine(old, new)` over embeddings.
3. **How far it spreads:** the same measurement with a growing window (±2, ±4, ±6 lines…), up and down independently, until the curve flattens (the ripple stopped) or hits the edge of the prompt.

| Signal 2 (at the point) | Signal 3 (the ripple) | Verdict |
| --- | --- | --- |
| high | flattens quickly | **localized tweak**: the change is contained |
| low | flat | **minor edit**: little changed anywhere |
| any | still high at the boundary | **structural**: the change reshapes the prompt |

A first version gets the verdict `new`.

```sh
priompt diff -uri priompt://acme/support/agent -file edited.txt -addr localhost:8443
# change @ new lines 3-3 (old 3-3): replace
#   Signal 2 (point delta): 0.470
#   Signal 3 up:   ±2=0.095 (boundary)
#   Signal 3 down: ±2=0.153 ±4=0.153 (flat)
#   => localized tweak
```

:::warning It measures spread, not risk
A one-line edit that turns *"offer a refund when reasonable"* into *"never offer a refund"* reads as a **localized tweak**. That's correct, because the rest of the prompt still means what it did. It's also a policy reversal you'd want a human to see. `structural` says "this rewired the prompt". It doesn't say "this is the only kind of change worth reviewing". Use the verdict for triage, not approval.
:::

## Where it runs

The same engine (`github.com/priompt/proto/semdiff`) powers all of these:

| Surface | Compares |
| --- | --- |
| `priompt diff` / `DiffPrompt` | a stored prompt against an edit |
| `DiffCommits` | any two commits in history |
| `client.diff(uri, draft)` | a stored prompt against a draft, from code |
| `promptctl diff [ref]` | files between a git ref and the working tree, locally |
| publish notifications | the previous HEAD against the new one, attached to the event |
| `priompt put` | a pre-commit check that **refuses a structural overwrite** unless you pass `-force` |

Server-side diffs run against the **stored** prompt, using the embedding model the operator configured. Everyone gets consistent analysis, and prompts never leave your infrastructure.

## Use a real embedding model

With no model configured, Priompt falls back to an offline, zero-dependency **lexical** embedder (a hashed bag-of-words). It scores word overlap, not meaning, which is good enough to catch big rewrites. For real semantics, point it at any OpenAI-compatible `/v1/embeddings` endpoint:

```sh
# Ollama
priompt serve -embed-url http://localhost:11434/v1/embeddings -embed-model nomic-embed-text

# HuggingFace text-embeddings-inference (see docker-compose.tei.yml)
priompt serve -embed-url http://tei/v1/embeddings -embed-model BAAI/bge-small-en-v1.5

# hosted API
PRIOMPT_EMBED_KEY=sk-… priompt serve -embed-url https://api.openai.com/v1/embeddings -embed-model text-embedding-3-small
```

The difference is visible. With `BAAI/bge-small-en-v1.5`, a synonym swap ("politely" → "courteously") scored a point delta of **0.025** (`minor edit`). A policy inversion in the same prompt scored **0.261**, with a ripple that reached the boundary (`structural`).

`promptctl diff` and `priompt put` read the same `PRIOMPT_EMBED_URL` / `_MODEL` / `_KEY` variables.
