import { publicProcedure } from '../base';
import { getUploadUrlSchema } from './schema';

export const getUploadUrl = publicProcedure
  .input(getUploadUrlSchema)
  .handler(async ({ context, input }) => {
    const { honoContext } = context;
    const { bookId, filename, contentType } = input;

    // Generate a unique R2 key for the image
    const timestamp = Date.now();
    const r2Key = `index-images/${bookId}/${timestamp}-${filename}`;

    // Get the R2 bucket from Hono context
    const bucket = honoContext.env.IMAGES;

    // Create a presigned URL for uploading
    // Note: R2 doesn't have native presigned URLs like S3, so we return the key
    // and the client will upload via our upload endpoint
    // For production, consider using R2's multipart upload or signed URLs via a Worker

    return {
      r2Key,
      uploadUrl: `/api/upload/${encodeURIComponent(r2Key)}`,
      contentType,
    };
  });
