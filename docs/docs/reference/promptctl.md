---
title: promptctl
---

# `promptctl` command reference

```text
promptctl commit -m "msg"                     validate every *.prompt, then commit changes
promptctl diff [ref]                          semantic diff vs ref (default HEAD)
promptctl log <file.prompt>                   version lineage of one prompt
promptctl promote <file.prompt> <from> <to>   bring a prompt from one branch onto another
promptctl push [-server host:port]            validate, git push, then publish to the server
promptctl pull                                sync with origin
promptctl publish -server host:port [paths…]  publish to the server + notify subscribers
```

| Flag | Commands | |
| --- | --- | --- |
| `-m` | `commit` | commit message |
| `-server` | `push`, `publish` | Priompt server address. Without it, `push` only git-pushes. |
| `-tls`, `-ca-cert` | `push`, `publish` | TLS to the server |

## What "invalid" means here

- an empty template or an empty slot name
- a `.prompt` file at the repo root (it has no org)
- `{{name}}`: doubled braces are an escaped literal to a formatter, so the slot would never be filled
- `{name`: an unclosed brace is just literal text

One invalid file blocks the whole commit.

## Environment

`PRIOMPT_EMBED_URL`, `PRIOMPT_EMBED_MODEL`, `PRIOMPT_EMBED_KEY`, `PRIOMPT_GIT_TOKEN`, and `PRIOMPT_TOKEN`. See the [authoring guide](../guides/promptctl.md#configuration).
