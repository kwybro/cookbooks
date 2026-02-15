import { z } from 'zod';

import { Timestamps } from './shared';

export const Recipe = z
  .object({
    id: z.uuid(),
    bookId: z.uuid(),
    name: z.string().min(1),
    pageStart: z.number().int().positive().nullable(),
    pageEnd: z.number().int().positive().nullable(),
  })
  .extend(Timestamps.shape);

export const CreateRecipe = z.object({
  bookId: z.uuid(),
  name: z.string().min(1),
  pageStart: z.number().int().positive().nullable().optional(),
  pageEnd: z.number().int().positive().nullable().optional(),
});

export const SearchQuery = z.object({
  q: z.string().min(1),
});

export type RecipeType = z.infer<typeof Recipe>;
export type CreateRecipeInput = z.infer<typeof CreateRecipe>;