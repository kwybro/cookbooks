import { createBook } from './create';
import { deleteBook } from './delete';
import { getBook } from './get';
import { listBooks } from './list';
import { updateBook } from './update';

export const booksRouter = {
  list: listBooks,
  get: getBook,
  create: createBook,
  update: updateBook,
  delete: deleteBook,
};
