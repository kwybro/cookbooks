import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { createAnthropic } from '@ai-sdk/anthropic';
import { books, createDb, eq, indexImages, recipes } from '@packages/db';
import { generateText, Output } from 'ai';
import { z } from 'zod';

// Workflow parameters
export type ProcessIndexImageParams = {
  indexImageId: string;
  bookId: string;
  r2Key: string;
};

// Schema for recipes extracted from Claude Vision
const ExtractedRecipeSchema = z.object({
  name: z.string().describe('The recipe name exactly as written'),
  page_start: z.number().describe('The starting page number'),
  page_end: z
    .number()
    .nullable()
    .describe('The ending page number if it spans pages, otherwise null'),
  category: z
    .string()
    .nullable()
    .describe('The section/category if visible (e.g., "Salads", "Mains")'),
});

const ExtractedRecipesSchema = z.object({
  recipes: z
    .array(ExtractedRecipeSchema)
    .describe(
      'List of recipes extracted from the index page. Return empty array if no recipes found.'
    ),
});

// Environment bindings for the workflow
type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  ANTHROPIC_API_KEY: string;
};

export class ProcessIndexImageWorkflow extends WorkflowEntrypoint<Env, ProcessIndexImageParams> {
  async run(event: WorkflowEvent<ProcessIndexImageParams>, step: WorkflowStep) {
    const { indexImageId, bookId, r2Key } = event.payload;
    const db = createDb(this.env.DB);

    console.log('[Workflow] Starting ProcessIndexImage', { indexImageId, bookId, r2Key });

    // Helper to mark status as failed
    const markFailed = async (error: unknown) => {
      console.error('[Workflow] Failed:', error);
      await db
        .update(indexImages)
        .set({ status: 'failed', lastProcessedAt: new Date() })
        .where(eq(indexImages.id, indexImageId));
    };

    try {
      // Step 1: Fetch image from R2 and extract recipes with Claude Vision
      // Combined into one step to avoid serializing large base64 image data between steps
      const extractedRecipes = await step.do('fetch-and-extract', async () => {
        // Fetch image from R2
        console.log('[Workflow] Fetching image from R2:', r2Key);
        const object = await this.env.IMAGES.get(r2Key);
        if (!object) {
          throw new Error(`Image not found in R2: ${r2Key}`);
        }

        const arrayBuffer = await object.arrayBuffer();
        console.log('[Workflow] Image fetched, size:', arrayBuffer.byteLength, 'bytes');

        // Convert to base64 in chunks to avoid stack overflow with large images
        const uint8Array = new Uint8Array(arrayBuffer);
        const chunkSize = 8192;
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binaryString += String.fromCharCode(...chunk);
        }
        const base64 = btoa(binaryString);
        const contentType = object.httpMetadata?.contentType || 'image/jpeg';

        console.log('[Workflow] Image details:', {
          contentType,
          base64Length: base64.length,
          r2Key,
          bookId,
        });

        // Call Claude Vision API
        const anthropic = createAnthropic({
          apiKey: this.env.ANTHROPIC_API_KEY,
        });

        console.log('[Workflow] Calling Claude Vision API...');

        const { output } = await generateText({
          model: anthropic('claude-sonnet-4-20250514'),
          output: Output.object({ schema: ExtractedRecipesSchema }),
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  image: `data:${contentType};base64,${base64}`,
                },
                {
                  type: 'text',
                  text: `You are analyzing a cookbook index page. Extract ALL recipe entries you can see.

Instructions:
- Look for recipe names with their corresponding page numbers
- Handle multi-column layouts by reading each column
- Include sub-recipes or variations if they have separate page numbers
- If you can't read a recipe name clearly, make your best effort
- If this doesn't look like a traditional index (no clear recipe-to-page mappings), extract what recipe names you can see and use 0 for page numbers

Return the recipes as a JSON array. If you cannot identify any recipes, return an empty array.`,
                },
              ],
            },
          ],
          maxOutputTokens: 16384,
        });

        console.log('[Workflow] Claude response received:', {
          hasOutput: !!output,
          recipeCount: output?.recipes?.length ?? 0,
        });

        // Return a clean serializable copy for Workflow state persistence
        if (!output || !output.recipes) {
          console.log('[Workflow] No recipes extracted from image');
          return [];
        }

        const recipes = output.recipes.map((recipe) => ({
          name: recipe.name,
          page_start: recipe.page_start,
          page_end: recipe.page_end,
          category: recipe.category,
        }));

        return recipes;
      });

      // Step 2: Insert recipes into D1
      // D1 has a limit of 100 bound parameters per query
      // With 7 columns per recipe, we can insert ~14 recipes per batch
      const BATCH_SIZE = 14;

      const insertedRecipes = await step.do('insert-recipes', async () => {
        const now = new Date();
        const newRecipes = extractedRecipes.map((recipe) => ({
          id: crypto.randomUUID(),
          bookId,
          name: recipe.name,
          pageStart: recipe.page_start,
          pageEnd: recipe.page_end,
          category: recipe.category,
          createdAt: now,
        }));

        if (newRecipes.length > 0) {
          // Build batch queries to stay under D1's 100 parameter limit
          const batchCount = Math.ceil(newRecipes.length / BATCH_SIZE);
          const batchQueries = Array.from({ length: batchCount }, (_, i) => {
            const batch = newRecipes.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            return db.insert(recipes).values(batch);
          });
          // Execute all inserts in a single round-trip
          // Destructure to satisfy Drizzle's non-empty tuple requirement
          const [first, ...rest] = batchQueries;
          await db.batch([first, ...rest]);
        }

        return newRecipes;
      });

      // Step 3: Generate embeddings for each recipe using Workers AI
      const embeddings = await step.do('generate-embeddings', async () => {
        const recipeTexts = insertedRecipes.map((r) => {
          const parts = [r.name];
          if (r.category) parts.push(r.category);
          return parts.join(' - ');
        });

        if (recipeTexts.length === 0) {
          return [];
        }

        // Workers AI embedding model
        const result = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: recipeTexts,
        });

        // Type guard: check if this is the sync response with data
        if ('data' in result && result.data) {
          return result.data;
        }

        throw new Error('Unexpected async response from Workers AI');
      });

      // Step 4: Insert embeddings into Vectorize
      await step.do('insert-vectorize', async () => {
        if (embeddings.length === 0) {
          return { inserted: 0 };
        }

        // Get userId from the book (we need to query it)
        const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);

        const userId = book.userId;

        const vectors = insertedRecipes.map((recipe, index) => ({
          id: recipe.id,
          values: embeddings[index],
          metadata: {
            recipe_id: recipe.id,
            book_id: bookId,
            user_id: userId,
            name: recipe.name,
          },
        }));

        await this.env.VECTORIZE.insert(vectors);

        return { inserted: vectors.length };
      });

      // Step 5: Update IndexImage status to completed
      await step.do('update-status', async () => {
        await db
          .update(indexImages)
          .set({
            status: 'completed',
            lastProcessedAt: new Date(),
          })
          .where(eq(indexImages.id, indexImageId));

        return { success: true };
      });

      return {
        success: true,
        recipesExtracted: insertedRecipes.length,
        indexImageId,
      };
    } catch (error) {
      console.error('[Workflow] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        bookId,
        r2Key,
        indexImageId,
      });
      await markFailed(error);
      throw error;
    }
  }
}
