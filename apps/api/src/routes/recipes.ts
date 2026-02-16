import { createDb, eq, recipes } from '@cookbooks/db';
import { Hono } from 'hono';

import type { Env } from '../types';

export const recipeRoutes = new Hono<{ Bindings: Env }>();

/** Update a recipe's name or page numbers */
recipeRoutes.patch('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const recipeId = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    pageStart?: number | null;
    pageEnd?: number | null;
  }>();

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId));
  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404);
  }

  const updates: Record<string, string | number | null> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.pageStart !== undefined) updates.pageStart = body.pageStart;
  if (body.pageEnd !== undefined) updates.pageEnd = body.pageEnd;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  await db.update(recipes).set(updates).where(eq(recipes.id, recipeId));
  const [updated] = await db.select().from(recipes).where(eq(recipes.id, recipeId));
  return c.json(updated);
});

/** Delete a single recipe */
recipeRoutes.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const recipeId = c.req.param('id');

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId));
  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404);
  }

  await db.delete(recipes).where(eq(recipes.id, recipeId));
  return c.json({ deleted: true });
});
