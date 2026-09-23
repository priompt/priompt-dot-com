---
title: From source
---

# Build from source

This works on Linux, macOS, and Windows today. Every Priompt binary is pure Go (the SQLite driver is `modernc`, not CGO), so there's no C toolchain to install and cross-compiling is a single env var.

## Requirements

| Tool | Version | Needed for |
| --- | --- | --- |
| Go | **1.25+** | all binaries |
| git | any | cloning |
| Python | 3.9+ | Python SDK (optional) |
| Node | 20+ | JS SDK, web UI (optional) |
| buf | latest | only when changing the `.proto` contract |

Installing Go:

- **Linux:** the tarball from [go.dev/dl](https://go.dev/dl/) (distro packages are often too old)
- **macOS:** `brew install go`
- **Windows:** `winget install GoLang.Go`

## Get the code

The Go modules aren't published yet, so the server's `go.mod` uses `replace` directives pointing at **sibling directories**. Clone the family side by side under one parent:

```sh
mkdir priompt-family && cd priompt-family
for r in priompt proto db-adapters auth cli python-sdk js-sdk; do
  git clone https://github.com/priompt/$r.git
done
```

```text
priompt-family/
├── priompt/       # the server (needs proto, db-adapters, auth to build)
├── proto/         # shared contract + validate + semdiff
├── db-adapters/   # storage engine
├── auth/          # priompt-auth + the authn package the server imports
├── cli/           # promptctl
├── python-sdk/
└── js-sdk/
```

The server needs the `auth` checkout to **build**, because it imports `priomptauth/authn` for credential handling. It doesn't need the `priompt-auth` service to **run**.

## Build the server

```sh
cd priompt
go build -o priompt ./cmd/priompt        # Linux / macOS
go build -o priompt.exe ./cmd/priompt    # Windows
./priompt serve                          # :8443, SQLite at ./priompt.db
```

There's also a Makefile: `make build` and `make test`.

### Cross-compile

Build for any target from any machine:

```sh
GOOS=linux   GOARCH=amd64 CGO_ENABLED=0 go build -o dist/priompt-linux-amd64     ./cmd/priompt
GOOS=linux   GOARCH=arm64 CGO_ENABLED=0 go build -o dist/priompt-linux-arm64     ./cmd/priompt
GOOS=darwin  GOARCH=arm64 CGO_ENABLED=0 go build -o dist/priompt-darwin-arm64    ./cmd/priompt
GOOS=darwin  GOARCH=amd64 CGO_ENABLED=0 go build -o dist/priompt-darwin-amd64    ./cmd/priompt
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -o dist/priompt-windows-amd64.exe ./cmd/priompt
```

In PowerShell, set the variables first: `$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"; go build …`.

## promptctl and priompt-auth

```sh
cd ../cli  && go build -o promptctl .       # authoring CLI
cd ../auth && go build -o priompt-auth .    # token issuer (SSO / service accounts)
```

Add `.exe` to the output names on Windows.

## SDKs from the checkout

```sh
pip install -e ../python-sdk            # imports as `priompt`
pip install -e "../python-sdk[nats]"    # + subscribe()

cd ../js-sdk && npm install             # then require("./client.js") or npm link
```

## Verify

```sh
cd priompt && go test ./...
./priompt migrate          # schema up to date (version 4)
```

Next, run it as a service: [Linux](./linux.mdx) · [macOS](./macos.mdx) · [Windows](./windows.mdx).
