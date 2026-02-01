import { z } from 'zod';

// Input schemas
export const getUploadUrlSchema = z.object({
  bookId: z.uuid(),
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|heic)$/i, 'Must be an image file'),
});

export const createIndexImageSchema = z.object({
  bookId: z.uuid(),
  r2Key: z.string().min(1),
});

export const processIndexImageSchema = z.object({
  indexImageId: z.uuid(),
});

export const listIndexImagesSchema = z.object({
  bookId: z.uuid(),
});

export const getIndexImageSchema = z.object({
  id: z.uuid(),
});