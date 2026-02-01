import { z } from 'zod';

// Input schemas
export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().nullable().optional(),
});

export const updateBookSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).optional(),
  author: z.string().nullable().optional(),
});

export const getBookSchema = z.object({
  id: z.uuid(),
});

export const deleteBookSchema = z.object({
  id: z.uuid(),
});
