import { books, createDb, type Database } from '@packages/db';
import { Hono } from 'hono';

// Cloudflare Worker bindings from wrangler.jsonc
type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: Ai;
};

// Variables available in Hono context
type Variables = {
  db: Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware: Initialize database connection for each request
app.use('*', async (c, next) => {
  const db = createDb(c.env.DB);
  c.set('db', db);
  await next();
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.get('/', (c) => {
  return c.text('Cookbooks API');
});

// Test endpoint to verify DB connection (triggers local DB creation)
app.get('/db-test', async (c) => {
  const db = c.get('db');
  const result = await db.select().from(books).limit(1);
  return c.json({ success: true, count: result.length });
});

export default app;
