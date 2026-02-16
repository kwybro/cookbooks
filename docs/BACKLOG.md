# Cookbooks — Feature Backlog

> This file is the source of truth for planned features and improvements. Each item includes enough context for an agent session to pick it up and implement it independently.

## Architecture Overview

- **Monorepo** (bun workspaces + turborepo)
- **API**: `apps/api` — Hono on Cloudflare Workers, D1 database via Drizzle ORM
- **Frontend**: `apps/web` — React 19, TanStack Router, TanStack Query, ShadCN/ui, TailwindCSS v4, PWA
- **Schemas**: `packages/schemas` — Shared Zod schemas (Book, Recipe, ScanResult)
- **Database**: `packages/db` — Drizzle schema + migrations for D1

## How to Use This File

1. Pick an item from **Ready to Build**
2. Read the description, affected files, and acceptance criteria
3. Follow the project's TDD workflow (write failing tests first, then implement)
4. Move the item to **Completed** with the PR/commit reference

---

## Ready to Build

### 1. Add Index Pages to Existing Book

**Priority:** High — directly requested, builds on existing scan flow

**Description:** Users should be able to scan additional index pages for a book that's already been scanned and append the newly extracted recipes. Currently, scanning always creates a new book.

**Approach:**
- Add a "Scan more pages" button to the book detail page (`apps/web/src/routes/books/$bookId.tsx`)
- Create a new API endpoint `POST /api/books/:id/scan-pages` that accepts index page images only (no cover), runs extraction with a modified prompt that only extracts recipes (title/author already known), and inserts the new recipes into the existing book
- Reuse the index page capture UI from the scan flow (`apps/web/src/routes/scan.tsx`, step 2)

**Affected files:**
- `apps/api/src/routes/books.ts` — new route
- `apps/api/src/lib/extraction.ts` — new function or parameterized prompt (index-only extraction)
- `apps/web/src/routes/books/$bookId.tsx` — "Scan more pages" button + flow
- `apps/web/src/lib/api.ts` — new `scanPages(bookId, images)` function

**Acceptance criteria:**
- [ ] User can add index pages from the book detail page
- [ ] New recipes are appended (existing recipes are not duplicated or removed)
- [ ] Loading/error states are handled in the UI

---

### 2. Recipe Ratings

**Priority:** Medium — user-requested, enhances library browsing

**Description:** Users should be able to rate recipes on a 1–5 star scale. Ratings should be visible on recipe rows and searchable/sortable.

**Approach:**
- Add a `rating` column to the `recipes` table (`INTEGER`, nullable, 1–5)
- Add a `rating` field to the Recipe schema in `packages/schemas/src/recipe.ts`
- Update `PATCH /api/recipes/:id` to accept `rating`
- Add star rating UI to `RecipeRow` component (clickable stars)
- Optionally: show average rating on `BookCard`, sort by rating on home page

**Affected files:**
- `packages/db/src/db/schema.ts` — add `rating` column
- `packages/db/drizzle/` — new migration
- `packages/schemas/src/recipe.ts` — add `rating` to Recipe and update type
- `apps/api/src/routes/recipes.ts` — accept `rating` in PATCH
- `apps/web/src/components/RecipeRow.tsx` — star rating UI
- `apps/web/src/hooks/use-recipes.ts` — update mutation types

**Acceptance criteria:**
- [ ] User can tap 1–5 stars on any recipe row
- [ ] Rating persists via API and shows on reload
- [ ] Unrated recipes show empty stars (not a default rating)

---

### 3. House Recipes (Custom/Original Recipes)

**Priority:** Medium — user-requested, new concept

**Description:** Users should be able to create and store their own recipes that aren't from a scanned book — things like "The House Margarita" or "Steel Cut Oats". These are standalone recipes not tied to any book.

**Approach:**
- Make `bookId` nullable on the `recipes` table, OR create a virtual "House Recipes" book per user that holds custom recipes
- **Recommended: virtual book approach** — simpler, no schema migration needed, house recipes appear as a special book in the library grid with a distinct icon
- On first custom recipe creation, auto-create a book with a sentinel title (e.g. `title: "House Recipes"`, `author: null`, with a special flag or known ID pattern)
- Add a "New Recipe" form (name, optional page notes/description) — could reuse the existing inline editing pattern
- Show the house recipes book with a different icon (e.g. `Home` from lucide) in `BookCard`

**Affected files:**
- `apps/api/src/routes/recipes.ts` — new `POST /api/recipes` for creating standalone recipes
- `apps/api/src/routes/books.ts` — logic to auto-create house book if needed
- `apps/web/src/routes/index.tsx` — show house recipes book with distinct styling
- `apps/web/src/components/BookCard.tsx` — special icon for house book
- `apps/web/src/routes/books/$bookId.tsx` — "Add recipe" button for house book
- `apps/web/src/lib/api.ts` — new `createRecipe()` function
- `apps/web/src/hooks/use-recipes.ts` — new `useCreateRecipe()` hook

**Acceptance criteria:**
- [ ] User can create a custom recipe from the home page or a dedicated "House Recipes" book
- [ ] House recipes appear in search results alongside scanned recipes
- [ ] House recipes book has a visually distinct card in the library grid
- [ ] CSV export includes house recipes

---

## Improvements

### Image Compression Before Upload

**Priority:** Low — performance optimization

**Description:** iPhone photos are 4–12MB each. Compressing/resizing before base64 encoding would reduce upload time and API latency significantly. Claude doesn't need full-resolution photos to read text.

**Approach:**
- Use `<canvas>` to resize images to ~1500px max dimension and compress to JPEG quality 0.8 before `readAsDataURL`
- Apply in `apps/web/src/routes/scan.tsx` inside `readFileAsBase64()`

---

### Duplicate Recipe Detection on Re-scan

**Priority:** Low — quality-of-life for "Add pages to existing book"

**Description:** When scanning additional index pages, some recipes may already exist (overlapping pages). Deduplicate by matching recipe name + page number before inserting.

---

### Offline Support

**Priority:** Low — PWA enhancement

**Description:** The app has a service worker (via vite-plugin-pwa) but doesn't cache API data for offline viewing. Add IndexedDB caching so users can browse their library and recipes offline.

---

## Completed

_None yet._
