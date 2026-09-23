---
title: Scaling to multiple nodes
---

# Scaling to multiple nodes

A single SQLite node is the floor, not the ceiling. On a laptop it measured about **190 writes/s** and **6,300 reads/s** with 32 threads. When you need more, run N identical nodes behind a load balancer and share three things:

| Shared | How |
| --- | --- |
| Storage | `-db postgres://…` on every node |
| L2 cache | `-redis-url redis://…` on every node |
| Change events | clustered NATS (below) |

## Postgres and Redis

```sh
# migrate existing data once
priompt backup  -db priompt.db -out snap.jsonl
priompt restore -db postgres://priompt:pw@db:5432/prompts -in snap.jsonl

# every node
priompt serve -db postgres://priompt:pw@db:5432/prompts -redis-url redis://cache:6379/0
```

## NATS across nodes

Each node embeds its own broker. Without clustering, a publish that lands on node A is invisible to agents connected to node B, so on an N-node cluster an agent misses (N-1)/N of all notifications. Cluster the embedded brokers:

```sh
# node A
priompt serve -nats-addr 0.0.0.0:4222 -nats-token $TOK \
  -nats-cluster-addr 0.0.0.0:6222 -nats-cluster-secret $ROUTE_SECRET \
  -nats-routes nats://node-b:6222

# node B: the same, with -nats-routes nats://node-a:6222
```

The alternative is to point every node and agent at one external NATS server.

:::warning The cluster port belongs on a trusted network
`-nats-cluster-secret` authenticates route peers, and the server refuses a non-loopback cluster address without one. That's necessary but not sufficient: the NATS cluster listener also accepts ordinary client connections authenticated with the client token. Never expose port 6222 publicly. Mutual TLS on the cluster listener is the only real peer authentication.
:::

## Load balancer notes

- gRPC is HTTP/2. Use an L4 (TCP) balancer, or an L7 one that supports gRPC (Envoy, nginx `grpc_pass`, a cloud gRPC LB).
- Nodes are stateless apart from the shared services, so any node can serve any request.
- Concurrent publishes to one prompt are safe across nodes. The branch update is a compare-and-swap in the shared database.
