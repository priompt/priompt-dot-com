---
title: Monitoring and rate limits
sidebar_label: Monitoring
description: Scrape Prometheus metrics, read the per-request audit log, and limit request rates per org.
doc_type: how-to
---

A Priompt server reports what it does in two ways: Prometheus metrics for every gRPC call, and a JSON audit line per request on stderr. This guide scrapes the metrics, reads the audit log, and turns on per-org rate limits so one team can't starve the others.

## Prerequisites

Before you begin, make sure you have:

- **A running server**: see the [Quickstart](../quickstart.mdx).
- **Prometheus**, or another scraper that reads the Prometheus text format.

## Scrape metrics

The server serves `/metrics` on `-metrics-addr`, which defaults to `:2112` on every interface. An empty value turns it off. Bind it to an internal address in production:

```sh
priompt serve -metrics-addr 127.0.0.1:2112
```

To check the endpoint:

```sh
curl -s 127.0.0.1:2112/metrics | grep -E "^priompt_(build_info|requests_total)"
```

```text title="Output"
priompt_build_info{commit="unknown",goversion="go1.26.4",version="v0.7.4"} 1
priompt_requests_total{code="InvalidArgument",method="/priompt.v1.PromptService/PublishPrompt"} 1
priompt_requests_total{code="NotFound",method="/priompt.v1.PromptService/GetPrompt"} 2
priompt_requests_total{code="OK",method="/priompt.v1.PromptService/DiffPrompt"} 4
priompt_requests_total{code="OK",method="/priompt.v1.PromptService/GetPrompt"} 2022
priompt_requests_total{code="OK",method="/priompt.v1.PromptService/History"} 1
priompt_requests_total{code="OK",method="/priompt.v1.PromptService/ListPrompts"} 1
priompt_requests_total{code="OK",method="/priompt.v1.PromptService/PublishPrompt"} 9
```

The server exports these metrics:

| Metric | Type | Labels | Description |
| --- | --- | --- | --- |
| `priompt_build_info` | Gauge | `version`, `commit`, `goversion` | Always 1. The labels identify the running build. |
| `priompt_requests_total` | Counter | `method`, `code` | gRPC requests by method and status code, including denied and rate-limited ones. |
| `priompt_request_duration_seconds` | Histogram | `method` | gRPC request latency. |
| `go_*`, `process_*` | Various | | Standard Go runtime and process metrics. |

Add the server to Prometheus:

```yaml title="prometheus.yml"
scrape_configs:
  - job_name: priompt
    static_configs:
      - targets: ["priompt:2112"]
```

To graph the rate of failed requests by status code, use a query such as:

```text
sum by (code) (rate(priompt_requests_total{code!="OK"}[5m]))
```

## Read the audit log

The server writes one JSON line per request to stderr, with the method, the caller's org, the prompt address, the status code, and the latency in milliseconds:

```json
{"time":"2026-10-18T10:20:42.690252+05:30","level":"INFO","msg":"rpc","method":"/priompt.v1.PromptService/PublishPrompt","org":"acme","uri":"priompt://acme/support/summarize","code":"OK","ms":2}
```

`org` is empty for an admin token and for a server without authentication. A request with a `priompt-auth` JWT also carries `"sub"`, the token's subject, such as `"sub":"ci-bot"`, after `org`. Static tokens have no subject, so their lines have no `sub`. Requests that fail authentication don't reach the audit log, because it runs after the token check. They're counted in `priompt_requests_total` with `code="Unauthenticated"`. Startup messages and errors are plain text on the same stream, so filter on `"msg":"rpc"` when you ship the log with journald, Docker logging, or your log agent.

## Limit request rates

Rate limits are off by default. Each org gets its own token bucket on each node.

To turn on rate limits:

1. Start the server with a rate, in requests per second, and a burst size:

   ```sh
   priompt serve -tokens-file tokens.txt -rate-limit 50 -rate-burst 100
   ```

   The startup line shows `ratelimit=50/s`. Without `-rate-burst`, the burst equals the rate.

2. Check that a client over the limit is refused. A request beyond the burst fails with:

   ```text title="Output"
   rpc error: code = ResourceExhausted desc = rate limit exceeded for org "acme"
   ```

   The audit log records the refusal with `"code":"ResourceExhausted"`, and `priompt_requests_total` counts it.

Admin tokens and servers without authentication share the bucket of the empty org `""`. With several nodes, each node limits separately, so the cluster-wide limit is the per-node rate times the number of nodes behind the load balancer.

## Next steps

- [Production checklist](./production-checklist.md): every setting to check before go-live.
- [Secure a server](./security.md): the tokens that set each request's org.
- [Scale to multiple nodes](./scaling.md): run several nodes behind a load balancer.
- [Errors](../reference/errors.md): what each status code in the metrics means.
