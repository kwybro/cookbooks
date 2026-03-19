import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const books = sqliteTable('books', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  bookId: text('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  pageStart: integer('page_start'),
  pageEnd: integer('page_end'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
