---
title: Known issues
sidebar_label: Known issues
description: Open bugs in Priompt v0.7.4, each linked to its GitHub issue, with workarounds where there is one.
doc_type: reference
---

These are the open bugs in Priompt v0.7.4. When a fix ships, its entry moves to the [changelog](./changelog.mdx).

The server, `promptctl`, the Python SDK, and the web UI have no open bugs.

## JavaScript SDK

`@priompt/client` 0.1.1 isn't on npm yet, so `npm install` gets 0.1.0. Version 0.1.0 computes NATS subjects the old way, so with a v0.7.3 or later server it doesn't receive events for addresses that contain `.` or other punctuation. It also doesn't read `PRIOMPT_TOKEN`, and a wrong broker token rejects with `TIMEOUT` after about 20 seconds. See [JavaScript SDK](/sdks/javascript).

**Workaround**: until 0.1.1 is on npm, install it from its git tag with `npm install github:priompt/js-sdk#v0.1.1`, or use addresses without `.` in their segments.

## Related

- [Roadmap](/roadmap): release status and planned work.
- [Troubleshooting](/guides/troubleshooting): error messages and fixes.
