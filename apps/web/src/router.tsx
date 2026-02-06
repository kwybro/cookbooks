import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { orpc } from './utils/api';

export interface RouterContext {
  queryClient: QueryClient;
  orpc: typeof orpc;
}

export const createAppRouter = (queryClient: QueryClient) => {
  return createRouter({
    routeTree,
    context: {
      queryClient,
      orpc,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
