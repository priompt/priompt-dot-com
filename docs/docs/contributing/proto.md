---
title: Change the contract
sidebar_label: Change the contract
description: "Change the gRPC contract, the JWT claims, validation, or the semantic diff, and update every consumer."
doc_type: contributor
---

The `proto` repository holds everything the other repositories must agree on: the gRPC API, the JWT claims, the validation rules, and the semantic diff engine. This page shows how to change the contract and carry the change into every consumer without breaking existing clients.

## What lives in proto

| Path | Defines | Used by |
| --- | --- | --- |
| `proto/priompt/v1/prompt.proto` | `PromptService`: nine RPCs and their messages | The server implements it. Every client calls it. |
| `gen/` | Go stubs, generated and committed | Server, `promptctl` |
| `claims/` | JWT claims: `sub`, `org`, `rw`, `exp`, `iat`, `iss` | `priompt-auth` signs them, the server verifies them. |
| `validate/` | The one definition of a valid prompt | Server (write and read), `priompt put`, `promptctl` |
| `semdiff/` | The semantic diff and the `Embedder` interface | Server, `priompt put`, `promptctl` |

The engines live with the schemas because a verdict only means something if every tool computes it the same way. The RPCs are listed in the [gRPC API](../reference/grpc-api.md) reference.

## Prerequisites

Before you begin, make sure you have:

- **The repositories side by side with a Go workspace**: see [Development setup](./development.md).
- **buf**: from [buf.build](https://buf.build/docs/installation). It uses remote plugins, so `protoc` and its plugins aren't needed.

## 1. Change the .proto file

To change the contract:

1. Edit `proto/priompt/v1/prompt.proto`. Add fields with new numbers. Never renumber, reuse, or change the type of an existing field.
2. Regenerate the Go stubs, from the `proto` directory:

   ```sh
   buf generate
   ```

   `gen/priompt/v1/prompt.pb.go` and `prompt_grpc.pb.go` change. Without a `.proto` change, the output matches the committed files.

3. Check that existing clients still work:

   ```sh
   buf breaking --against '.git#branch=main'
   ```

   No output and exit code `0` means nothing breaks.

`buf lint` passes. `DiffPromptResponse` is shared by `DiffPrompt` and `DiffCommits` on purpose, and both RPCs carry an explicit `buf:lint:ignore` comment that says why. CI runs `buf lint` and `buf breaking` on every pull request.

## 2. Update the Python SDK

`buf generate` in `python-sdk` writes the stubs to `priompt/v1/`, because the proto package is `priompt.v1`. The SDK ships them under `priompt_sdk/v1/`, so move them and fix one import.

To regenerate the Python stubs:

1. Generate, from the `python-sdk` directory:

   ```sh
   buf generate
   ```

2. Move the two generated files into the package, and remove the empty directory:

   ```sh
   mv priompt/v1/prompt_pb2.py priompt/v1/prompt_pb2_grpc.py priompt_sdk/v1/
   rm -r priompt
   ```

3. In `priompt_sdk/v1/prompt_pb2_grpc.py`, change `from priompt.v1 import prompt_pb2` to `from priompt_sdk.v1 import prompt_pb2`.
4. Run `pytest -q`. Commit the regenerated stubs, because the published package ships them.

Don't edit the `.priompt.v1.*` service paths or the serialized descriptor in the stubs. They're the wire contract.

## 3. Update the Node SDK and the web UI

Both load the `.proto` at runtime from a vendored copy. To refresh it:

1. In `js-sdk`, run `npm run sync-proto`. It copies `../proto/proto/priompt/v1/prompt.proto` to `proto/priompt/v1/prompt.proto`.
2. In `ui`, run `pnpm sync-proto`. It does the same copy.

Never edit the vendored copies by hand.

## 4. Release the change

The Go module is `github.com/priompt/proto`, released with `v*` tags. The other modules pin a version in their `go.mod`.

To release a contract change:

1. Merge and tag `proto`.
2. In each Go consumer (`priompt`, `cli`, `auth`), run `go get github.com/priompt/proto@<new-tag>` and `go mod tidy`.
3. Test each consumer with `GOWORK=off go test ./...`, so it builds against the tag and not your workspace.

Changes to `claims/`, `validate/`, or `semdiff/` only need this step. A Go consumer picks them up on its next dependency bump, and a compile error shows anything that no longer fits.

## Next steps

- [Storage engine](./db-adapters.md): store a new field.
- [Testing](./testing.md): the suites to run before you tag.
