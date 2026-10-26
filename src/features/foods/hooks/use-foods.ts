'use client'

import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { keepsPreviousResults } from '../food-search.utils'
import { foodService } from '../services/food.service'
import type { CustomFoodRequest, FoodDetail, FoodSearchParams } from '../types/food.types'
import { favoriteKeys } from './use-favorites'
import { foodLogKeys } from '@/features/food-log/hooks/use-food-log'
import { logger } from '@/lib/api'
import { reportMutationError } from '@/lib/mutation-feedback'

export const foodKeys = {
  all: ['foods'] as const,
  search: (params: FoodSearchParams) => ['foods', 'search', params] as const,
  detail: (id: string) => ['foods', 'detail', id] as const,
}

/** `enabled` = chỉ tải khi dialog/trang đang mở (Lazy Loading). */
export const useFoodSearch = (params: FoodSearchParams, enabled = true) =>
  useQuery({
    queryKey: foodKeys.search(params),
    queryFn: ({ signal }) => foodService.searchUpTo(params, signal),
    enabled,
    // Giữ kết quả cũ (mờ đi, không nháy) khi chỉ đổi trang / số lượng của CÙNG từ khoá, hoặc khi gõ tiếp từ khoá có chữ sang từ khoá có chữ khác. Từ khoá rỗng (History) ↔ từ khoá
    // có chữ thì bỏ: skeleton thay vì danh sách History lạc vào kết quả tìm (xem `keepsPreviousResults`).
    placeholderData: (previousData, previousQuery) => {
      // queryKey của useFoodSearch luôn là ['foods', 'search', params] nên phần tử thứ ba chính là FoodSearchParams
      const previous = previousQuery?.queryKey[2] as FoodSearchParams | undefined
      return keepsPreviousResults(previous, params) ? keepPreviousData(previousData) : undefined
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

/**
 * Món tự tạo hiện ở tìm món, ở tab Library của Add Food (cùng recipe) và ở Favorites: tạo / sửa / xoá một món làm mới cả ba, không thì Library và
 * Favorites giữ món cũ (đã xoá, tên cũ) tới hết staleTime.
 */
export function invalidateFoodData(queryClient: QueryClient) {
  // Dinh dưỡng của đĩa / recipe đang soạn tính từ món hiện tại nên cũng tải lại khi món đổi
  for (const queryKey of [
    foodKeys.all,
    foodLogKeys.library,
    favoriteKeys.all,
    [...foodLogKeys.all, 'plate-nutrients'],
    [...foodLogKeys.all, 'recipe-nutrients'],
  ])
    void queryClient.invalidateQueries({ queryKey })
}

const useFoodMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string,
  /** Có = thao tác không có chỗ hiện lỗi inline (xoá): báo user bằng toast thay vì chỉ ghi log. */
  failureTitle?: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      invalidateFoodData(queryClient)
    },
    onError: (error) => {
      if (failureTitle) return reportMutationError(error, failureTitle)
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
  useFoodMutation((id: string) => foodService.remove(id), 'Food deleted', "Couldn't delete food")

/** Tra mã vạch (DB trước, chưa có thì BE lấy từ Open Food Facts); lỗi hiện inline ở nơi gọi. */
export const useBarcodeLookup = () =>
  useMutation({
    mutationFn: (code: string) => foodService.byBarcode(code),
    onError: (error) => logger.error(error),
  })
