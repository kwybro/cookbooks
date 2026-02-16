import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { searchRecipes } from '@/lib/api'

export const useSearch = (query: string) =>
  useQuery({
    queryKey: ['search', query],
    queryFn: () => searchRecipes(query),
    enabled: query.length > 0,
  })

export const useDebouncedValue = (value: string, delay = 300): string => {
  const [debounced, setDebounced] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    cancel()
    timerRef.current = setTimeout(() => setDebounced(value), delay)
    return cancel
  }, [value, delay, cancel])

  return debounced
}
