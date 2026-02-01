import { books, eq } from '@packages/db';
import { publicProcedure } from '../base';
import { deleteBookSchema } from './schema';

export const deleteBook = publicProcedure
  .input(deleteBookSchema)
  .handler(async ({ context, input }) => {
    const { db } = context;
    const { id } = input;

    const existing = await db.select().from(books).where(eq(books.id, id)).get();

    if (!existing) {
      throw new Error('Book not found');
    }

    await db.delete(books).where(eq(books.id, id));

    return { success: true, id };
  });
