import { z } from 'zod';

export const ExtractedRecipe = z.object({
  name: z.string(),
  pageStart: z.number().int().positive().nullable(),
  pageEnd: z.number().int().positive().nullable(),
});

export const ScanResult = z.object({
  title: z.string(),
  author: z.string().nullable(),
  recipes: z.array(ExtractedRecipe),
});

export type ExtractedRecipeType = z.infer<typeof ExtractedRecipe>;
export type ScanResultType = z.infer<typeof ScanResult>;