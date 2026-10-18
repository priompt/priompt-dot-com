---
title: Use a real embedding model
sidebar_label: Embedding model
description: Point the server and promptctl at an OpenAI-compatible embeddings endpoint so the semantic diff compares meaning instead of words.
doc_type: how-to
---

This guide connects the [semantic diff](../concepts/semantic-diff.md) to a real embedding model, so verdicts compare what an edit means rather than which words changed. Without a model, Priompt uses an offline **lexical embedder**, a hashed bag of words that needs no network but only measures word overlap.

The steps run a local model with Hugging Face text-embeddings-inference (TEI). Any OpenAI-compatible `/v1/embeddings` endpoint works the same way.

## Prerequisites

Before you begin, make sure you have:

- **Docker**, to run TEI. The first start downloads the model, about 130 MB for `BAAI/bge-small-en-v1.5`.
- **`priompt`** and, for step 4, **`promptctl`**. See [Install Priompt](../installation/index.mdx).
- **A prompt to diff against**: this guide uses the `priompt://acme/support/agent` prompt from [Hot-reload prompts safely](./hot-reload.mdx).

## 1. Start the embedding server

To start TEI:

1. Run the CPU image with a model, and keep the model cache in a volume:

   ```sh
   docker run -d --name tei -p 127.0.0.1:8080:80 -v tei-data:/data \
     ghcr.io/huggingface/text-embeddings-inference:cpu-1.6 \
     --model-id BAAI/bge-small-en-v1.5
   ```

2. Wait until the log says `Ready`:

   ```sh
   docker logs --tail 1 tei
   ```

   ```text title="Output"
   INFO text_embeddings_router::http::server: router/src/http/server.rs:1805: Ready
   ```

3. Check the endpoint:

   ```sh
   curl -s localhost:8080/v1/embeddings -H 'Content-Type: application/json' \
     -d '{"model":"BAAI/bge-small-en-v1.5","input":["Greet the customer politely."]}' | head -c 80
   ```

   ```text title="Output"
   {"object":"list","data":[{"object":"embedding","embedding":[-0.05867564,0.01425
   ```

## 2. Point the server at it

To use the model for every diff and every change event, start the server with `-embed-url` and `-embed-model`:

```sh
priompt serve -embed-url http://localhost:8080/v1/embeddings -embed-model BAAI/bge-small-en-v1.5
```

The first log line names the embedder:

```text title="Output"
priompt v0.7.4 serving on :8443 (... embed=BAAI/bge-small-en-v1.5@http://localhost:8080/v1/embeddings ...)
```

The same settings are available as `PRIOMPT_EMBED_URL` and `PRIOMPT_EMBED_MODEL`. For a hosted API, put the key in `PRIOMPT_EMBED_KEY`; Priompt sends it as a bearer token. If the server can't reach the endpoint, it still publishes, but change events carry an empty verdict. See [Troubleshoot common problems](./troubleshooting.md).

## 3. Compare the verdicts

To see the difference, diff two edits of the same prompt with `priompt diff`. The table shows each edit with the lexical embedder and with `BAAI/bge-small-en-v1.5`:

| Edit | Lexical | `bge-small-en-v1.5` |
| --- | --- | --- |
| `politely` to `courteously` (`tweak.txt`) | 0.250, `localized tweak` | 0.025, `minor edit` |
| Follow the refund policy to `Refuse refunds immediately and close the ticket` (`invert.txt`) | 0.908, `structural` | 0.263, `localized tweak` |
| Every line rewritten for a collections agent (`rewrite.txt`) | 0.310, `structural` | 0.169, `structural` |

The numbers are the point delta (Signal 2). For example:

```sh
priompt diff -uri priompt://acme/support/agent -file tweak.txt
```

```text title="Output"
change @ new lines 2-2 (old 2-2): replace
  Signal 2 (point delta): 0.025
  Signal 3 up:   ±2=0.022 (boundary)
  Signal 3 down: ±2=0.010 (flat)
  => minor edit
```

The model recognizes a synonym as a near no-op, which the lexical embedder can't. It also rates the refund inversion as a `localized tweak`: the edit stays on one line and barely moves the lines around it. A verdict measures how far an edit spreads, not whether it's acceptable. Keep a human review for prompts that govern money or safety, as described in [Hot-reload prompts safely](./hot-reload.mdx).

## 4. Use the same model in promptctl

`promptctl diff` runs the diff locally, so it reads the endpoint from the environment rather than from the server:

```sh
export PRIOMPT_EMBED_URL=http://localhost:8080/v1/embeddings
export PRIOMPT_EMBED_MODEL=BAAI/bge-small-en-v1.5
promptctl diff origin/main
```

```text title="Output"
## acme/support/agent.prompt
change @ new lines 4-4 (old 4-4): replace
  Signal 2 (point delta): 0.263
  Signal 3 up:   ±2=0.105 ±4=0.049 (boundary)
  Signal 3 down: ±2=0.150 (boundary)
  => localized tweak
```

Use the same model in `promptctl`, CI, and the server. Otherwise a change that passed review as a `minor edit` can reach agents as `structural`, or the reverse.

## Use another endpoint

Any endpoint that accepts `{"model": ..., "input": [...]}` at `/v1/embeddings` works:

- **Ollama**: `-embed-url http://localhost:11434/v1/embeddings -embed-model nomic-embed-text`.
- **OpenAI**: `-embed-url https://api.openai.com/v1/embeddings -embed-model text-embedding-3-small`, with the key in `PRIOMPT_EMBED_KEY`.
- **Another TEI model**: change `--model-id`, and pass the same name to `-embed-model`.

Thresholds in the diff are fixed, so the same edit can get a different verdict from a different model. Re-check a few known edits after you switch.

## Next steps

- [Gate prompt changes in CI](./ci.mdx): run the diff with this model on every pull request.
- [Hot-reload prompts safely](./hot-reload.mdx): act on the verdicts in running agents.
- [Semantic diff](../concepts/semantic-diff.md): how the three signals are computed.
