---
title: priompt-auth
---

# `priompt-auth` reference

```text
priompt-auth init [-key-file auth.key] [-force]    generate the Ed25519 signing key
priompt-auth gen-secret <client_id> [org] [rw]     mint a service-account secret + clients.txt line
priompt-auth serve [flags]                         run the token issuer
```

## serve flags

| Flag | Default | |
| --- | --- | --- |
| `-addr` | `:8444` | listen address |
| `-key-file` | `auth.key` | signing key from `init` |
| `-clients-file` | | service accounts: `client_id sha256:<hex> [org] [rw]` |
| `-groups-file` | | IdP group → `[org] [rw]` mapping (first match wins) |
| `-oidc-issuer` | | IdP issuer URL. Turns on `grant_type=oidc`. |
| `-oidc-audience` | | the ID token's required `aud` |
| `-ttl` | `15m` | issued token lifetime |

## Endpoints

| Endpoint | |
| --- | --- |
| `POST /token` | `grant_type=client_credentials` with `client_id` and `client_secret`, or `grant_type=oidc` with `id_token`. Returns `{"access_token","token_type":"Bearer","expires_in"}`. |
| `GET /jwks` | public keys. Point the server's `-auth-jwks-url` here. |
| `GET /healthz` | liveness |

Errors: `401 {"error":"invalid_client"}` for bad client credentials, and `403 {"error":"access_denied"}` when an SSO user matches no group.

## Audit

The service writes one JSON line per issuance and per denial to stderr, with the subject, org, grant type, and reason.
