# Turso for Slowcook iOS — Research Notes

## TL;DR

Turso + libsql-swift is a strong fit for Slowcook's vision: fully offline by default, optional paid cloud sync, and local vector search. The migration from SwiftData is non-trivial (you lose the `@Model` macro system) but the data model is simple enough that it's manageable.

---

## Current State (SwiftData)

Two models, local-only, no cloud:

```swift
// Book: id, title, author?, createdAt, [Recipe] (cascade delete)
// Recipe: id, name, pageStart?, pageEnd?, createdAt, Book?
```

SwiftData gives you: `@Query`, `@Model` macros, CloudKit sync (fragile), no vector support, no cross-device sharing between different Apple IDs.

---

## Turso / libsql-swift Capabilities

### 1. The SDK

`libsql-swift` is Turso's official Swift package. It targets iOS, macOS, watchOS, tvOS.

```swift
// Package.swift
.package(url: "https://github.com/tursodatabase/libsql-swift", from: "0.1.1")
```

The API is raw SQL — no ORM, no property wrappers. You write SQL and map rows manually. This is a meaningful DX trade-off vs SwiftData's macro system.

> **Status**: Marked "Technical Preview" as of early 2025. The underlying libSQL is production-battle-tested (it's a SQLite fork), but the Swift bindings are newer.

### 2. Three Connection Modes

| Mode | How | Use case |
|------|-----|----------|
| **Local only** | `Database(path:)` | Free tier — pure offline, no Turso account needed |
| **Remote only** | `Database(url:authToken:)` | Always-online, no local cache |
| **Embedded replica** | `Database(path:url:authToken:syncInterval:)` | Paid tier — offline-first with cloud sync |

The embedded replica mode is the key differentiator. It keeps a local SQLite file on-device, accepts reads and writes offline, and syncs to Turso Cloud when connected.

### 3. Offline Writes (Critical Feature)

Turso shipped "Offline Writes" in 2025 — writes go to the local replica immediately and sync up when connectivity returns. This is the behaviour you'd want for Slowcook:

- User scans a book on a plane ✓
- App writes to local replica ✓
- Data syncs to cloud next time they have internet ✓

Under the hood this uses SQLite's WAL (Write-Ahead Log). The replica that wrote always sees its own writes immediately. Other replicas (e.g. the user's iPad) see them after the next `sync()` call.

### 4. Sync API

```swift
// Manual sync (call on app foreground, connectivity restore)
try db.sync()

// Or let it run automatically every N seconds
let db = try Database(
    path: localPath,
    url: tursoURL,
    authToken: token,
    syncInterval: 60  // seconds
)
```

### 5. Vector Search

libSQL ships native vector search — no extension, no separate vector DB. The `F32_BLOB` column type stores float vectors, and `vector_distance_cos()` / `vector_top_k()` handle similarity queries.

```sql
-- Schema
CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_embedding F32_BLOB(1536)  -- or 512, 768 etc
);

-- ANN index (for larger datasets)
CREATE INDEX recipes_vec_idx ON recipes (libsql_vector_idx(name_embedding));

-- Search
SELECT id, name, vector_distance_cos(name_embedding, ?) AS score
FROM vector_top_k('recipes_vec_idx', ?, 10)
JOIN recipes USING (id)
ORDER BY score;
```

For Slowcook this means: embed recipe names (or descriptions) at scan time, then support semantic search like "pasta dishes" matching "spaghetti carbonara" even if the words don't overlap. This runs entirely on-device.

---

## Architecture for Slowcook

### Free Tier — Local Only

```swift
let db = try Database(path: appSupportPath("slowcook.db"))
let conn = try db.connect()
```

Replaces SwiftData entirely. No Turso account, no network calls, no paid dependency. The user's library lives in a SQLite file in Application Support.

### Paid Tier — Cloud Sync via Embedded Replica

```swift
let db = try Database(
    path: appSupportPath("slowcook.db"),
    url: userTursoURL,       // provisioned per-user on signup
    authToken: userToken,    // short-lived JWT from your backend
    syncInterval: 300        // background sync every 5 min
)
```

Each paid user gets their own Turso database. Turso's multi-tenant model is explicitly designed for this — they advertise scaling to billions of databases. The free Turso tier allows 500 databases; the $4.99/mo Developer plan allows 1,000.

**Your backend** (Cloudflare Worker + Hono, already built) would:
1. Provision a Turso database for the user via Turso Platform API on signup
2. Issue short-lived auth tokens via the Platform API
3. Store the `database_url` in the users table in D1

