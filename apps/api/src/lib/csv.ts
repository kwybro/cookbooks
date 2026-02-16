interface CsvRow {
  bookTitle: string;
  bookAuthor: string | null;
  recipeName: string;
  pageStart: number | null;
  pageEnd: number | null;
}

const escapeField = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const generateCsv = (rows: CsvRow[]): string => {
  const header = 'book_title,book_author,recipe_name,page_start,page_end';
  const lines = rows.map((row) =>
    [
      escapeField(row.bookTitle),
      escapeField(row.bookAuthor ?? ''),
      escapeField(row.recipeName),
      row.pageStart?.toString() ?? '',
      row.pageEnd?.toString() ?? '',
    ].join(','),
  );
  return [header, ...lines].join('\n');
};
