import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

import type { SearchResult } from '@/lib/api'

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  onClose: () => void
}

export function SearchResults({ results, isLoading, onClose }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-4 z-10">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Searching...</span>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-4 z-10">
        <p className="text-center text-muted-foreground">No recipes found</p>
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10 max-h-80 overflow-y-auto">
      {results.map((result) => (
        <Link
          key={result.recipeId}
          to="/books/$bookId"
          params={{ bookId: result.bookId }}
          onClick={onClose}
          className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
        >
          <div>
            <p className="font-medium">{result.recipeName}</p>
            <p className="text-sm text-muted-foreground">{result.bookTitle}</p>
          </div>
          {result.pageStart && (
            <span className="text-sm text-muted-foreground tabular-nums">
              p. {result.pageStart}
              {result.pageEnd ? `–${result.pageEnd}` : ''}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
