# Cookbook Recipe Finder - Product Document

## Problem Statement

Physical cookbook owners face a common frustration: finding a specific recipe across multiple books. The current workflow involves:
- Flipping through multiple book indices manually
- Doing "human keyword search" across different index formats
- Often not remembering the exact recipe name (e.g., knowing you want "kale salad with crispy chickpeas" but not knowing it's called "Tuscan Kale Caesar with Chickpea Croutons")
- Online recipes are ad-heavy, inconsistently structured, and lack the curated quality of purchased cookbooks

## Solution Overview

A web application that digitizes cookbook indices and provides intelligent search across a user's entire cookbook library.

**Core Value Proposition**: Ask "kale salad with crispy chickpeas" and instantly learn it's in *Half-Baked Harvest: Super Simple*, page 123.

---

## User Flows

### 1. Onboarding a New Cookbook

```
User adds new book (title, author)
    ↓
User photographs index pages (phone camera or file upload)
    ↓
Images uploaded to R2 storage
    ↓
Claude Vision API extracts recipe entries (name, page range, category)
    ↓
Recipes stored in D1, embeddings generated and stored in Vectorize
    ↓
User can review/edit extracted recipes if needed
    ↓
Book is now searchable in their library
```

### 2. Searching for a Recipe

```
User enters search query (e.g., "kale salad chickpeas")
    ↓
Hybrid search executes:
  - Full-text search on D1 (exact/partial matches)
  - Vector similarity search on Vectorize (semantic matches)
    ↓
Results combined, deduplicated, ranked
    ↓
User sees: Recipe Name | Book Title | Page(s)
    ↓
User grabs the physical book and cooks!
```

### 3. Browsing a Cookbook

```
User clicks into a specific book
    ↓
Views all recipes from that book's index
    ↓
Can filter/sort by category, page number, or search within book
    ↓
Useful for "what should I make from this book?" discovery
```

---

## Data Model

### Users
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (UUID) | Primary key |
| email | TEXT | Unique, required |
| password_hash | TEXT | Hashed by better-auth |
| created_at | INTEGER | Unix timestamp |

### Books
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT | Foreign key → Users |
| title | TEXT | Required |
| author | TEXT | Nullable |
| created_at | INTEGER | Unix timestamp |

### Recipes
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (UUID) | Primary key |
| book_id | TEXT | Foreign key → Books |
| name | TEXT | Recipe name from index |
| page_start | INTEGER | Starting page |
| page_end | INTEGER | Nullable (same as page_start if single page) |
| category | TEXT | Nullable (e.g., "Salads", "Mains") |
| created_at | INTEGER | Unix timestamp |

### IndexImages
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (UUID) | Primary key |
| book_id | TEXT | Foreign key → Books |
| r2_key | TEXT | Path to image in R2 bucket |
| last_processed_at | INTEGER | Nullable, Unix timestamp |
| created_at | INTEGER | Unix timestamp |

### Vector Store (Vectorize)
- **Index name**: `recipe-embeddings`
- **Dimensions**: 768 (using `@cf/baai/bge-base-en-v1.5`)
- **Metadata**: `{ recipe_id: string, user_id: string }`

---

## Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Monorepo** | Turborepo + Bun | Already scaffolded, fast builds |
| **API Runtime** | Cloudflare Workers | Edge-first, integrates with D1/R2/Vectorize |
| **API Router** | Hono | Lightweight, Workers-optimized |
| **Type-safe API** | oRPC | TypeScript end-to-end, React Query integration |
| **Database** | Cloudflare D1 + Drizzle ORM | SQLite at edge, type-safe queries |
| **Vector Search** | Cloudflare Vectorize | Native Workers AI integration |
| **Embeddings** | Workers AI (`bge-base-en-v1.5`) | No external API needed for embeddings |
| **Image Storage** | Cloudflare R2 | S3-compatible, no egress fees |
| **OCR** | Claude Vision API | Best-in-class for complex index layouts |
| **Auth** | better-auth | Self-hosted, full control |
| **Frontend** | Vite + React + TanStack Router/Query | SPA that consumes API; same pattern works for React Native |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Web App                            │
│            (Vite + TanStack Router/Query + oRPC client)         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers API                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Hono Router                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ better-auth │  │    oRPC     │  │  Static Routes  │   │  │
│  │  │  /api/auth  │  │  /api/rpc   │  │   /health etc   │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│       oRPC procedures call directly into @cookbooks/db          │
│                              │                                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │    D1     │  │ Vectorize │  │    R2     │  │ Workers AI  │  │
│  │ (SQLite)  │  │ (Vectors) │  │ (Images)  │  │(Embeddings) │  │
│  └───────────┘  └───────────┘  └───────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │  Claude Vision API  │
                    │   (External OCR)    │
                    └─────────────────────┘
```

### Why Hono + oRPC?

- **Hono** is the HTTP framework that listens for requests on Cloudflare Workers
- **oRPC** handles type-safe RPC procedures (`books.list`, `recipes.create`, etc.)
- **better-auth** requires HTTP routes (`/api/auth/*`) - it can't be wrapped in oRPC
- Hono mounts both oRPC and better-auth at different paths

---

## Monorepo Structure

```
cookbooks/
├── apps/
│   ├── api/                    # Cloudflare Worker
│   │   ├── src/
│   │   │   ├── index.ts        # Hono entry point (mounts oRPC + better-auth)
│   │   │   ├── rpc/            # oRPC router and procedures
│   │   │   │   ├── router.ts   # Main router (exports AppRouter type)
│   │   │   │   ├── books.ts    # Book procedures
│   │   │   │   ├── recipes.ts  # Recipe procedures
│   │   │   │   └── search.ts   # Search procedures
│   │   │   ├── auth/           # better-auth setup
│   │   │   └── lib/            # Utilities (e.g., Claude API client)
│   │   ├── wrangler.toml       # CF Worker config
│   │   └── package.json
│   │
│   └── web/                    # React frontend (SPA)
│       ├── src/
│       │   ├── components/
│       │   ├── routes/         # TanStack Router pages
│       │   ├── hooks/
│       │   └── lib/
│       │       └── api.ts      # oRPC client (imports type from apps/api)
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── db/                     # Drizzle schema & queries
│   │   ├── src/
│   │   │   ├── schema.ts       # Drizzle table definitions
│   │   │   ├── queries/        # Query functions (accept db instance)
│   │   │   │   ├── books.ts
│   │   │   │   ├── recipes.ts
│   │   │   │   └── search.ts
│   │   │   └── index.ts        # Re-exports
│   │   ├── drizzle.config.ts
│   │   ├── migrations/         # D1 migrations
│   │   └── package.json
│   │
│   ├── shared/                 # Shared types & Zod schemas
│   │   ├── src/
│   │   │   ├── types.ts        # Shared TypeScript types
│   │   │   └── validation.ts   # Zod schemas (shared validation)
│   │   └── package.json
│   │
│   └── ui/                     # Shared React components (optional)
│       └── package.json
│
├── turbo.json
└── package.json
```

### Package Relationships

- **`apps/api`** → imports `@cookbooks/db` for queries, `@cookbooks/shared` for validation
- **`apps/web`** → imports router type from `apps/api`, imports `@cookbooks/shared` for validation
- **`packages/db`** → exports schema, types, and query functions (queries take D1 instance as param)
- **`packages/shared`** → exports Zod schemas and TypeScript types used by both apps

---

## Key Features (MVP)

### Phase 1: Foundation
- [ ] Project structure setup (apps/api, apps/web, packages/shared)
- [ ] D1 database schema with Drizzle
- [ ] Hono API skeleton with health check
- [ ] better-auth integration (email/password)
- [ ] Basic React app with auth flow

### Phase 2: Book Management
- [ ] Create/list/delete books API
- [ ] oRPC procedures with React Query hooks
- [ ] Book list and detail UI

### Phase 3: Index Processing
- [ ] R2 image upload endpoint
- [ ] Claude Vision OCR integration
- [ ] Recipe extraction and storage
- [ ] IndexImages tracking
- [ ] UI for uploading and reviewing extracted recipes

### Phase 4: Search
- [ ] D1 Full-Text Search setup
- [ ] Vectorize index creation
- [ ] Embedding generation on recipe create
- [ ] Hybrid search endpoint
- [ ] Search UI with results display

### Phase 5: Polish
- [ ] Edit/delete recipes manually
- [ ] Re-process index images
- [ ] Search filters (by book, category)
- [ ] Mobile-responsive design

---

## API Endpoints (oRPC Procedures)

### Auth (better-auth handles these)
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`
- `GET /api/auth/session`

### Books
- `books.list` - Get all books for current user
- `books.get` - Get single book with recipes
- `books.create` - Create new book
- `books.update` - Update book details
- `books.delete` - Delete book and associated data

### Recipes
- `recipes.list` - Get recipes for a book
- `recipes.update` - Edit a recipe
- `recipes.delete` - Delete a recipe

### Index Processing
- `indexImages.getUploadUrl` - Get presigned R2 upload URL
- `indexImages.process` - Trigger OCR processing for an image
- `indexImages.list` - List index images for a book

### Search
- `search.query` - Hybrid search across all user's recipes

---

## Search Implementation Details

### Full-Text Search (D1)
```sql
-- Create FTS virtual table
CREATE VIRTUAL TABLE recipes_fts USING fts5(
  name,
  content='recipes',
  content_rowid='rowid'
);

-- Query
SELECT r.* FROM recipes r
JOIN recipes_fts fts ON r.rowid = fts.rowid
WHERE recipes_fts MATCH 'kale salad'
AND r.book_id IN (SELECT id FROM books WHERE user_id = ?)
```

### Vector Search (Vectorize)
```typescript
// Generate embedding for query
const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: 'kale salad with crispy chickpeas'
});

// Search Vectorize
const results = await env.VECTORIZE.query(queryEmbedding.data[0], {
  topK: 20,
  filter: { user_id: userId }
});
```

### Hybrid Combination
1. Run both searches in parallel
2. Normalize scores (FTS uses BM25, Vectorize uses cosine similarity)
3. Combine with weighting (e.g., 0.4 FTS + 0.6 vector)
4. Deduplicate by recipe_id
5. Return top N results

---

## OCR Pipeline Details

### Claude Vision Prompt
```
Analyze this cookbook index page and extract all recipe entries.

For each recipe, provide:
- name: The recipe name exactly as written
- page_start: The starting page number
- page_end: The ending page number (if it spans pages, otherwise null)
- category: The section/category if visible (e.g., "Salads", "Mains")

Return as JSON array:
[
  {"name": "Tuscan Kale Caesar", "page_start": 123, "page_end": null, "category": "Salads"},
  {"name": "Crispy Chicken Thighs", "page_start": 145, "page_end": 147, "category": "Mains"}
]

Handle multi-column layouts. Include sub-recipes if listed.
```

---

## Environment Variables

### Worker (wrangler.toml)
```toml
[vars]
ANTHROPIC_API_KEY = "" # Set via wrangler secret

[[d1_databases]]
binding = "DB"
database_name = "cookbooks"
database_id = "<generated>"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "cookbook-images"

[[vectorize]]
binding = "VECTORIZE"
index_name = "recipe-embeddings"

[ai]
binding = "AI"
```

---

## Open Questions

1. **oRPC + React Native**: oRPC client should work in React Native since it's just HTTP/fetch under the hood. Test early when adding mobile support.

2. **better-auth + Workers**: better-auth has a Cloudflare Workers adapter. Need to verify D1 compatibility for session storage.

3. **FTS Sync**: D1 FTS tables need triggers to stay in sync with the main recipes table. Drizzle may need raw SQL for this.

4. **Rate Limiting**: Should we add rate limiting for OCR processing (Claude API costs)?

## Resolved Decisions

- **Why Hono?** Hono is the HTTP framework that mounts both oRPC (at `/api/rpc`) and better-auth (at `/api/auth`). oRPC can't serve HTTP alone, and better-auth requires HTTP routes.
- **Service Layer?** Skipping for now. oRPC procedures call directly into `@cookbooks/db` query functions. Extract services later if needed.
- **packages/api-client?** Not needed. Web app imports the router type directly from `apps/api` and creates its own oRPC client. Mobile would do the same.

---

## Success Metrics

- Time to find a recipe: < 5 seconds (vs. minutes of manual searching)
- OCR accuracy: > 95% of recipes correctly extracted
- Search relevance: Semantic matches surfaced in top 5 results
- Books onboarded: Target 10+ cookbooks in personal library

---

## Next Steps

1. Scaffold the monorepo structure (apps/api, apps/web, packages/shared)
2. Set up Cloudflare resources (D1, R2, Vectorize)
3. Implement auth with better-auth
4. Build book CRUD
5. Implement OCR pipeline
6. Add search functionality
