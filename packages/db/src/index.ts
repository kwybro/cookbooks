import { drizzle } from 'drizzle-orm/d1';

import * as schema from './db/schema';

export { and, eq, like } from 'drizzle-orm';
export { books, recipes, users } from './db/schema';

export const createDb = (d1: D1Database) => {
  return drizzle(d1, { schema });
};

export type Database = ReturnType<typeof createDb>;
