---
title: priompt-auth CLI
sidebar_label: priompt-auth
description: "priompt-auth commands, flags, HTTP endpoints, error responses, and the JWT claims it issues."
doc_type: reference
---

`priompt-auth` is the token issuer. It exchanges a service-account secret or an OIDC ID token from your identity provider for a short-lived JWT, which the Priompt server verifies offline against the issuer's `/jwks` endpoint.

```text
priompt-auth <init|gen-secret|serve> [flags]
```

For the setup walkthrough, see [Set up SSO and service accounts](../guides/sso.md).

## Commands

| Command | Description |
| --- | --- |
| [`init`](#init) | Generate the Ed25519 signing key. |
| [`gen-secret`](#gen-secret) | Mint a service-account secret and its `clients.txt` line. |
| [`serve`](#serve) | Run the HTTP token issuer. |

## Exit codes

- **`0`**: Success.
- **`1`**: The command failed or is unknown. The reason is on stderr, for example `unknown command "bogus" (want init, gen-secret, or serve)`.
- **`2`**: A flag that isn't defined.

## init

Generates an Ed25519 key pair and writes the private key as PEM. It refuses to overwrite an existing key, because every token signed with the old key stops verifying.

```text
priompt-auth init [-key-file auth.key] [-force]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-key-file` | | `auth.key` | Where to write the private key. |
| `-force` | | `false` | Overwrite an existing key file. |

**Example**

```sh
priompt-auth init
```

```text title="Output"
wrote auth.key (kid 05ccf04b)
next: priompt-auth gen-secret <client-id> [org] [rw], then priompt-auth serve
point the server at it: priompt serve -auth-jwks-url http://<this-host>:8444/jwks
```

The `kid` is derived from the public key and identifies it in the JWKS. A second run prints `auth.key exists; pass -force to overwrite (old tokens will stop verifying)` and exits `1`.

To rotate the key, run `init -force` and restart `serve`. Tokens signed with the old key stop working, so the longest outage for a client is one token lifetime.

## gen-secret

Prints a new client secret and the line to add to the clients file. The secret is shown once and never stored; the clients file holds only its SHA-256 hash.

```text
priompt-auth gen-secret <client-id> [org] [rw]
```

`[org]` scopes the issued tokens to one org (none means admin), and `rw` grants write access.

**Example**

```sh
priompt-auth gen-secret ci-bot acme rw
```

```text title="Output"
client_secret (give to the client, shown once):
  <secret>
clients.txt line (safe to commit — it is a hash):
  ci-bot sha256:65b2e1519e6121fd95ff92690ab4fedf53e3536d75ff9a64b8727efea067b99f acme rw
```

`<secret>` is 43 URL-safe base64 characters.

## serve

Runs the issuer over plain HTTP. Put it behind a TLS-terminating proxy if clients reach it over a network.

```text
priompt-auth serve [-clients-file <file>] [-oidc-issuer <url> -groups-file <file>] [flags]
```

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `-addr` | | `:8444` | Listen address. |
| `-key-file` | | `auth.key` | Private key from `init`. |
| `-clients-file` | | | Service accounts, one `client_id sha256:<hex> [org] [rw]` line each. |
| `-oidc-issuer` | | | Issuer URL of your identity provider. Turns on `grant_type=oidc`. Requires `-groups-file`. |
| `-oidc-audience` | | | Required `aud` claim on ID tokens. Empty skips the check. |
| `-groups-file` | | | Identity-provider groups mapped to grants, one `group [org] [rw]` line each. The first matching line wins; no org means admin. |
| `-ttl` | | `15m0s` | Lifetime of issued tokens. |

`priompt-auth` reads no environment variables.

At startup, `serve` fetches `<issuer>/.well-known/openid-configuration` to find the identity provider's keys, and exits if it can't. It also exits with `nothing to issue: pass -clients-file and/or -oidc-issuer` when neither source is set, and with `-oidc-issuer requires -groups-file (or every login would be denied)`.

```text title="Output"
priompt-auth on :8444 (kid 05ccf04b, ttl 15m0s, clients 2, oidc false)
```

### Clients and groups files

```text title="clients.txt"
ci-bot sha256:<hex> acme rw
dashboard sha256:<hex> acme
```

```text title="groups.txt"
prompt-admins rw
acme-authors acme rw
acme-readers acme
```

Blank lines and lines that start with `#` are ignored. A `#` later in a line isn't a comment, so keep comments on their own lines. The files are read at startup; to revoke a client, delete its line and restart.

## Endpoints

| Endpoint | Description |
| --- | --- |
| [`POST /token`](#post-token) | Exchange a credential for a JWT. |
| [`GET /jwks`](#get-jwks) | Public signing key, for `priompt serve -auth-jwks-url`. |
| [`GET /healthz`](#get-healthz) | Liveness check. Returns `ok`. |

### POST /token

Takes a form-encoded body with one of two grants:

- **`grant_type=client_credentials`** with `client_id` and `client_secret`: a service account from the clients file.
- **`grant_type=oidc`** with `id_token`: an RS256 ID token from the identity provider. `priompt-auth` checks its signature against the provider's keys, its `iss`, its `exp`, and its `aud` if `-oidc-audience` is set. Then it maps the token's `groups` claim through the groups file.

```sh
curl -s -X POST http://localhost:8444/token \
  -d grant_type=client_credentials -d client_id=ci-bot -d client_secret=<secret>
```

```text title="Output"
{"access_token":"<jwt>","expires_in":900,"token_type":"Bearer"}
```

Send the `access_token` as `authorization: Bearer <jwt>`, or set it as `PRIOMPT_TOKEN` for the CLIs.

Errors use OAuth 2.0 error bodies:

| Status | Body | Cause |
| --- | --- | --- |
| `400` | `{"error":"invalid_request"}` | The body couldn't be parsed as a form. |
| `400` | `{"error":"unsupported_grant_type"}` | Unknown `grant_type`, or `oidc` when `-oidc-issuer` isn't set. |
| `401` | `{"error":"invalid_client"}` | Unknown `client_id`, or the secret doesn't match. |
| `401` | `{"error":"invalid_grant"}` | The ID token failed a check: signature, issuer, expiry, or audience. |
| `403` | `{"error":"access_denied"}` | The ID token is valid, but none of its groups is in the groups file. |
| `405` | `Method Not Allowed` | A method other than `POST`. |

### GET /jwks

```sh
curl -s http://localhost:8444/jwks
```

```text title="Output"
{"keys":[{"kty":"OKP","crv":"Ed25519","kid":"05ccf04b","x":"Gz_-6F9yFBIV1J9ekPkQptAxnIORb63uozI9kEnOVQc"}]}
```

The server fetches this document on the first JWT it sees, and again (at most every 30 seconds) when a token names a `kid` it doesn't know. A key rotation needs no server restart.

### GET /healthz

```sh
curl -s http://localhost:8444/healthz
# => ok
```

## Token claims

An issued token is a compact JWT signed with EdDSA (Ed25519). The header is `{"alg":"EdDSA","kid":"<kid>","typ":"JWT"}`. The claims are defined once, in `github.com/priompt/proto/claims`, which both `priompt-auth` and the server import:

| Claim | Example | Description |
| --- | --- | --- |
| `sub` | `ci-bot`, `ada@example.com` | The client ID, or the ID token's `sub`. Recorded as the commit author and in the audit log. |
| `org` | `acme` | Org scope. Empty means admin, all orgs. |
| `rw` | `true` | Whether the token may publish, branch, merge, and roll back. |
| `iat` | `1792283867` | Issue time, in Unix seconds. |
| `exp` | `1792284767` | Expiry, in Unix seconds: `iat` plus `-ttl`. Required. |
| `iss` | `priompt-auth` | Issuer. Always `priompt-auth`. |

Decoded claims of the token above:

```json
{"sub":"ci-bot","org":"acme","rw":true,"exp":1792284767,"iat":1792283867,"iss":"priompt-auth"}
```

The server accepts a token when its signature verifies against a key from `/jwks`, its `alg` is `EdDSA`, and `exp` is in the future. Any failure is `Unauthenticated` with `invalid or missing token`. See [Errors](./errors.md#unauthenticated).

## Audit log

`serve` writes one JSON line to stderr for each token it issues and each request it denies. Each line also has a `time` field.

```json
{"level":"INFO","msg":"issued","sub":"ci-bot","org":"acme","rw":true,"ttl":"15m0s"}
{"level":"WARN","msg":"denied","grant":"client_credentials","client_id":"ci-bot"}
```

Denied OIDC requests carry `"grant":"oidc"` and a `reason`, such as `no group mapping`.
