import { books, createDb, eq, recipes } from '@cookbooks/db';
import { Hono } from 'hono';

import { extractCookbookData } from '../lib/extraction';
import type { Env } from '../types';

export const booksRoutes = new Hono<{ Bindings: Env }>();

// TODO: Replace hardcoded userId with auth context
const TEMP_USER_ID = 'dev-user';

/** List all books for the current user */
booksRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const result = await db.select().from(books).where(eq(books.userId, TEMP_USER_ID));
  return c.json(result);
});

/** Get a single book with its recipes */
booksRoutes.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const bookId = c.req.param('id');

  const [book] = await db.select().from(books).where(eq(books.id, bookId));
  if (!book) {
    return c.json({ error: 'Book not found' }, 404);
  }

  const bookRecipes = await db.select().from(recipes).where(eq(recipes.bookId, bookId));

  return c.json({ ...book, recipes: bookRecipes });
});

/** Scan a cookbook: accept cover + index images, extract data via Claude, store results */
booksRoutes.post('/scan', async (c) => {
  const body = await c.req.json<{
    images: Array<{
      base64: string;
      mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    }>;
  }>();

  if (!body.images || body.images.length < 2) {
    return c.json({ error: 'At least 2 images required (cover + 1 index page)' }, 400);
  }

  const result = await extractCookbookData(c.env.ANTHROPIC_API_KEY, body.images);

  const db = createDb(c.env.DB);

  const bookId = crypto.randomUUID();
  await db.insert(books).values({
    id: bookId,
    userId: TEMP_USER_ID,
    title: result.title,
    author: result.author,
  });

  if (result.recipes.length > 0) {
    // D1 limits to 100 bound parameters per query.
    // Each recipe row binds 6 values, so batch at 10 rows max.
    const BATCH_SIZE = 10;
    const rows = result.recipes.map((r) => ({
      id: crypto.randomUUID(),
      bookId,
      name: r.name,
      pageStart: r.pageStart,
      pageEnd: r.pageEnd,
    }));

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await db.insert(recipes).values(rows.slice(i, i + BATCH_SIZE));
    }
  }

  return c.json({
    bookId,
    title: result.title,
    author: result.author,
    recipesExtracted: result.recipes.length,
  }, 201);
});

/** Update a book's title or author */
booksRoutes.patch('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const bookId = c.req.param('id');
  const body = await c.req.json<{ title?: string; author?: string | null }>();

  const [book] = await db.select().from(books).where(eq(books.id, bookId));
  if (!book) {
    return c.json({ error: 'Book not found' }, 404);
  }

  const updates: Record<string, string | null> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.author !== undefined) updates.author = body.author;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  await db.update(books).set(updates).where(eq(books.id, bookId));
  const [updated] = await db.select().from(books).where(eq(books.id, bookId));
  return c.json(updated);
});

/** Delete a book and its recipes (cascade) */
booksRoutes.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const bookId = c.req.param('id');

  const [book] = await db.select().from(books).where(eq(books.id, bookId));
  if (!book) {
    return c.json({ error: 'Book not found' }, 404);
  }

  await db.delete(recipes).where(eq(recipes.bookId, bookId));
  await db.delete(books).where(eq(books.id, bookId));

  return c.json({ deleted: true });
});
