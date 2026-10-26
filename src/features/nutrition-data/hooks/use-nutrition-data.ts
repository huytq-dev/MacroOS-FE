'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { invalidateLogData } from '@/features/food-log/hooks/use-food-log'
import { logger } from '@/lib/api'
import { mergePages, ndmErrorMessage, planSave, type SaveOp } from '../nutrition-data.utils'
import { nutritionDataService } from '../services/nutrition-data.service'
import type { NutritionDay, SaveNutritionDayRequest } from '../types/nutrition-data.types'

const KEY = ['nutrition-data'] as const

/**
 * Các ngày có dữ liệu dinh dưỡng (mới nhất trước) cho Nutrition Data Manager, theo TRANG (`PAGE_SIZE` ngày; dữ liệu cũ hơn lấy bằng `fetchNextPage` với con trỏ
 * `nextBefore` của BE, không tải cả lịch sử). `invalidateQueries(KEY)` làm mới mọi trang đã tải. Gộp trang theo ngày để một ngày không bao giờ hiện hai lần.
 */
export const useNutritionDays = () =>
  useInfiniteQuery({
    queryKey: KEY,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => nutritionDataService.list(pageParam),
    getNextPageParam: (last) => (last?.hasMore ? (last.nextBefore ?? undefined) : undefined),
    select: (data) => mergePages(data.pages.map((page) => page?.items ?? [])),
  })

/**
 * Một ngày cụ thể, chỉ khi cần: chọn một ngày CŨ HƠN các trang đã tải (chọn ngày trong bảng) mà vẫn còn trang cũ hơn — không có dòng này thì một ngày đã có số nhập tay
 * trông như ngày trống và Save sẽ ghi đè nó mà user chưa từng thấy. Cùng họ khoá `KEY` nên mọi lần làm mới của NDM cũng làm mới dòng này.
 */
export const useNutritionDayLookup = (date: string, enabled: boolean) =>
  useQuery({
    queryKey: [...KEY, 'day', date],
    queryFn: () => nutritionDataService.day(date),
    enabled: enabled && date !== '',
    select: (data) => data?.items.find((day) => day.date === date),
  })

/**
 * Lưu / xoá một ngày ảnh hưởng log của ngày đó, nutrients, Nutrition Overview, expenditure và Energy Balance (`invalidateLogData`), cộng danh sách ngày
 * của trang này và xu hướng cân.
 */
const useInvalidate = () => {
  const queryClient = useQueryClient()
  return () => {
    invalidateLogData(queryClient)
    return Promise.all(
      [KEY, ['weights']].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
    )
  }
}

const runOp = (op: SaveOp) =>
  op.kind === 'save'
    ? nutritionDataService.save(op.payload)
    : op.kind === 'fasting'
      ? nutritionDataService.setFasting(op.date, op.isFasting)
      : nutritionDataService.setIncomplete(op.date, op.isIncomplete)

/**
 * Lưu một ngày: có số → một `PUT /nutrition-data`; chỉ đổi cờ → endpoint riêng của từng cờ (`planSave`). Thao tác chạy lần lượt và dừng ở lỗi đầu tiên: lỗi (kể cả
 * 409 `MANUAL_OVERRIDE_UNAVAILABLE` / `FASTING_NEEDS_EMPTY_DAY` / chồng ghi) KHÔNG bao giờ kèm toast thành công; thao tác đã chạy trước đó vẫn làm mới màn.
 */
export const useSaveNutritionDay = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({
      payload,
      existing,
    }: {
      payload: SaveNutritionDayRequest
      existing: NutritionDay | undefined
    }) => {
      for (const op of planSave(payload, existing)) await runOp(op)
    },
    onSuccess: () => {
      toast.success('Nutrition saved')
      void invalidate()
    },
    onError: (error) => {
      logger.error(error)
      void invalidate() // một thao tác trước lỗi có thể đã ghi: đọc lại sự thật
    },
  })
}

/** Delete Nutrition Data: tổng nhập tay + cờ nhịn ăn của ngày (giữ món, nước, ghi chú, cờ chưa đủ). */
export const useDeleteNutritionDay = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (date: string) => nutritionDataService.remove(date),
    onSuccess: () => {
      toast.success('Nutrition deleted')
      void invalidate()
    },
    onError: (error) => {
      logger.error(error)
      toast.error(ndmErrorMessage(error, () => "Couldn't delete this day"))
    },
  })
}

/**
 * Remove Manual Override: chỉ tổng nhập tay; ngày quay về các món đã log, rồi mọi màn liên quan tự đọc lại (`invalidateLogData`). Chưa có nút trên màn nào: nút
 * "Remove override" của ngày có override cần `hasOverride` của contract v2 (S29).
 */
export const useRemoveManualOverride = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (date: string) => nutritionDataService.removeOverride(date),
    onSuccess: () => {
      toast.success('Manual entry removed')
      void invalidate()
    },
    onError: (error) => {
      logger.error(error)
      toast.error(ndmErrorMessage(error, () => getFormErrorMessage(error)))
    },
  })
}
