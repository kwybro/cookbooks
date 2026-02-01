import { desc, eq, indexImages } from '@packages/db';
import { publicProcedure } from '../base';
import { listIndexImagesSchema } from './schema';

export const listIndexImages = publicProcedure
  .input(listIndexImagesSchema)
  .handler(async ({ context, input }) => {
    const { db } = context;
    const { bookId } = input;

    const images = await db
      .select()
      .from(indexImages)
      .where(eq(indexImages.bookId, bookId))
      .orderBy(desc(indexImages.createdAt));

    return images;
  });