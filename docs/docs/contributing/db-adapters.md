---
title: Storage engine (db-adapters)
---

# The storage engine (db-adapters)

`github.com/priompt/db-adapters` is the one copy of the storage engine. The server imports it, and any Go program can use it without a server.

```go
import store "github.com/priompt/db-adapters"

st, _ := store.Open("prompts.db")                  // a file path -> SQLite
st, _ := store.Open("postgres://user:pw@host/db")  // a postgres:// DSN -> PostgreSQL
```

The API covers the whole lifecycle: `Put`/`Get`/`List`/`Dump` for the served HEAD, and `Commit`/`Branch`/`Merge`/`Log`/`Resolve`/`SetBranch`/`GetCommit` for history. Migrations run automatically and idempotently at `Open`, and `PRIOMPT_ENCRYPTION_KEY` turns on AES-256-GCM.

## How backends plug in

All SQL is portable and written **once**, with `?` placeholders. A backend (a "dialect") only has to say three things:

```go
type dialect struct {
    driver string                // database/sql driver name
    match  func(dsn string) bool // does this DSN belong to this backend?
    rebind func(q string) string // ?-style placeholders -> native style
}
```

## Adding a database

1. Create `<name>.go` with a `dialect` var that blank-imports its driver. Copy the pattern in `postgres.go`.
2. Add it to the `dialects` list in `dialect.go`, **before** `sqlite`. SQLite is the catch-all: any DSN no other dialect claims is treated as a file path.
3. Check the upserts. The queries use `ON CONFLICT`, which SQLite and Postgres share. An engine without it (MySQL uses `ON DUPLICATE KEY`) needs a per-dialect upsert clause.

Tests run on SQLite in a temp directory. Run `go test ./...`; nothing needs installing.

## Schema evolution

Migrations are an ordered, append-only list. To change the schema, **append** a step. Never edit or reorder an existing one.
