import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteBook, fetchBook, fetchBooks, updateBook } from '@/lib/api'

export const useBooks = () =>
  useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
  })

export const useBook = (id: string) =>
  useQuery({
    queryKey: ['books', id],
    queryFn: () => fetchBook(id),
  })

export const useUpdateBook = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; author?: string | null } }) =>
      updateBook(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['books', id] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export const useDeleteBook = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}
