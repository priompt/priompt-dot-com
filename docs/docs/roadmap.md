---
title: Status and roadmap
sidebar_label: Status and roadmap
description: What works in Priompt today, what's missing before the first public release, and the known gaps.
doc_type: overview
---

Priompt is working pre-release software at v0.7. This page lists what's published, what's left before the first public release, and the gaps you might hit today. For what changed in each version, see the [Changelog](/reference/changelog).

## Release status

Published today:

- **Server image**: multi-arch (amd64 and arm64) on GitHub Container Registry. Tagging `v*` on the server repo publishes it. The first release was `v0.7.0`.
- **SDKs**: the Python SDK on PyPI and the Node SDK on npm. See [Client SDKs](/sdks) for the package names.
- **Go modules**: `github.com/priompt/{proto,db-adapters,auth,priompt,cli}`, with no `replace` directives, so `go install` works.
- **License**: Apache-2.0.

Not published yet:

- **Prebuilt binaries** for Linux, macOS, and Windows. Use Docker or `go install` for now. See [Install Priompt](./installation/index.mdx).

## Known gaps

Each gap links to the page it affects. Open bugs, each linked to its GitHub issue, are listed in [Known issues](/reference/known-issues).

- **Merges take the source branch's content.** Three-way automatic merges aren't implemented. See [Branch, pin, and roll back a prompt](/guides/branch-pin-rollback).
- **The web UI's settings pages are placeholders.** See [Web UI overview](/guides/web-ui).
- **Rotating the encryption key isn't automated.** See [Storage and backups](/operations/storage).
- **Authorization works per org.** A token covers every prompt under its org prefix, and per-prompt rules aren't modeled. See [Orgs, tokens, and access](/concepts/access-control).

## Proposed: the eval gate

:::info Proposal
The eval gate is a design proposal. Nothing on this page is implemented yet.
:::

Validation proves a prompt is well formed, and the semantic diff estimates how much it changed. Neither one says whether the prompt got worse. The eval gate would add that check before a change reaches `main`:

- **The server never calls a model.** A runner you own, such as promptfoo, deepeval, or your own script, evaluates the candidate branch and posts scores. The server stores them on the commit graph and gates the merge to `main`.
- **Scores are compared with statistics, not a bare threshold.** Each verdict compares a candidate against a baseline with an explicit noise band and carries a reason code, such as `ABOVE_BASELINE`, `WITHIN_NOISE`, `REGRESSION_EXCEEDS_TOLERANCE`, `AMBIGUOUS`, or `MODEL_CHANGED`. A changed model, dataset, or grader is flagged instead of averaged into a pass.
- **The semantic diff schedules the evals.** A `minor edit` runs a cheap tier, and a `structural` change runs the full suite.
- **It reuses what Priompt already has.** Branches give candidates that no agent reads. Content-addressed commits guarantee that what was measured is what ships. NATS triggers the runner.

A server with no eval policy configured would behave exactly as it does today.

## Next steps

- [Changelog](/reference/changelog): what shipped in each version.
- [Testing](/contributing/testing): how the end-to-end suites check each release.
- [Quickstart](./quickstart.mdx): try the current release.
