import { RPCHandler } from '@orpc/server/fetch';
import { books, createDb, type Database } from '@packages/db';
import { Hono } from 'hono';
import { appRouter, type RPCContext } from './rpc';

// Re-export the workflow for Cloudflare to find it
export { ProcessIndexImageWorkflow } from './workflows/processIndexImage';

// Cloudflare Worker bindings from wrangler.jsonc
type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  PROCESS_INDEX_WORKFLOW: Workflow;
  ANTHROPIC_API_KEY: string;
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

// R2 Upload endpoint - receives image data and stores in R2
app.put('/api/upload/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const contentType = c.req.header('Content-Type') || 'application/octet-stream';

  // Validate content type is an image
  if (!contentType.startsWith('image/')) {
    return c.json({ error: 'Only image uploads are allowed' }, 400);
  }

  const body = await c.req.arrayBuffer();

  await c.env.IMAGES.put(key, body, {
    httpMetadata: {
      contentType,
    },
  });

  return c.json({ success: true, key });
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
