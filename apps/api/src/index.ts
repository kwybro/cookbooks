import { RPCHandler } from '@orpc/server/fetch';
import { books, createDb, type Database } from '@packages/db';
import { Hono } from 'hono';
import { appRouter, type RPCContext } from './rpc';

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

// oRPC handler
const rpcHandler = new RPCHandler(appRouter);

// Mount oRPC at /api/rpc/*
app.all('/api/rpc/*', async (c) => {
  const db = c.get('db');

  // Build the oRPC context from Hono context
  const context: RPCContext = {
    db,
    honoContext: c,
    // TODO: Add user from better-auth session
  };

  const result = await rpcHandler.handle(c.req.raw, {
    prefix: '/api/rpc',
    context,
  });

  if (result.matched) {
    return result.response;
  }

  return c.notFound();
});

export default app;
