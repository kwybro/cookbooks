import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestamps } from './shared';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  ...timestamps,
});

export const books = sqliteTable('books', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  author: text('author'),
  ...timestamps,
});

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookId: text('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  pageStart: integer('page_start'),
  pageEnd: integer('page_end'),
  ...timestamps,
});
