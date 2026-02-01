import { createBook } from './createBook';
import { deleteBook } from './deleteBook';
import { getBook } from './getBook';
import { listBooks } from './listBooks';
import { updateBook } from './updateBook';

export const booksRouter = {
  list: listBooks,
  get: getBook,
  create: createBook,
  update: updateBook,
  delete: deleteBook,
};
