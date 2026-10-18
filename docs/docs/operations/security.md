---
title: Secure a server
sidebar_label: Security
description: Turn on bearer tokens, scope them to orgs, add TLS or mTLS, and require a token on the change-event broker.
doc_type: how-to
---

This guide locks down a Priompt server. You turn on bearer tokens for the gRPC API, scope tokens to orgs, encrypt connections with TLS or mTLS, and put a token on the NATS broker that carries change events. For how the server decides what a token may do, see [Orgs, tokens, and access](../concepts/access-control.md).

:::danger Open by default
A server started without tokens accepts every request with admin rights, including writes. Use that only on a machine nobody else can reach.
:::

## Prerequisites

Before you begin, make sure you have:

- **The `priompt` binary**: see [Install Priompt](../installation/index.mdx).
- **OpenSSL**: only to create test certificates for TLS.

## Create an admin token

`priompt init` writes a random admin token with write access to `tokens.txt` and prints the commands that use it.

To turn on authentication:

1. Create the tokens file:

   ```sh
   priompt init
   ```

   ```text title="Output"
   wrote admin token to tokens.txt

     start server:  priompt serve -tokens-file tokens.txt
     point client:  export PRIOMPT_URL=priompt://<token>@localhost:8443
   ```

   `init` refuses to overwrite an existing file: `tokens.txt already exists; pass -force to overwrite`.

2. Start the server with the file:

   ```sh
   priompt serve -tokens-file tokens.txt
   ```

   The startup line reports how many tokens it loaded, for example `auth=1-token`.

3. Point clients at the server with the printed URL:

   ```sh
   export PRIOMPT_URL=priompt://<token>@localhost:8443
   ```

   The `priompt` client commands and both SDKs read `PRIOMPT_URL`. The CLI also accepts the token alone in `PRIOMPT_TOKEN`.

A request without a valid token now fails with `Unauthenticated: invalid or missing token`.

:::warning PRIOMPT_TOKEN means two things
On the server, `PRIOMPT_TOKEN` adds an admin token with write access. On a client, it's the token to send. If you export it for the CLI and then start `priompt serve` in the same shell, that value becomes an admin credential on the server.
:::

## Create scoped tokens

Each line of the tokens file is a token followed by up to three optional fields, in any order:

- **Org**: limits the token to addresses under `priompt://<org>/`. A token without an org is an admin token for every org.
- **Expiry**: a date such as `2026-12-31` or an RFC 3339 timestamp. After it, the token fails with `Unauthenticated: token expired`.
- **`rw`**: allows writes: publish, branch, merge, and roll back. Without it, the token can only read.

To add scoped tokens:

1. Mint a token for each client:

   ```sh
   priompt gen-token
   ```

   ```text title="Output"
   c2e6bc7b33efea35fb7c1e113f9d5eb68957361bb3524f32b045bc7c6d26e959
   ```

2. Add one line per token to `tokens.txt`:

   ```text title="tokens.txt"
   # token [org] [expiry] [rw]
   <admin-token> rw
   <acme-reader-token> acme
   <acme-author-token> acme rw
   <acme-contractor-token> acme 2026-12-31 rw
   ```

   Replace each `<...-token>` with a value from `priompt gen-token`. Put comments on their own lines. The server reads a word after the token as a field, so `<token> # read-only` scopes the token to an org named `read-only`.

3. Restart the server so it reads the file again.

This is what each kind of token gets, from a test against a server with this file:

| Token | Request | Result |
| --- | --- | --- |
| `acme` reader | `priompt list -prefix priompt://acme/` | Lists the `acme` prompts. |
| `acme` reader | `priompt list` | `PermissionDenied: token not authorized for prefix ""` |
| `acme` reader | `priompt publish -uri priompt://acme/...` | `PermissionDenied: token is read-only` |
| `acme` author | `priompt publish -uri priompt://globex/...` | `PermissionDenied: token not authorized for org "globex"` |
| Expired | Any | `Unauthenticated: token expired` |
| Unknown | Any | `Unauthenticated: invalid or missing token` |

For SSO users and service accounts with short-lived tokens, run `priompt-auth` alongside the tokens file. See [SSO and service accounts](../guides/sso.md).

## Rotate a token

To replace a token without downtime:

1. Mint the new token with `priompt gen-token` and add it to `tokens.txt`.
2. Give the old token's line an expiry a few days out, such as `<old-token> acme 2026-11-01 rw`.
3. Restart the server, and move each client to the new token.
4. After the expiry, delete the old line and restart again.

## Turn on TLS and mTLS {#tls-and-mtls}

