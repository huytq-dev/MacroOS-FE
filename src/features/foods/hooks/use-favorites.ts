'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { favoriteService } from '../services/favorite.service'
import { logger } from '@/lib/api'

export const favoriteKeys = { all: ['food-favorites'] as const }

/** Lazy: chỉ tải khi sheet Thêm món đang mở (`enabled`). */
export const useFavorites = (enabled: boolean) =>
  useQuery({
    queryKey: favoriteKeys.all,
    queryFn: () => favoriteService.list().then((items) => items ?? []),
    enabled,
    staleTime: 60 * 1000,
  })

const useFavoriteMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string,
  failureMessage: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
    },
    onError: (error) => {
      logger.error(error)
      toast.error(failureMessage)
    },
  })
}

export const useAddFavorite = () =>
  useFavoriteMutation(favoriteService.add, 'Saved to favorites', "Couldn't save favorite")

export const useRemoveFavorite = () =>
  useFavoriteMutation(favoriteService.remove, 'Removed from favorites', "Couldn't remove favorite")
