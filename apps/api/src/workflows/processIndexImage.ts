import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { books, createDb, eq, indexImages, recipes } from '@packages/db';

// Workflow parameters
export type ProcessIndexImageParams = {
  indexImageId: string;
  bookId: string;
  r2Key: string;
};

// Recipe extracted from Claude Vision
type ExtractedRecipe = {
  name: string;
  page_start: number;
  page_end: number | null;
  category: string | null;
};

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

    // Step 1: Fetch image from R2
    const imageData = await step.do('fetch-image', async () => {
      const object = await this.env.IMAGES.get(r2Key);
      if (!object) {
        throw new Error(`Image not found in R2: ${r2Key}`);
      }

      const arrayBuffer = await object.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const contentType = object.httpMetadata?.contentType || 'image/jpeg';

      return { base64, contentType };
    });

    // Step 2: Call Claude Vision API to extract recipes
    const extractedRecipes = await step.do('extract-recipes', async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: imageData.contentType,
                    data: imageData.base64,
                  },
                },
                {
                  type: 'text',
                  text: `Analyze this cookbook index page and extract all recipe entries.

For each recipe, provide:
- name: The recipe name exactly as written
- page_start: The starting page number
- page_end: The ending page number (if it spans pages, otherwise null)
- category: The section/category if visible (e.g., "Salads", "Mains")

Return ONLY a valid JSON array, no other text:
[
  {"name": "Recipe Name", "page_start": 123, "page_end": null, "category": "Category"},
  ...
]

Handle multi-column layouts. Include sub-recipes if listed.`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
      }

      const result = (await response.json()) as {
        content: Array<{ type: string; text?: string }>;
      };
      const textContent = result.content.find((c) => c.type === 'text');
      if (!textContent?.text) {
        throw new Error('No text response from Claude');
      }

      // Parse the JSON response
      const parsed = JSON.parse(textContent.text) as ExtractedRecipe[];
      return parsed;
    });

    // Step 3: Insert recipes into D1
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
        await db.insert(recipes).values(newRecipes);
      }

      return newRecipes;
    });

    // Step 4: Generate embeddings for each recipe using Workers AI
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

    // Step 5: Insert embeddings into Vectorize
    await step.do('insert-vectorize', async () => {
      if (embeddings.length === 0) {
        return { inserted: 0 };
      }

      // Get userId from the book (we need to query it)
      const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);

      const userId = book.userId;

      const vectors = insertedRecipes.map((recipe, index) => ({
        id: recipe.id,
        values: embeddings[index] as number[],
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

    // Step 6: Update IndexImage status to completed
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
  }
}
