import { base } from './base';
import { booksRouter } from './books';
import { indexImagesRouter } from './indexImages';
import { searchRouter } from './search';

// Main oRPC router combining all procedure routers
export const appRouter = base.router({
  books: booksRouter,
  indexImages: indexImagesRouter,
  search: searchRouter,
});

// Export the router type for client-side type inference
export type AppRouter = typeof appRouter;
