import { z } from 'zod';

export const searchQuerySchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters'),
  topK: z.number().int().min(1).max(50).optional().default(20),
});
