import { os } from '@orpc/server';
import type { Database } from '@packages/db';
import type { Context as HonoContext } from 'hono';

// Bindings from wrangler.jsonc
type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  PROCESS_INDEX_WORKFLOW: Workflow;
  ANTHROPIC_API_KEY: string;
};

// Variables set in Hono middleware
type Variables = {
  db: Database;
};

// The Hono context type used in the API
export type AppHonoContext = HonoContext<{
  Bindings: Bindings;
  Variables: Variables;
}>;

// oRPC context available in all procedures
export type RPCContext = {
  db: Database;
  honoContext: AppHonoContext;
  // TODO: Add user session from better-auth when implemented
  // user: User | null;
};

// Create the base oRPC instance with context
export const base = os.$context<RPCContext>();

// Public procedure - no auth required
export const publicProcedure = base;

// TODO: Protected procedure - requires authenticated user
// export const protectedProcedure = base.use(async ({ context, next }) => {
//   if (!context.user) {
//     throw new Error('Unauthorized');
//   }
//   return next({ context: { ...context, user: context.user } });
// });
