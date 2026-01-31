import { defineConfig } from 'drizzle-kit';

// Local config uses the SQLite file that wrangler dev creates
// Run `wrangler dev` in apps/api first to initialize the local D1
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: '../../apps/api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/4867c844f7c0d8a337adec4cb9a9c692f9e8fc559166ad6ccd7c9eef641f5c87.sqlite',
  },
});
