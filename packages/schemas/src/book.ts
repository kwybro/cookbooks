import { z } from 'zod';

import { Timestamps } from './shared';

export const Book = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    title: z.string().min(1),
    author: z.string().nullable(),
  })
  .extend(Timestamps.shape);

export const CreateBook = z.object({
  title: z.string().min(1),
  author: z.string().nullable().optional(),
});

export const GetBook = z.object({
  id: z.uuid(),
});

export type BookType = z.infer<typeof Book>;
export type CreateBookInput = z.infer<typeof CreateBook>;