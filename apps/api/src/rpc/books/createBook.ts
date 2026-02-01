import { books } from '@packages/db';
import { publicProcedure } from '../base';
import { createBookSchema } from './schema';

export const createBook = publicProcedure
  .input(createBookSchema)
  .handler(async ({ context, input }) => {
    const { db } = context;
    const { title, author } = input;

    const id = crypto.randomUUID();
    const now = new Date();

    // TODO: Get userId from context.user when auth is implemented
    const userId = 'temp-user-id';

    const newBook = {
      id,
      userId,
      title,
      author: author ?? null,
      createdAt: now,
    };

    await db.insert(books).values(newBook);

    return newBook;
  });
