---
title: Use cases
sidebar_label: Use cases
description: Who uses Priompt, which parts each of them touches, and the problems Priompt solves for them.
doc_type: concept
---

Priompt serves several kinds of users, and each one touches a different part of it. This page lists those users and the problems they bring, with a link to the guide that solves each one.

## Users

| User | What they use | What they get |
| --- | --- | --- |
| Solo developer | The `priompt` binary and one SDK | A local prompt store with history, and no auth or infrastructure. |
| Prompt author | `promptctl` and git | Prompts as files, validated commits, and a semantic check before shipping. |
| Python or Node developer | An SDK | Prompts fetched by address, cached, pinned to a version, and reloaded on change. |
| Developer in another language | The `.proto` contract | The full API over gRPC, with a client generated for any language. |
| Platform operator | `priompt serve`, Docker, PostgreSQL, Redis, and Prometheus | Storage, caching, TLS, metrics, rate limits, and backups. |
| Security admin | `priompt-auth` and an identity provider | SSO, service accounts, 15-minute credentials, and offboarding through identity provider groups. |
| CI pipeline | `promptctl` or an SDK, with a service-account token | Validation and publishing when changes merge. |
| Reviewer | `priompt diff`, `promptctl diff`, and `DiffCommits` | A way to tell a safe tweak from a structural rewrite. |
| Tool builder | The Go modules `github.com/priompt/db-adapters` and `github.com/priompt/proto` | Versioned, encrypted storage and the validation and diff engines as libraries, with no server. |

## Roll back a broken prompt

*"My agent broke, and I don't know what the old prompt said."*

The `History` RPC lists every version of a prompt with its author and message. `SetBranch` moves `main` back to an old commit in one atomic step, and every agent picks up the change through a change event or within one cache TTL. See [Branch, pin, and roll back a prompt](/guides/branch-pin-rollback).

## Let non-engineers edit prompts safely

*"Marketing edits prompts, and engineering doesn't want surprises at 3 a.m."*

Authors publish with `promptctl`, and agents subscribe to change events. With a real embedding model, a rewording arrives as a `minor edit` and agents reload it on their own. A policy reversal arrives as `structural`, so agents keep their current version and a person reviews the change. See [Hot-reload prompts safely](/guides/hot-reload) and [Use a real embedding model](/guides/embedding-model).

## A/B test prompt variants

*"We want to compare two versions of a prompt on live traffic."*

Publish the candidate to a branch, and have one cohort read it with `ref="feat"`. `MergeBranch` ships the winner, and `SetBranch` reverts it. See [A/B test a prompt](/guides/ab-test).

## Answer compliance questions

*"Compliance asks who can read prompts, who changed them, and whether they're encrypted."*

Org-scoped tokens and JWTs control who can read and write. Commit authorship and the JSON audit log record who changed what. `PRIOMPT_ENCRYPTION_KEY` encrypts prompts at rest, and Prometheus counts every denied request by gRPC code. See [Orgs, tokens, and access](/concepts/access-control) and [Secure a server](/operations/security).

## Review prompts like code

*"Prompt changes must go through review, like code."*

Prompts live in a git repo. Each pull request runs `promptctl commit` to validate and `promptctl diff` to block `structural` changes. A merge runs `promptctl push` with a short-lived CI token, and subscribed agents hear about the change in the same step. See [Gate prompt changes in CI](/guides/ci).

## Share one prompt store across teams

*"Several teams need one prompt store without seeing each other's prompts."*

The org is the first segment of every address. A token scoped to `acme` can't read `priompt://other/...`, write access is opt-in per token, and per-org rate limits stop one team from starving another. See [Orgs, tokens, and access](/concepts/access-control).

## Build your own prompt tool in Go

*"I'm building my own prompt tool, and I want Priompt's storage and checks."*

Use `github.com/priompt/db-adapters` for versioned, encrypted storage, `github.com/priompt/proto/validate` for the server's validation rules, and `github.com/priompt/proto/semdiff` for the diff engine. None of them needs a running server. See [Storage engine](/contributing/db-adapters) and [Change the contract](/contributing/proto).

## Related

- [Production checklist](/operations/production-checklist): the settings that take a server from a laptop to production, tier by tier.
- [Priompt overview](./intro.mdx): what Priompt is and how its parts fit together.
- [Status and roadmap](./roadmap.md): what works today and what's missing.
