import { base } from './base';
import { booksRouter } from './books';

// Main oRPC router combining all procedure routers
export const appRouter = base.router({
  books: booksRouter,
  // TODO: Add more routers as they're created:
  // recipes: recipesRouter,
  // indexImages: indexImagesRouter,
  // search: searchRouter,
});

// Export the router type for client-side type inference
export type AppRouter = typeof appRouter;
