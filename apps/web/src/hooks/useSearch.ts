import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { orpc } from '../utils/api';

export function useSearch(query: string) {
  return useQuery({
    ...orpc.search.query.queryOptions({ input: { query } }),
    enabled: query.length >= 3,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
