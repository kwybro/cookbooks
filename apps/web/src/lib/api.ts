import type { BookType, RecipeType } from '@cookbooks/schemas'

// API response for a book with nested recipes
interface BookWithRecipes extends BookType {
  recipes: RecipeType[]
}

// Search result shape matches the API's joined query
interface SearchResult {
  recipeId: string
  recipeName: string
  pageStart: number | null
  pageEnd: number | null
  bookId: string
  bookTitle: string
  bookAuthor: string | null
}

// Scan response from POST /api/books/scan
interface ScanResponse {
  bookId: string
  title: string
  author: string | null
  recipesExtracted: number
}

interface ScanImage {
  base64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
}

const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const fetchBooks = (): Promise<BookType[]> => apiFetch('/books')

export const fetchBook = (id: string): Promise<BookWithRecipes> => apiFetch(`/books/${id}`)

export const scanBook = (images: ScanImage[]): Promise<ScanResponse> =>
  apiFetch('/books/scan', {
    method: 'POST',
    body: JSON.stringify({ images }),
  })

export const updateBook = (
  id: string,
  data: { title?: string; author?: string | null },
): Promise<BookType> =>
  apiFetch(`/books/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const deleteBook = (id: string): Promise<{ deleted: boolean }> =>
  apiFetch(`/books/${id}`, { method: 'DELETE' })

export const updateRecipe = (
  id: string,
  data: { name?: string; pageStart?: number | null; pageEnd?: number | null },
): Promise<RecipeType> =>
  apiFetch(`/recipes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const deleteRecipe = (id: string): Promise<{ deleted: boolean }> =>
  apiFetch(`/recipes/${id}`, { method: 'DELETE' })

export const searchRecipes = (query: string): Promise<SearchResult[]> =>
  apiFetch(`/search?q=${encodeURIComponent(query)}`)

export const getExportUrl = (bookId?: string): string =>
  bookId ? `/api/export/${bookId}` : '/api/export'

export type { BookWithRecipes, SearchResult, ScanResponse, ScanImage }
