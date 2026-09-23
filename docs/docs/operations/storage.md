---
title: Storage and backups
---

# Storage and backups

Prompts live in **SQLite** (the default: a pure-Go driver with nothing to install) or **PostgreSQL** (for multiple nodes). The `-db` flag picks the backend:

```sh
priompt serve -db priompt.db                              # SQLite
priompt serve -db postgres://user:pass@host:5432/prompts  # PostgreSQL
```

## Schema

```mermaid
flowchart TD
    P["prompts<br/>the served HEAD of each prompt"]
    C["commits<br/>the full history DAG"]
    R["refs<br/>branch name → tip commit"]
    R -->|"points into"| C
    C -->|"tip of main is materialized into"| P
```

```sql
CREATE TABLE prompts (
  uri TEXT PRIMARY KEY, template TEXT NOT NULL,
  slots TEXT NOT NULL,              -- JSON array
  version_hash TEXT NOT NULL
);
CREATE TABLE commits (
  hash TEXT PRIMARY KEY, uri TEXT NOT NULL,
  template TEXT NOT NULL, slots TEXT NOT NULL, version_hash TEXT NOT NULL,
  parent TEXT, parent2 TEXT,        -- parent2 only on merge commits
  author TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE refs (
  uri TEXT NOT NULL, branch TEXT NOT NULL, commit_hash TEXT NOT NULL,
  PRIMARY KEY (uri, branch)
);
```

A commit on `main` updates all three tables in one transaction, so the served HEAD always matches history.

## Migrations

The schema is an ordered list of steps, each applied exactly once. Pending steps run on every startup inside a transaction, and progress is recorded in `schema_version`. To run them as an explicit deploy step:

```sh
priompt migrate -db priompt.db
# schema up to date (version 4)
```

## Backup and restore

There are two pairs of commands, because they do different jobs.

```sh
# Full backup: served content + commit history + every branch pointer
priompt backup  -db priompt.db -out snapshot.jsonl
priompt restore -db fresh.db   -in  snapshot.jsonl

# Content only: copy prompts between servers, seed a staging environment
priompt export -db priompt.db -out prompts.jsonl
priompt import -db staging.db -in  prompts.jsonl
```

- **`backup` / `restore`** carry all three tables and keep commit hashes verbatim, so the restored database still has its history, its branches, and the ability to roll back. Restore is idempotent, and it refuses a target that already holds commits unless you pass `-force`.
- **`export` / `import`** carry only the served HEAD. That's fine for copying content, but it isn't a backup: the rebuilt database serves every prompt and has no history.

The JSONL format doesn't depend on the database, so **moving from SQLite to Postgres takes two commands**:

```sh
priompt backup  -db priompt.db -out snap.jsonl
priompt restore -db postgres://postgres:pw@db:5432/prompts -in snap.jsonl
```

A nightly cron backup:

```sh
0 3 * * * priompt backup -db /var/lib/priompt/priompt.db -out /backups/priompt-$(date +\%F).jsonl
```

## Encryption at rest

```sh
export PRIOMPT_ENCRYPTION_KEY=$(openssl rand -base64 32)
priompt serve -db priompt.db
```

The `template` and `slots` columns are encrypted with **AES-256-GCM**, so a stolen database file is useless without the key.

- **At rest, not end-to-end.** The server holds the key, because it has to decrypt prompts to validate and diff them.
- **`version_hash` stays plaintext**, so deduplication and caching keep working.
- **No migration is needed to turn it on.** Encrypted values carry a marker, so old rows stay readable and new writes are encrypted. Rotation isn't automated; re-`put` a prompt to re-encrypt it.
- Every process that touches the database (`serve`, `put`, `backup`, …) needs the same key. `backup` writes **decrypted** JSONL, so protect backup files.
- **If you lose the key, the encrypted rows can't be recovered.**
