import { Search } from 'lucide-react'
import { useState } from 'react'

import { useDebouncedValue, useSearch } from '@/hooks/use-search'
import { Input } from '@/components/ui/input'
import { SearchResults } from '@/components/SearchResults'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const { data: results, isLoading } = useSearch(debouncedQuery)

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search recipes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-12 text-base"
        />
      </div>
      {debouncedQuery.length > 0 && (
        <SearchResults
          results={results ?? []}
          isLoading={isLoading}
          onClose={() => setQuery('')}
        />
      )}
    </div>
  )
}
