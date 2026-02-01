import { indexImages } from '@packages/db';
import { publicProcedure } from '../base';
import { createIndexImageSchema } from './schema';

export const createIndexImage = publicProcedure
  .input(createIndexImageSchema)
  .handler(async ({ context, input }) => {
    const { db } = context;
    const { bookId, r2Key } = input;

    const id = crypto.randomUUID();
    const now = new Date();

    const newIndexImage = {
      id,
      bookId,
      r2Key,
      status: 'pending' as const,
      createdAt: now,
    };

    await db.insert(indexImages).values(newIndexImage);

    return newIndexImage;
  });
