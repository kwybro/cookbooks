import { eq, indexImages } from '@packages/db';
import { publicProcedure } from '../base';
import { getIndexImageSchema } from './schema';

export const getIndexImage = publicProcedure
  .input(getIndexImageSchema)
  .handler(async ({ context, input }) => {
    const { db } = context;
    const { id } = input;

    const [indexImage] = await db
      .select()
      .from(indexImages)
      .where(eq(indexImages.id, id))
      .limit(1);

    if (!indexImage) {
      throw new Error('Index image not found');
    }

    return indexImage;
  });