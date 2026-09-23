---
title: Monitoring and rate limits
---

# Monitoring and rate limits

Three gRPC interceptors run in front of every RPC.

## Prometheus metrics

`-metrics-addr` (default `:2112`; an empty value turns it off) serves `/metrics`:

| Metric | Labels |
| --- | --- |
| `priompt_requests_total` | `method`, `code` (gRPC status) |
| `priompt_request_duration_seconds` | histogram, by method |
| Go runtime metrics | the standard `go_*` metrics |

```sh
curl -s localhost:2112/metrics | grep ^priompt_requests_total
# priompt_requests_total{code="OK",method=".../GetPrompt"} 12
# priompt_requests_total{code="PermissionDenied",method=".../PublishPrompt"} 1
```

Denials are counted too, labeled by code. A scrape config:

```yaml title="prometheus.yml"
scrape_configs:
  - job_name: priompt
    static_configs:
      - targets: ["priompt:2112"]
```

Keep this port on an internal interface.

## Audit log

The server writes one structured JSON (slog) line per RPC to **stderr**, with the method, org scope, URI, gRPC code, and latency. Ship it with journald, Docker logging, or your log agent. Commits also record the author (the token's `sub` for JWTs).

## Rate limiting

Each org gets a token bucket. It's opt-in:

```sh
priompt serve -rate-limit 50 -rate-burst 100
```

Calls over the limit get `ResourceExhausted: rate limit exceeded for org "acme"`.
