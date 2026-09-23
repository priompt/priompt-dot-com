---
title: Changing the contract
---

# Changing the contract (proto)

Everything the repos must *agree* on is defined once, in `proto`:

| Package | Defines | Used by |
| --- | --- | --- |
| `proto/priompt/v1/prompt.proto` | the `PromptService` API: 9 RPCs and every message | server implements it; every client speaks it |
| `gen/` | Go stubs (committed, never hand-edited) | server, promptctl |
| `claims/` | the JWT claims (`sub`, `org`, `rw`, `exp`, `iat`, `iss`) | auth (mint), server (verify) |
| `validate/` | the one definition of a "valid prompt" | server (write + serve), promptctl (commit) |
| `semdiff/` | the Semantic Propagation Diff + the swappable `Embedder` interface | server, promptctl |

The engines live here as well as the schemas, because a verdict only means something if everyone computes it the same way.

## Workflow

Requires [buf](https://buf.build/docs/installation). It uses remote plugins, so there's no `protoc` to install.

```sh
# 1. edit proto/priompt/v1/prompt.proto: add fields, never renumber or reuse them
buf generate                                   # 2. regenerate gen/
buf breaking --against .git#branch=main        # 3. prove you broke nobody

# 4. propagate to the non-Go consumers
cd ../python-sdk && buf generate               # regenerates priompt/v1/prompt_pb2*.py
cd ../js-sdk     && npm run sync-proto         # re-vendors the .proto (loaded at runtime)
cd ../ui         && pnpm sync-proto
```

Changes to `claims/`, `validate/`, or `semdiff/` don't need step 4. The Go consumers pick them up on their next build, and a failed compile *is* the sync mechanism.

## Notes

- **js-sdk keeps a vendored copy** of the `.proto`, because an npm package has to be self-contained. `sync-proto` refreshes it; don't edit it by hand.
- **python-sdk commits its generated stubs** so the wheel ships them.
- The module path `priomptproto` is a placeholder until the first release. After that, the `replace` directives drop.
