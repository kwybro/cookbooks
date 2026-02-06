import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orpc } from '../utils/api'

export function useIndexImages(bookId: string) {
  return useQuery({
    ...orpc.indexImages.list.queryOptions({ input: { bookId } }),
    enabled: !!bookId,
  })
}

export function useIndexImage(id: string, options?: { refetchInterval?: number }) {
  return useQuery({
    ...orpc.indexImages.get.queryOptions({ input: { id } }),
    enabled: !!id,
    refetchInterval: options?.refetchInterval,
  })
}

export function useUploadIndexImage() {
  const queryClient = useQueryClient()

  return useMutation({
    ...orpc.indexImages.uploadAndCreate.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orpc.indexImages.list.key({ input: { bookId: variables.bookId } }),
      })
    },
  })
}

export function useProcessIndexImage() {
  const queryClient = useQueryClient()

  return useMutation({
    ...orpc.indexImages.process.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orpc.indexImages.get.key({ input: { id: variables.indexImageId } }),
      })
    },
  })
}
