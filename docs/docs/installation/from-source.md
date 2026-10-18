---
title: Build from source
sidebar_label: From source
description: Install the Priompt binaries with go install, or build the server from a clone of its repo.
doc_type: how-to
---

This guide installs the `priompt`, `promptctl`, and `priompt-auth` binaries from source with Go. It works on Linux, macOS, and Windows. Every binary is pure Go, with no C toolchain needed, and cross-compiles with two environment variables.

## Prerequisites

Before you begin, make sure you have:

- **Go 1.25 or later**: on Linux, use the tarball from [go.dev/dl](https://go.dev/dl/), because distribution packages are often older. On macOS, run `brew install go`. On Windows, run `winget install GoLang.Go`.
- **git**: only to build from a clone.

## 1. Install the binaries

The Go modules are published under `github.com/priompt`, so `go install` needs no clone.

To install the binaries:

1. Install the server. The other two binaries are optional:

   ```sh
   go install github.com/priompt/priompt/cmd/priompt@latest
   go install github.com/priompt/cli/cmd/promptctl@latest
   go install github.com/priompt/auth/cmd/priompt-auth@latest
   ```

   Go puts the binaries in `$(go env GOPATH)/bin`. To pin a release, replace `@latest` with a version tag such as `@v0.7.2`.

2. Check the server's version:

   ```sh
   priompt version
   ```

   ```text title="Output"
   priompt v0.7.2 (commit unknown, go1.26.4)
   ```

3. Create a database to check that the storage engine works:

   ```sh
   priompt migrate -db check.db
   ```

   ```text title="Output"
   schema up to date (version 4)
   ```

   Delete `check.db` afterwards. `promptctl` and `priompt-auth` print their usage when you run them without arguments.

## 2. Build the server from a clone

Build from a clone to run unreleased changes. The repo builds on its own and fetches the other modules from the Go module proxy at the versions in its `go.mod`.

To build the server from a clone:

1. Clone the repo:

   ```sh
   git clone https://github.com/priompt/priompt.git
   cd priompt
   ```

2. Build the binary. On Windows, name the output `priompt.exe`:

   ```sh
   go build -o priompt ./cmd/priompt
   ```

3. Start it:

   ```sh
   ./priompt serve
   ```

   The server listens on `:8443` and stores its database in `./priompt.db`.

The repo's Makefile also has `make build` and `make test`. To change several repos at once, see [Development setup](/contributing/development).

<details>
<summary>Cross-compile for another platform</summary>

Set `GOOS` and `GOARCH` to build for any target from any machine:

```sh
GOOS=linux   GOARCH=amd64 CGO_ENABLED=0 go build -o dist/priompt-linux-amd64       ./cmd/priompt
GOOS=linux   GOARCH=arm64 CGO_ENABLED=0 go build -o dist/priompt-linux-arm64       ./cmd/priompt
GOOS=darwin  GOARCH=arm64 CGO_ENABLED=0 go build -o dist/priompt-darwin-arm64      ./cmd/priompt
GOOS=darwin  GOARCH=amd64 CGO_ENABLED=0 go build -o dist/priompt-darwin-amd64      ./cmd/priompt
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -o dist/priompt-windows-amd64.exe ./cmd/priompt
```

In PowerShell, set the variables first: `$env:GOOS = "linux"; $env:GOARCH = "arm64"; $env:CGO_ENABLED = "0"`, then run `go build`.

</details>

## Next steps

- Run the server as a service: [Linux](./linux.mdx), [macOS](./macos.mdx), or [Windows](./windows.mdx).
- [Quickstart](../quickstart.mdx): fetch a prompt and watch a change arrive.
- [Development setup](/contributing/development): work on several Priompt repos at once.
