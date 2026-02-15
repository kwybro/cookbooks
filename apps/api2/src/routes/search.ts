import { and, books, createDb, eq, like, recipes } from '@cookbooks/db2';
import { Hono } from 'hono';

import type { Env } from '../types';

export const searchRoutes = new Hono<{ Bindings: Env }>();

// TODO: Replace hardcoded userId with auth context
const TEMP_USER_ID = 'dev-user';

/** Search recipes by name across all user's books */
searchRoutes.get('/', async (c) => {
  const query = c.req.query('q');
  if (!query || query.trim().length === 0) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  const db = createDb(c.env.DB);

  const results = await db
    .select({
      recipeId: recipes.id,
      recipeName: recipes.name,
      pageStart: recipes.pageStart,
      pageEnd: recipes.pageEnd,
      bookId: books.id,
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(recipes)
    .innerJoin(books, eq(recipes.bookId, books.id))
    .where(and(eq(books.userId, TEMP_USER_ID), like(recipes.name, `%${query}%`)));

  return c.json(results);
});
