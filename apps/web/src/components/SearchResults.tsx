import { Link } from '@tanstack/react-router';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface SearchResult {
  recipeId: string;
  recipeName: string;
  category: string | null;
  pageStart: number;
  pageEnd: number | null;
  bookId: string;
  bookTitle: string | null;
  bookAuthor: string | null;
  score: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No recipes found for &ldquo;{query}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground mb-4">
        {results.length} {results.length === 1 ? 'result' : 'results'} found
      </p>
      <div className="flex flex-col gap-3">
        {results.map((result) => (
          <Link
            key={result.recipeId}
            to="/books/$bookId"
            params={{ bookId: result.bookId }}
            className="block"
          >
            <Card className="hover:shadow-lg transition-shadow py-4">
              <CardHeader className="pb-0 pt-0">
                <CardTitle className="text-base">
                  {result.recipeName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{result.bookTitle ?? 'Unknown Book'}</span>
                  </div>
                  {result.category && (
                    <span>&middot; {result.category}</span>
                  )}
                  <span>
                    &middot; p. {result.pageStart}
                    {result.pageEnd && result.pageEnd !== result.pageStart
                      ? `–${result.pageEnd}`
                      : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
