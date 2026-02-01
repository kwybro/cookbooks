import { eq, indexImages } from '@packages/db';
import { publicProcedure } from '../base';
import { processIndexImageSchema } from './schema';

export const processIndexImage = publicProcedure
  .input(processIndexImageSchema)
  .handler(async ({ context, input }) => {
    const { db, honoContext } = context;
    const { indexImageId } = input;

    // Get the index image record
    const [indexImage] = await db
      .select()
      .from(indexImages)
      .where(eq(indexImages.id, indexImageId))
      .limit(1);

    if (!indexImage) {
      throw new Error('Index image not found');
    }

    if (indexImage.status === 'processing') {
      throw new Error('Index image is already being processed');
    }

    // Update status to processing
    await db
      .update(indexImages)
      .set({ status: 'processing' })
      .where(eq(indexImages.id, indexImageId));

    // Trigger the workflow
    const workflow = honoContext.env.PROCESS_INDEX_WORKFLOW;

    const instance = await workflow.create({
      id: `process-${indexImageId}-${Date.now()}`,
      params: {
        indexImageId,
        bookId: indexImage.bookId,
        r2Key: indexImage.r2Key,
      },
    });

    return {
      success: true,
      workflowId: instance.id,
      indexImageId,
    };
  });