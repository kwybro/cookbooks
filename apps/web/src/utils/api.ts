import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import type { AppRouter } from '../../../api/src/rpc/router';

// Use VITE_API_URL if set (should be full URL including /api/rpc)
// Otherwise use current origin with path (for local dev with vite proxy)
const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('Missing VITE_API_URL in web!');
}

const link = new RPCLink({
  url: apiUrl,
});

export const client: RouterClient<AppRouter> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