### Library Sharing

Turso's `ATTACH` feature lets you query multiple databases in one statement:

```sql
ATTACH 'turso://friend-library.turso.io?authToken=...' AS friend;
SELECT * FROM friend.recipes WHERE book_id = ?;
```

For a sharing model:
- User publishes their library → you set `allow_attach` on their DB + issue a read-only token
- Other users attach it for browsing
- "Import to my library" = read from attached DB, write to local

This is the paid sharing angle: the publisher needs a paid account (to have a cloud DB), but recipients can browse for free via read-only tokens.

### Schema

Minimal SQL schema (same shape as existing models):

```sql
CREATE TABLE books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    page_start INTEGER,
    page_end INTEGER,
    created_at INTEGER NOT NULL,
    name_embedding F32_BLOB(1536)  -- optional, for semantic search
);
```

---

## Trade-offs vs SwiftData

| | SwiftData | libsql-swift |
|--|-----------|--------------|
| **DX** | `@Model`, `@Query` macros | Raw SQL + manual row mapping |
| **CloudKit sync** | Built-in (same Apple ID only) | Turso embedded replica (any device, cross-platform) |
| **Vector search** | No | Native, on-device |
| **Cross-user sharing** | No | Yes, via per-user DBs + ATTACH |
| **Offline writes** | Yes | Yes |
| **Maturity** | Stable (iOS 17+) | libSQL stable; Swift SDK in technical preview |
| **Schema migrations** | Automatic (versioned) | Manual SQL migrations |
| **Cost** | Free | Free tier / $4.99/mo for paid features |
| **Vendor lock-in** | Apple only | The DB file is just SQLite — portable |

The main DX cost is losing the `@Model` macro system. You'd write a thin repository layer that maps SQL rows to Swift structs.

---

## Key Risks

1. **libsql-swift is in technical preview** — the API could change before 1.0. Worth watching the [GitHub repo](https://github.com/tursodatabase/libsql-swift) closely. The underlying libSQL is solid.

2. **No named parameters yet** — only positional `?` placeholders. Minor inconvenience.

3. **Provisioning per-user Turso DBs** adds backend complexity. You'd need to integrate the Turso Platform API into the Cloudflare Worker auth flow.

4. **Vector embeddings cost** — generating embeddings at scan time requires another API call (OpenAI embeddings, or Claude doesn't have an embeddings endpoint, so you'd use a small model like `text-embedding-3-small`). This is fine for a paid feature but adds cost and latency.

5. **Schema migrations** — SwiftData handles this automatically. With raw SQL you need to track schema versions yourself (a simple `user_version` PRAGMA or a migrations table).

---

## Recommended Next Steps

1. **Spike**: Swap SwiftData out for libsql-swift in local-only mode on a feature branch. The data model is 2 tables — this is a weekend-scale task.
2. **Repository layer**: Write `BookRepository` and `RecipeRepository` Swift structs that wrap `Connection` and return domain types. This isolates the rest of the app from the SQL.
3. **Migrations**: Add a `SchemaManager` that runs `PRAGMA user_version` and applies incremental `ALTER TABLE` / `CREATE TABLE` statements.
4. **Turso Platform API integration**: Extend the Cloudflare Worker to provision a DB + issue tokens on user creation.
5. **Embeddings at scan time**: After Claude extracts recipes, call an embeddings API and store vectors alongside recipe names. Semantic search then works offline forever.

---

## References

- [Turso Swift Quickstart](https://docs.turso.tech/sdk/swift/quickstart)
- [Embedded Replicas](https://docs.turso.tech/features/embedded-replicas/introduction)
- [Turso Goes Mobile — iOS & Android SDKs](https://turso.tech/blog/turso-goes-mobile-with-official-ios-and-android-sdks)
- [Offline Sync Public Beta](https://turso.tech/blog/turso-offline-sync-public-beta)
- [Offline Writes for Turso](https://turso.tech/blog/introducing-offline-writes-for-turso)
- [Native Vector Search for SQLite](https://turso.tech/blog/turso-brings-native-vector-search-to-sqlite)
- [Database Per Tenant](https://turso.tech/multi-tenancy)
- [Turso Pricing](https://turso.tech/pricing)
- [libsql-swift on GitHub](https://github.com/tursodatabase/libsql-swift)
- [Kin AI — on-device vector search case study](https://turso.tech/blog/local-first-ai-assistant-kin-leverages-tursos-libsql-for-on-device-native-vector-search)
