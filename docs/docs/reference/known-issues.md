---
title: Known issues
sidebar_label: Known issues
description: Open bugs in Priompt v0.7.3, each linked to its GitHub issue, with workarounds where there is one.
doc_type: reference
---

These are the open bugs in Priompt v0.7.3. Each links to its GitHub issue, which tracks the fix. When a fix ships, its entry moves to the [changelog](./changelog.mdx).

## Server

| Issue | Problem |
| --- | --- |
| [priompt#45](https://github.com/priompt/priompt/issues/45) | No RPC lists a prompt's branches or all of its commits |

## promptctl

| Issue | Problem |
| --- | --- |
| [cli#11](https://github.com/priompt/cli/issues/11) | `diff` reports CRLF-only differences as "no changes" instead of skipping them |

## Web UI

| Issue | Problem |
| --- | --- |
| [ui#7](https://github.com/priompt/ui/issues/7) | The branch list checks `main`, `dev`, `staging`, and `prod` by name, and shows other branches only when you name them. Needs priompt#45. |
| [ui#8](https://github.com/priompt/ui/issues/8) | After a rollback, a commit that no listed branch reaches drops out of the Rollback list. Needs priompt#45. |
| [ui#20](https://github.com/priompt/ui/issues/20) | A production build (`pnpm build`) can't find the proto file, so every RPC fails with `ENOENT` |

## JavaScript SDK

`@priompt/client` 0.1.1 isn't on npm yet, so `npm install` gets 0.1.0. Version 0.1.0 computes NATS subjects the old way, so with a v0.7.3 server it doesn't receive events for addresses that contain `.` or other punctuation. It also doesn't read `PRIOMPT_TOKEN`, and a wrong broker token rejects with `TIMEOUT` after about 20 seconds. See [JavaScript SDK](/sdks/javascript).

## Workarounds

- **Branches the UI doesn't list** ([ui#7](https://github.com/priompt/ui/issues/7)): enter the name in **Show another branch** on the **Branches** tab, or add `?branch=<name>` to its URL.
- **Rolling forward in the UI** ([ui#8](https://github.com/priompt/ui/issues/8)): select **Undo** in the banner right after a rollback, or call `SetBranch` with the commit hash from code. See [Branch, pin, and roll back a prompt](/guides/branch-pin-rollback).
- **UI production build** ([ui#20](https://github.com/priompt/ui/issues/20)): run the UI with `pnpm dev`, as in [Run the web UI](/guides/web-ui/run).
- **Addresses with dots and the npm SDK**: until 0.1.1 is on npm, install it from its git tag with `npm install github:priompt/js-sdk#v0.1.1`, or use addresses without `.` in their segments.

## Related

- [Roadmap](/roadmap): release status and planned work.
- [Troubleshooting](/guides/troubleshooting): error messages and fixes.
