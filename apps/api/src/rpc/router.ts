import { base } from './base';
import { booksRouter } from './books';
import { indexImagesRouter } from './indexImages';

// Main oRPC router combining all procedure routers
export const appRouter = base.router({
  books: booksRouter,
  indexImages: indexImagesRouter,
  // TODO: Add more routers as they're created:
  // recipes: recipesRouter,
  // search: searchRouter,
});

// Export the router type for client-side type inference
export type AppRouter = typeof appRouter;
