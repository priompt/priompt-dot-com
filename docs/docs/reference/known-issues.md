---
title: Known issues
sidebar_label: Known issues
description: Open bugs in Priompt v0.7.2, each linked to its GitHub issue, with workarounds where the docs give one.
doc_type: reference
---

These bugs were found while verifying these docs against v0.7.2. Each links to its GitHub issue, which tracks the fix. When a fix ships, its entry moves to the [changelog](./changelog.mdx).

:::info Security fixes
Three security fixes for the server are in progress and tracked privately. They will be published as advisories with the release that fixes them. Until then, follow [Secure a server](/operations/security): use a broker token only on trusted networks and give each org its own server token.
:::

## Server and `priompt` CLI

| Issue | Problem |
| --- | --- |
| [priompt#12](https://github.com/priompt/priompt/issues/12) | Docker image: database is written outside the /data volume (data loss) |
| [priompt#13](https://github.com/priompt/priompt/issues/13) | MergeBranch into main sends no change event |
| [priompt#14](https://github.com/priompt/priompt/issues/14) | -tls-cert without -tls-key serves plaintext but logs tls=true |
| [priompt#15](https://github.com/priompt/priompt/issues/15) | priompt watch logs the NATS URL including the token |
| [priompt#16](https://github.com/priompt/priompt/issues/16) | priompt import / put skip validation and write no commit |
| [priompt#17](https://github.com/priompt/priompt/issues/17) | publish always prints "subscribers notified"; failed cache clear drops the event |
| [priompt#18](https://github.com/priompt/priompt/issues/18) | Missing or wrong PRIOMPT_ENCRYPTION_KEY isn't detected at startup |
| [priompt#19](https://github.com/priompt/priompt/issues/19) | Semantic diff depends on a trailing newline (seed prompt edits always 'structural') |
| [priompt#20](https://github.com/priompt/priompt/issues/20) | priompt init prints bash `export` syntax on Windows |
| [priompt#21](https://github.com/priompt/priompt/issues/21) | publish accepts a UTF-8 BOM, UTF-16 and CRLF silently |
| [priompt#22](https://github.com/priompt/priompt/issues/22) | seed-dev.sh exits 127 on Linux/macOS |
| [priompt#23](https://github.com/priompt/priompt/issues/23) | Republishing identical content to a non-main branch creates a duplicate commit |
| [priompt#24](https://github.com/priompt/priompt/issues/24) | ListPrompts with an empty prefix and an org-scoped token returns PermissionDenied |
| [priompt#25](https://github.com/priompt/priompt/issues/25) | Audit log omits the JWT subject |

## priompt-auth and tokens

| Issue | Problem |
| --- | --- |
| [auth#2](https://github.com/priompt/auth/issues/2) | Trailing # comments in tokens/clients/groups files are parsed as fields (changes token scope) |

## promptctl

| Issue | Problem |
| --- | --- |
| [cli#3](https://github.com/priompt/cli/issues/3) | promptctl diff always exits 0, even on a structural verdict |
| [cli#4](https://github.com/priompt/cli/issues/4) | promptctl -tls requires -ca-cert (can't use system CA roots) |
| [cli#5](https://github.com/priompt/cli/issues/5) | promptctl promote leaves the repo checked out on the target branch |

## Contract (`proto`)

| Issue | Problem |
| --- | --- |
| [proto#3](https://github.com/priompt/proto/issues/3) | buf lint fails: DiffPromptResponse is reused by two RPCs |
| [proto#4](https://github.com/priompt/proto/issues/4) | created_at is documented as RFC3339 but the server sends RFC3339Nano |
| [proto#5](https://github.com/priompt/proto/issues/5) | semdiff: editing the last line without a trailing newline reports delete + insert |

## Web UI

| Issue | Problem |
| --- | --- |
| [ui#4](https://github.com/priompt/ui/issues/4) | Check impact rates every edit 'structural' |
| [ui#5](https://github.com/priompt/ui/issues/5) | Commit dialog's extended description is never saved |
| [ui#6](https://github.com/priompt/ui/issues/6) | Create branch resets the prompt selector |
| [ui#7](https://github.com/priompt/ui/issues/7) | Branch list only shows main/dev/staging/prod |
| [ui#8](https://github.com/priompt/ui/issues/8) | Rollback list hides commits after a rollback (can't roll forward) |
| [ui#9](https://github.com/priompt/ui/issues/9) | No UI path to edit on a branch, compare, or search; namespace History tab is empty |
| [ui#10](https://github.com/priompt/ui/issues/10) | Cosmetic and minor UI issues |

## JavaScript SDK

| Issue | Problem |
| --- | --- |
| [js-sdk#5](https://github.com/priompt/js-sdk/issues/5) | Replace deprecated `nats` dependency |
| [js-sdk#6](https://github.com/priompt/js-sdk/issues/6) | subscribe() with a wrong NATS token rejects with TIMEOUT after ~20 s |
| [js-sdk#7](https://github.com/priompt/js-sdk/issues/7) | Read PRIOMPT_TOKEN and regenerate stale vendored proto |

## Python SDK

| Issue | Problem |
| --- | --- |
| [python-sdk#3](https://github.com/priompt/python-sdk/issues/3) | Holding a change doesn't hold it: subscribe refreshes the cache on every event |
| [python-sdk#4](https://github.com/priompt/python-sdk/issues/4) | Wrong NATS token: logs tracebacks and keeps running with no events |
| [python-sdk#5](https://github.com/priompt/python-sdk/issues/5) | Read PRIOMPT_TOKEN, regenerate stale stubs, scrub real name |

## Workarounds

- **Docker data loss** ([priompt#12](https://github.com/priompt/priompt/issues/12)): always run `serve -db /data/priompt.db` when you mount `/data`. See [Install with Docker](/installation/docker).
- **`promptctl diff` exit code** ([cli#3](https://github.com/priompt/cli/issues/3)): gate CI on `grep "=> structural"`, as in [Check prompts in CI](/guides/ci).
- **Trailing comments in tokens files** ([auth#2](https://github.com/priompt/auth/issues/2)): put comments on their own line.
- **TLS flags** ([priompt#14](https://github.com/priompt/priompt/issues/14)): always pass `-tls-cert` and `-tls-key` together.
- **Web UI Check impact** ([ui#4](https://github.com/priompt/ui/issues/4)): read the verdict on the commit page instead.

## Related

- [Roadmap](/roadmap): release status and planned work.
- [Troubleshooting](/guides/troubleshooting): error messages and fixes.
