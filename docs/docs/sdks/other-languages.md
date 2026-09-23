---
title: Other languages (raw gRPC)
---

# Other languages

Priompt's API is plain gRPC. Any language with a gRPC toolchain gets the **full** API from one file, `proto/priompt/v1/prompt.proto` in the proto repo. That includes branch, merge, history, rollback, and pinning, which the SDKs don't all wrap yet.

## Generate a client

With [buf](https://buf.build/docs/installation) (remote plugins, no `protoc` needed), add your language's plugin to a `buf.gen.yaml`:

```yaml title="buf.gen.yaml"
version: v2
inputs:
  - directory: ../proto/proto
plugins:
  - remote: buf.build/grpc/go        # or grpc/java, grpc/csharp, grpc/ruby, …
    out: gen
```

```sh
buf generate
```

## Talk to the server

- **Address:** `host:8443`. Plaintext by default, or TLS when the server has `-tls-cert`.
- **Auth:** send the metadata header `authorization: Bearer <token>` on every call.
- **Pinning:** set `ref` on `GetPromptRequest` to a branch name or commit hash.
- **Errors:** standard gRPC status codes. See the [gRPC API reference](../reference/grpc-api.md#errors).

Quick check with `grpcurl`:

```sh
grpcurl -plaintext -H "authorization: Bearer $PRIOMPT_TOKEN" \
  -import-path ../proto/proto -proto priompt/v1/prompt.proto \
  -d '{"uri":"priompt://acme/onboarding/welcome"}' \
  localhost:8443 priompt.v1.PromptService/GetPrompt
```

## Subscribing without an SDK

Change events are NATS messages on subject `priompt.<org>.<path…>`. For example, `priompt://acme/support/agent` publishes on `priompt.acme.support.agent`. Use any NATS client, connect with `nats://<nats-token>@host:4222`, and re-fetch over gRPC when an event arrives.
