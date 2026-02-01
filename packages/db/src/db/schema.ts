import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Books table - user_id references better-auth's user table
export const books = sqliteTable('books', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  author: text('author'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Recipes table
export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  bookId: text('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  pageStart: integer('page_start').notNull(),
  pageEnd: integer('page_end'),
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Processing status for index images
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// IndexImages table - stores references to R2 images of cookbook index pages
export const indexImages = sqliteTable('index_images', {
  id: text('id').primaryKey(),
  bookId: text('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  r2Key: text('r2_key').notNull(),
  status: text('status').$type<ProcessingStatus>().notNull().default('pending'),
  errorMessage: text('error_message'),
  lastProcessedAt: integer('last_processed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Relations
export const booksRelations = relations(books, ({ many }) => ({
  recipes: many(recipes),
  indexImages: many(indexImages),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  book: one(books, {
    fields: [recipes.bookId],
    references: [books.id],
  }),
}));

export const indexImagesRelations = relations(indexImages, ({ one }) => ({
  book: one(books, {
    fields: [indexImages.bookId],
    references: [books.id],
  }),
}));

// Type exports for use in queries
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type IndexImage = typeof indexImages.$inferSelect;
export type NewIndexImage = typeof indexImages.$inferInsert;
