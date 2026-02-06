import { books, inArray, recipes } from '@packages/db';
import { publicProcedure } from '../base';
import { searchQuerySchema } from './schema';

const MIN_SCORE = 0.5;

export const searchQuery = publicProcedure
  .input(searchQuerySchema)
  .handler(async ({ context, input }) => {
    const { db, honoContext } = context;
    const { query, topK } = input;

    // Generate embedding for the search query using the same model as index time
    const embeddingResult = await honoContext.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [query],
    });

    if (!('data' in embeddingResult) || !embeddingResult.data?.[0]) {
      throw new Error('Failed to generate embedding for query');
    }

    const queryVector = embeddingResult.data[0];

    // Query Vectorize for semantically similar recipes
    const vectorResults = await honoContext.env.VECTORIZE.query(queryVector, {
      topK,
      returnMetadata: 'all',
    });

    // Filter by minimum score to exclude noise
    const relevantMatches = vectorResults.matches.filter(
      (match) => match.score >= MIN_SCORE
    );

    if (relevantMatches.length === 0) {
      return [];
    }

    // Extract recipe IDs from vector results
    const recipeIds = relevantMatches.map((match) => match.id);

    // Batch-fetch recipe data from D1
    const recipeRows = await db
      .select({
        recipeId: recipes.id,
        recipeName: recipes.name,
        category: recipes.category,
        pageStart: recipes.pageStart,
        pageEnd: recipes.pageEnd,
        bookId: recipes.bookId,
      })
      .from(recipes)
      .where(inArray(recipes.id, recipeIds));

    // Batch-fetch book data for all relevant books
    const bookIds = [...new Set(recipeRows.map((r) => r.bookId))];
    const bookRows = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
      })
      .from(books)
      .where(inArray(books.id, bookIds));

    const bookMap = new Map(bookRows.map((b) => [b.id, b]));
    const recipeMap = new Map(recipeRows.map((r) => [r.recipeId, r]));

    // Build enriched results, preserving Vectorize ranking order
    const results = relevantMatches
      .map((match) => {
        const recipe = recipeMap.get(match.id);
        if (!recipe) return null;

        const book = bookMap.get(recipe.bookId);

        return {
          recipeId: recipe.recipeId,
          recipeName: recipe.recipeName,
          category: recipe.category,
          pageStart: recipe.pageStart,
          pageEnd: recipe.pageEnd,
          bookId: recipe.bookId,
          bookTitle: book?.title ?? null,
          bookAuthor: book?.author ?? null,
          score: match.score,
        };
      })
      .filter((r) => r !== null);

    return results;
  });
