---
title: Glossary
sidebar_label: Glossary
description: "Definitions of the terms used across these docs."
doc_type: reference
---

This glossary defines the terms these docs use, in alphabetical order. Each entry links to the page that explains the term in full.

## A

- **Admin token**: A token with no org. It reaches every org. An admin token from `priompt init`, or the server's `PRIOMPT_TOKEN`, also has write access. See [Orgs, tokens, and access](../concepts/access-control.md).
- **Author**: Who a commit is recorded as. It's the JWT's `sub` claim, else the static token's org, else `anonymous` when the server runs without auth.

## B

- **Backup**: A file written by `priompt backup` that holds prompts, commits, and branch pointers. Compare with an [export](#e), which holds served content only. See [priompt CLI](./cli.md#backup).
- **Branch**: A named pointer to a prompt's latest commit on one line of work. Each prompt has its own branches. Only [`main`](#m) is served. See [Versioning](../concepts/versioning.md).

## C

- **Change event**: The message the server publishes over NATS when `main` moves. It carries the new version hash and the [verdict](#v). See [gRPC API](./grpc-api.md#change-events).
- **Commit**: One recorded version of a prompt, with a parent, an author, a message, and a time. A merge commit has two parents.
- **Commit hash**: The ID of a commit: a SHA-256 over the URI, the [version hash](#v), the parents, the author, and the message. Two commits with the same content have different commit hashes when their lineage differs. Pin to a commit hash for an exact point in history.

## E

- **Embedder**: The model that turns lines of text into vectors for the [semantic diff](#s). Without `-embed-url`, Priompt uses an offline lexical embedder. See [Use a real embedding model](../guides/embedding-model.md).
- **Export**: A file written by `priompt export` that holds only the served content of each prompt, without commits or branches.

## J

- **JWKS**: The JSON Web Key Set that `priompt-auth` serves at `/jwks`. The server uses it to verify JWTs offline. See [priompt-auth CLI](./priompt-auth.md).
- **JWT**: A short-lived signed token issued by `priompt-auth`. Its claims name the subject, the org, and the write grant. See [priompt-auth CLI](./priompt-auth.md#token-claims).

## L

- **L1 cache**: The cache inside an SDK client, set with `cache_ttl`. It saves the network round trip.
- **L2 cache**: The server's cache of served prompts: in-process by default, or shared through Redis. See [Caching](../operations/caching.md).

## M

- **`main`**: The branch that agents are served. Publishing, merging, or rolling back on `main` changes what `GetPrompt` returns.
- **Merge**: Combining one branch into another with a two-parent commit. The result takes the source branch's content.

## O

- **Org**: The first segment of a prompt URI, as in `acme` in `priompt://acme/support/agent`. It's the unit of access control: a token scoped to `acme` reaches only `priompt://acme/...`.

## P

- **Pin**: Fetching a fixed version instead of the served one, by passing a [ref](#r) to `GetPrompt`. An agent that pins upgrades only when you change the ref.
- **Prompt**: A versioned record with a URI, a template, and a list of slots. See [Prompts and addresses](../concepts/prompts.md).
- **Publish**: Committing a new version through the server. On `main` this also changes the served version and notifies subscribers.

## R

- **Ref**: What `GetPrompt` accepts to fetch a specific version: a branch name or a full commit hash.
- **Rollback**: Pointing `main` back at an earlier commit with `SetBranch`. Nothing is deleted.

## S

- **Scope**: The org a token is limited to. A token without one is an [admin token](#a).
- **Semantic diff**: Priompt's comparison of two versions of a prompt. It measures how far a change's meaning spreads through the surrounding lines, and gives a [verdict](#v). See [Semantic diff](../concepts/semantic-diff.md).
- **Served HEAD**: The version of a prompt at the tip of `main`: what agents get from `GetPrompt` without a ref. Also called the served version.
- **Service account**: A non-human client, such as `ci-bot`, with a secret it exchanges at `priompt-auth` for JWTs.
- **Signal 1, 2, 3**: The three parts of a semantic diff: the changed lines, the meaning shift at those lines (`point_delta`), and how the shift spreads up and down.
- **Slot**: A named blank in a template, written `{name}`, that the calling app fills in. Every slot used in the template must be declared, and every declared slot must be used.
- **Static token**: A token listed in the server's tokens file. See [Configuration](./configuration.md#tokens-file).
- **Subscriber**: A client listening for change events, such as `priompt watch` or an SDK's subscribe method. See [Live updates](../concepts/live-updates.md).

## T

- **Template**: The text of a prompt, with [slots](#s).

## U

- **URI**: A prompt's address: `priompt://<org>/<path>`, for example `priompt://acme/onboarding/welcome`.

## V

- **Validation**: The check that a prompt is well formed: a valid URI, a non-empty template, and slots that match the placeholders. It runs on every write and again on every read. See [Errors](./errors.md#invalidargument).
- **Verdict**: The class of a change from the semantic diff: `minor edit`, `localized tweak`, or `structural`. A change event uses `new` for a first publish. Agents use it to decide whether to reload a prompt on their own. See [Hot-reload prompts](../guides/hot-reload.mdx).
- **Version hash**: The ID of a prompt's content: a SHA-256 over the template and the slots. The same content always has the same version hash, whatever its history. Compare with the [commit hash](#c).
