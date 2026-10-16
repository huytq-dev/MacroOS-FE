'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { favoriteService } from '../services/favorite.service'
import type { FavoriteFood } from '../types/favorite.types'
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
  useFavoriteMutation(favoriteService.add, 'Đã lưu vào yêu thích', 'Không lưu được yêu thích')

export const useRemoveFavorite = () =>
  useFavoriteMutation(favoriteService.remove, 'Đã bỏ khỏi yêu thích', 'Không bỏ được yêu thích')

/** Sắp xếp lại: cập nhật giao diện trước, lỗi thì tải lại và báo (UI.md mục 22). */
export const useReorderFavorites = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: favoriteService.reorder,
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all })
      queryClient.setQueryData<FavoriteFood[]>(favoriteKeys.all, (current) =>
        current ? [...current].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)) : current
      )
    },
    onError: (error) => {
      logger.error(error)
      toast.error('Không sắp xếp được yêu thích')
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
    },
  })
}
