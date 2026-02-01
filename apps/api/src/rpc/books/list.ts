import { books } from '@packages/db';
import { publicProcedure } from '../base';

export const listBooks = publicProcedure.handler(async ({ context }) => {
  const { db } = context;
  // TODO: Filter by userId when auth is implemented
  const result = await db.select().from(books).orderBy(books.createdAt);
  return result;
});
