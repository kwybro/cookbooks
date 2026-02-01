import { books, eq } from '@packages/db';
import { publicProcedure } from '../base';
import { updateBookSchema } from './schema';

export const updateBook = publicProcedure
  .input(updateBookSchema)
  .handler(async ({ context, input }) => {
    const { db } = context;
    const { id, ...updates } = input;

    const existing = await db.select().from(books).where(eq(books.id, id)).get();

    if (!existing) {
      throw new Error('Book not found');
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof books.$inferInsert> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.author !== undefined) updateData.author = updates.author;

    if (Object.keys(updateData).length > 0) {
      await db.update(books).set(updateData).where(eq(books.id, id));
    }

    return { ...existing, ...updateData };
  });
