import { books, createDb, eq, recipes } from '@cookbooks/db';
import { Hono } from 'hono';
import { generateCsv } from '../lib/csv';
import type { Env } from '../types';

export const exportRoutes = new Hono<{ Bindings: Env }>();

// TODO: Replace hardcoded userId with auth context
const TEMP_USER_ID = 'dev-user';

/** Export a single book's recipes as CSV */
exportRoutes.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const bookId = c.req.param('id');

  const [book] = await db.select().from(books).where(eq(books.id, bookId));
  if (!book) {
    return c.json({ error: 'Book not found' }, 404);
  }

  const bookRecipes = await db.select().from(recipes).where(eq(recipes.bookId, bookId));

  const csv = generateCsv(
    bookRecipes.map((r) => ({
      bookTitle: book.title,
      bookAuthor: book.author,
      recipeName: r.name,
      pageStart: r.pageStart,
      pageEnd: r.pageEnd,
    }))
  );

  const filename = `${book.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.csv`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});

/** Export all books and recipes as a single CSV */
exportRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);

  const allBooks = await db.select().from(books).where(eq(books.userId, TEMP_USER_ID));

  if (allBooks.length === 0) {
    return c.json({ error: 'No books found' }, 404);
  }

  const allRecipes = await db
    .select({
      recipeName: recipes.name,
      pageStart: recipes.pageStart,
      pageEnd: recipes.pageEnd,
      bookId: recipes.bookId,
    })
    .from(recipes)
    .innerJoin(books, eq(recipes.bookId, books.id))
    .where(eq(books.userId, TEMP_USER_ID));

  const bookMap = new Map(allBooks.map((b) => [b.id, b]));

  const csv = generateCsv(
    allRecipes.map((r) => {
      const book = bookMap.get(r.bookId);
      return {
        bookTitle: book?.title ?? 'Unknown',
        bookAuthor: book?.author ?? null,
        recipeName: r.recipeName,
        pageStart: r.pageStart,
        pageEnd: r.pageEnd,
      };
    })
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="cookbooks_library.csv"',
    },
  });
});
