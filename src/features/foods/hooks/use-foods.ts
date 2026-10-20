'use client'

import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { foodService } from '../services/food.service'
import type { CustomFoodRequest, FoodDetail, FoodSearchParams } from '../types/food.types'
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
    // Giữ kết quả cũ khi chỉ đổi trang / số lượng (Load more) của CÙNG từ khoá cho khỏi nháy; đổi từ khoá thì bỏ để hiện skeleton
    // thay vì danh sách của từ khoá khác (gõ "apple" mà vẫn thấy "Abalone, Acerola…" của danh sách trước).
    placeholderData: (previousData, previousQuery) => {
      // queryKey của useFoodSearch luôn là ['foods', 'search', params] nên phần tử thứ ba chính là FoodSearchParams
      const previous = previousQuery?.queryKey[2] as FoodSearchParams | undefined
      return previous?.search === params.search && previous?.scope === params.scope
        ? keepPreviousData(previousData)
        : undefined
    },
    staleTime: 60 * 1000,
  })

export const useFoodDetail = (id: string | null) =>
  useQuery({
    queryKey: foodKeys.detail(id ?? ''),
    queryFn: () => foodService.get(id ?? ''),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  })

/** Chi tiết nhiều món một lượt (cùng khoá cache với `useFoodDetail`): trang Create Recipe cần khẩu phần + gramsPerMl của từng nguyên liệu. */
export const useFoodDetails = (ids: readonly string[]) =>
  useQueries({
    queries: ids.map((id) => ({
      queryKey: foodKeys.detail(id),
      queryFn: () => foodService.get(id),
      staleTime: 5 * 60 * 1000,
    })),
    combine: (results) => ({
      byId: Object.fromEntries(
        results.flatMap((result, index) => (result.data ? [[ids[index], result.data]] : []))
      ) as Record<string, FoodDetail>,
      isLoading: results.some((result) => result.isLoading),
    }),
  })

/**
 *Target/floor/ceiling hiệu lực của ngày `date` cho mọi chất (màn Food Detail). Không phụ thuộc số lượng nên gọi một lần theo
 * món + ngày; lượng từng chất do FE tính tại chỗ từ `nutrientsPer100g`.
 */
export const useFoodNutrients = (id: string | null, date: string | null) =>
  useQuery({
    queryKey: [...foodKeys.detail(id ?? ''), 'nutrients', date],
    queryFn: () => foodService.nutrients(id ?? '', date ?? ''),
    enabled: Boolean(id) && Boolean(date),
    staleTime: 5 * 60 * 1000,
    retry: false,
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

export const useCreateFood = (successMessage = 'Food created') =>
  useFoodMutation((payload: CustomFoodRequest) => foodService.create(payload), successMessage)
export const useUpdateFood = () =>
  useFoodMutation(
    ({ id, payload }: { id: string; payload: CustomFoodRequest }) =>
      foodService.update(id, payload),
    'Food saved'
  )
export const useDeleteFood = () =>
  useFoodMutation((id: string) => foodService.remove(id), 'Food deleted')

/** Tra mã vạch (DB trước, chưa có thì BE lấy từ Open Food Facts); lỗi hiện inline ở nơi gọi. */
export const useBarcodeLookup = () =>
  useMutation({
    mutationFn: (code: string) => foodService.byBarcode(code),
    onError: (error) => logger.error(error),
  })