With TLS, the server encrypts every gRPC connection. With mTLS, it also refuses any client that doesn't present a certificate signed by your CA, before it checks tokens.

To create test certificates with OpenSSL:

1. Create a CA:

   ```sh
   openssl req -x509 -newkey rsa:2048 -nodes -days 365 -keyout ca.key -out ca.pem -subj "/CN=priompt-ca"
   ```

2. Create the server certificate. List every name clients use in `subjectAltName`:

   ```sh
   openssl req -newkey rsa:2048 -nodes -keyout server.key -out server.csr -subj "/CN=localhost"
   printf "subjectAltName=DNS:localhost,IP:127.0.0.1\n" > server.ext
   openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key -CAcreateserial -days 365 -out server.pem -extfile server.ext
   ```

   ```text title="Output"
   Certificate request self-signature ok
   subject=CN=localhost
   ```

3. For mTLS, create a client certificate signed by the same CA:

   ```sh
   openssl req -newkey rsa:2048 -nodes -keyout client.key -out client.csr -subj "/CN=agent"
   openssl x509 -req -in client.csr -CA ca.pem -CAkey ca.key -CAcreateserial -days 365 -out client.pem
   ```

   ```text title="Output"
   Certificate request self-signature ok
   subject=CN=agent
   ```

For production, use certificates from your own CA with the server's real hostname, such as `prompts.example.com`.

To serve over TLS:

1. Start the server with the certificate and key. Add `-client-ca` to require client certificates:

   ```sh
   priompt serve -tokens-file tokens.txt -tls-cert server.pem -tls-key server.key -client-ca ca.pem
   ```

   ```text title="Output"
   2026/10/18 06:10:50 priompt v0.7.2 (unknown) serving on :8443 (tls=true mtls=true auth=1-token cache=mem embed=lexical(offline) nats=127.0.0.1:4222 metrics=:2112 ratelimit=0/s)
   ```

   Pass both `-tls-cert` and `-tls-key`. With only `-tls-cert`, the server serves plaintext, even though its startup line says `tls=true`. `-client-ca` without them stops the server with `-client-ca requires -tls-cert and -tls-key`.

2. Connect with the CA certificate, and with the client certificate for mTLS:

   ```sh
   priompt list -tls -ca-cert ca.pem -cert client.pem -key client.key
   ```

   ```text title="Output"
   priompt://acme/onboarding/welcome	e345dcf74d01
   ```

A plaintext client gets `rpc error: code = Unavailable desc = connection error: desc = "error reading server preface: EOF"`. Under mTLS, a client without a certificate also gets `Unavailable`. The SDKs take the same three files: see [Python SDK](../sdks/python.mdx) and [JavaScript SDK](../sdks/javascript.mdx).

## Require a token on the broker

Change events go out on the server's embedded NATS broker, which listens on `127.0.0.1:4222` by default. An event names the prompt and carries the verdict that agents use to decide whether to reload, so an open broker leaks your prompt names and lets anyone forge events.

To expose the broker to other hosts:

1. Set a broker token and bind the broker to a reachable address:

   ```sh
   export PRIOMPT_NATS_TOKEN=$(priompt gen-token)
   priompt serve -tokens-file tokens.txt -nats-addr 0.0.0.0:4222
   ```

   Without a token, the server refuses a non-loopback address:

   ```text title="Output"
   -nats-addr 0.0.0.0:4222 is not loopback: set -nats-token (or PRIOMPT_NATS_TOKEN) so subscribers must authenticate, or bind NATS to 127.0.0.1
   ```

2. Give subscribers the token inside the broker URL:

   ```sh
   priompt watch -uri priompt://acme/onboarding/welcome -nats-url nats://<nats-token>@prompts.example.com:4222
   ```

   A subscriber without the token fails with `nats: Authorization Violation`.

The broker token is separate from the gRPC tokens, and there's one for the whole broker. Anyone who holds it can watch every org's events and publish events of their own, so give it only to services you trust. `priompt watch` prints the broker URL with the token when it starts, so keep its logs private.

## Encrypt data at rest

Set `PRIOMPT_ENCRYPTION_KEY` to encrypt prompt content in the database and in the Redis cache. See [Storage and backups](./storage.md#turn-on-encryption-at-rest) for the procedure and key handling.

## Next steps

- [Production checklist](./production-checklist.md): every setting to check before a server takes real traffic.
- [Orgs, tokens, and access](../concepts/access-control.md): how the server authorizes each request.
- [SSO and service accounts](../guides/sso.md): short-lived tokens from your identity provider.
- [Monitoring and rate limits](./monitoring.md): see denied requests in metrics and the audit log.
