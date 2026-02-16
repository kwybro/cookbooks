import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteRecipe, updateRecipe } from '@/lib/api'

export const useUpdateRecipe = (bookId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name?: string; pageStart?: number | null; pageEnd?: number | null }
    }) => updateRecipe(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', bookId] })
    },
  })
}

export const useDeleteRecipe = (bookId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', bookId] })
    },
  })
}
