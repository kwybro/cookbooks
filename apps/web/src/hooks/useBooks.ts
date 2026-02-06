import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orpc } from '../utils/api'

export function useBooks() {
  return useQuery(orpc.books.list.queryOptions())
}

export function useBook(id: string) {
  return useQuery({
    ...orpc.books.get.queryOptions({ input: { id } }),
    enabled: !!id,
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    ...orpc.books.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.books.list.key() })
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()

  return useMutation({
    ...orpc.books.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.books.list.key() })
    },
  })
}
