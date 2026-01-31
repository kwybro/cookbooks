import { drizzle } from 'drizzle-orm/d1';

import * as schema from './db/schema';

// Re-export all schema tables and types
export * from './db/schema';

// Export schema object for use with drizzle instance
export { schema };

// Create a typed Drizzle instance from a D1 binding
export const createDb = (d1: D1Database) => {
  return drizzle(d1, { schema });
};

// Type for the database instance
export type Database = ReturnType<typeof createDb>;
