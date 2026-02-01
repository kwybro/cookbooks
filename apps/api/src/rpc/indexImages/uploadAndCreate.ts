import { indexImages } from '@packages/db';
import { z } from 'zod';
import { publicProcedure } from '../base';

const uploadAndCreateSchema = z.object({
  bookId: z.string().uuid(),
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|heic)$/i, 'Must be an image file'),
  // Base64 encoded image data
  imageData: z.string().min(1),
});

export const uploadAndCreate = publicProcedure
  .input(uploadAndCreateSchema)
  .handler(async ({ context, input }) => {
    const { db, honoContext } = context;
    const { bookId, filename, contentType, imageData } = input;

    // Generate R2 key
    const timestamp = Date.now();
    const r2Key = `index-images/${bookId}/${timestamp}-${filename}`;

    // Decode base64 and upload to R2
    const binaryData = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));

    await honoContext.env.IMAGES.put(r2Key, binaryData, {
      httpMetadata: { contentType },
    });

    // Create IndexImage record
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
