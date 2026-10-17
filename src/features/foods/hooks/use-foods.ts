'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { foodService } from '../services/food.service'
import type { CustomFoodRequest, FoodSearchParams } from '../types/food.types'
import { logger } from '@/lib/api'

export const foodKeys = {
  all: ['foods'] as const,
  search: (params: FoodSearchParams) => ['foods', 'search', params] as const,
  detail: (id: string) => ['foods', 'detail', id] as const,
}

/** `enabled` = chỉ tải khi dialog/trang đang mở (Lazy Loading). */
export const useFoodSearch = (params: FoodSearchParams, enabled = true) =>
  useQuery({
    queryKey: foodKeys.search(params),
    queryFn: () => foodService.search(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })

export const useFoodDetail = (id: string | null) =>
  useQuery({
    queryKey: foodKeys.detail(id ?? ''),
    queryFn: () => foodService.get(id ?? ''),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  })

const useFoodMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: foodKeys.all })
    },
    onError: (error) => {
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở dialog/trang (UI.md mục 10), không toast
    },
  })
}

export const useCreateFood = () =>
  useFoodMutation((payload: CustomFoodRequest) => foodService.create(payload), 'Food created')
export const useUpdateFood = () =>
  useFoodMutation(
    ({ id, payload }: { id: string; payload: CustomFoodRequest }) =>
      foodService.update(id, payload),
    'Food saved'
  )
export const useDeleteFood = () =>
  useFoodMutation((id: string) => foodService.remove(id), 'Food deleted')
