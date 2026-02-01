import { books, eq, recipes } from '@packages/db';
import { publicProcedure } from '../base';
import { getBookSchema } from './schema';

export const getBook = publicProcedure.input(getBookSchema).handler(async ({ context, input }) => {
  const { db } = context;
  const { id } = input;

  const book = await db.select().from(books).where(eq(books.id, id)).get();

  if (!book) {
    throw new Error('Book not found');
  }

  const bookRecipes = await db
    .select()
    .from(recipes)
    .where(eq(recipes.bookId, id))
    .orderBy(recipes.pageStart);

  return { ...book, recipes: bookRecipes };
});
