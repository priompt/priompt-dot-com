---
title: Storage and backups
sidebar_label: Storage and backups
description: Choose SQLite or PostgreSQL, back up and restore prompt history, move to PostgreSQL, and encrypt prompts at rest.
doc_type: how-to
---

Priompt stores every prompt, its full commit history, and its branch pointers in one database: SQLite by default, or PostgreSQL when several nodes share the data. This guide picks the backend, backs it up and restores it, moves a SQLite database to PostgreSQL, and turns on encryption at rest.

## Prerequisites

Before you begin, make sure you have:

- **The `priompt` binary** on the host that can reach the database: see [Install Priompt](../installation/index.mdx).
- **For PostgreSQL**: a database and a user that can create tables in it.

## Choose a database

The `-db` flag picks the backend for `serve` and for every maintenance command:

```sh
priompt serve -db priompt.db                                   # SQLite file
priompt serve -db postgres://priompt:<password>@db:5432/prompts  # PostgreSQL
```

- **SQLite** needs nothing installed: the driver is built in. It suits a single node.
- **PostgreSQL** lets several nodes share one database. See [Scale to multiple nodes](./scaling.md).

The server creates the tables on its first start. The table layout is described in [Storage engine](../contributing/db-adapters.md).

## Run migrations

Pending schema steps run on every start. To run them as a separate deploy step instead:

```sh
priompt migrate -db priompt.db
```

```text title="Output"
schema up to date (version 4)
```

## Back up and restore

`priompt backup` writes the served prompts, every commit, and every branch pointer to a JSON Lines file. The restored database keeps its history, its branches, and the ability to roll back. You can back up while the server is running.

To back up and restore a database:

1. Write the backup:

   ```sh
   priompt backup -db priompt.db -out snapshot.jsonl
   ```

   ```text title="Output"
   backed up 4 prompts, 10 commits, 4 branch pointers
   ```

2. Restore it into an empty database:

   ```sh
   priompt restore -db restored.db -in snapshot.jsonl
   ```

   ```text title="Output"
   restored 4 prompts, 10 commits, 4 branch pointers
   ```

Restore refuses a database that already holds commits:

```text title="Output"
refusing to restore: restored.db already holds 10 commits.
Restore into an empty database, or pass -force to merge this backup into the existing history.
```

With `-force`, restore merges the backup into the existing history. Commit hashes are kept as they are, so running it twice doesn't duplicate anything.

To back up every night with cron:

```sh
0 3 * * * priompt backup -db /var/lib/priompt/priompt.db -out /backups/priompt-$(date +\%F).jsonl
```

## Copy prompts between servers

`priompt export` and `priompt import` carry only the version each prompt serves, without commits or branches. Use them to seed a staging server, not as a backup.

```sh
priompt export -db priompt.db -out prompts.jsonl
priompt import -db staging.db -in prompts.jsonl
```

```text title="Output"
exported 4 prompts (served content only — commits and branches are not included; use `priompt backup` for those)
imported 4 prompts (served content only — history was not part of this file; use `priompt restore` for a full backup)
```

The imported server serves every prompt, but a history request for any of them returns `NotFound: branch not found`.

## Migrate from SQLite to PostgreSQL

The backup format doesn't depend on the database, so a backup from SQLite restores into PostgreSQL.

To move a server to PostgreSQL:

1. Stop the server, so no publish lands after the backup.
2. Back up the SQLite file:

   ```sh
   priompt backup -db priompt.db -out snapshot.jsonl
   ```

   ```text title="Output"
   backed up 4 prompts, 8 commits, 4 branch pointers
   ```

3. Restore into the empty PostgreSQL database:

   ```sh
   priompt restore -db postgres://priompt:<password>@db:5432/prompts -in snapshot.jsonl
   ```

   ```text title="Output"
   restored 4 prompts, 8 commits, 4 branch pointers
   ```

4. Start the server with the PostgreSQL DSN in `-db`.

Replace `<password>` and `db` with your PostgreSQL password and host. The driver negotiates TLS with PostgreSQL when the server offers it. Add `?sslmode=require` to the DSN to insist on it.

## Turn on encryption at rest

With `PRIOMPT_ENCRYPTION_KEY` set, Priompt encrypts each prompt's template and slots with AES-256-GCM before they reach the database, so a copied database file is unreadable without the key. The same key seals the values in a shared Redis cache.

To turn on encryption:

1. Generate a key, 32 random bytes in base64, and store it in your secret manager:

   ```sh
   openssl rand -base64 32
   ```

2. Set it for the server and for every command that opens the database, such as `backup`, `restore`, and `put`:

   ```sh
   export PRIOMPT_ENCRYPTION_KEY=<key>
   priompt serve -db priompt.db
   ```

New writes are encrypted. In the database, an encrypted value starts with `enc1:`:

```text title="Output"
priompt://acme/onboarding/welcome enc1:PWDAnyAQcALxsZkrKFyHrXIUFdUqnvWvMZh e345dcf74d01
```

What to know about the key:

- **Rows written before the key stay readable.** They stay in plaintext until they're written again. To encrypt everything, back up and restore into a new database with the key set.
- **The server holds the key.** It decrypts prompts to validate and diff them, so this protects the disk, not the connection. Use TLS for that.
- **`version_hash` stays in plaintext**, so caching and deduplication keep working.
- **Backups are decrypted.** `priompt backup` writes plaintext JSON Lines. Protect the backup files as you would the key.
- **A key that isn't 32 bytes of base64 stops the server** with an error such as `PRIOMPT_ENCRYPTION_KEY: not valid base64`.
- **A missing or wrong key doesn't stop the server.** It starts and lists prompts, but every fetch of an encrypted prompt fails with `INTERNAL: lookup failed`. After a deploy, fetch one prompt to check the key.

:::danger
If you lose the key, the encrypted rows can't be recovered. Store it apart from the database and its backups.
:::

## Rotate the encryption key

To move a database to a new key:

1. With the old key set, back up the database. The backup is decrypted.

   ```sh
   PRIOMPT_ENCRYPTION_KEY=<old-key> priompt backup -db priompt.db -out plain.jsonl
   ```

2. With the new key set, restore into a new, empty database:

   ```sh
   PRIOMPT_ENCRYPTION_KEY=<new-key> priompt restore -db priompt-new.db -in plain.jsonl
   ```

   ```text title="Output"
   restored 4 prompts, 10 commits, 4 branch pointers
   ```

3. Start the server on the new database with the new key, and delete `plain.jsonl`.

## Next steps

- [Scale to multiple nodes](./scaling.md): share one PostgreSQL database between nodes.
- [Caching](./caching.md): the server cache in front of the database.
- [Production checklist](./production-checklist.md): every setting to check before go-live.
- [Storage engine](../contributing/db-adapters.md): the schema and how commits are stored.
