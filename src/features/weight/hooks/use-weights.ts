'use client'

import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { weightService } from '../services/weight.service'
import type {
  UpsertMeasurementRequest,
  UpsertVisualBodyFatRequest,
  UpsertWeightRequest,
} from '../types/weight.types'
import { refreshDerivedStatus } from '@/features/derived-data/derived-data.utils'
import { logger } from '@/lib/api'
import { reportMutationError } from '@/lib/mutation-feedback'

export const weightKeys = {
  all: ['weights'] as const,
  range: (from: string, to: string) => ['weights', from, to] as const,
  history: (to: string) => ['weights', 'all', to] as const,
  recent: (to: string, limit: number) => ['weights', 'recent', to, limit] as const,
  habit: (year: number) => ['weights', 'habit', year] as const,
}

/**
 * Dữ liệu BE tính từ cân nặng (trend, và expenditure dựng lại từ ngày đó): ghi / xoá cân phải làm mới cả Goal Progress (`['goals']`: các tuần + %),
 * Expenditure, Energy Balance, check-in (đề xuất theo trend) và hàng % mỡ cân của Full Body, không chỉ danh sách cân (staleTime 5 phút).
 * MỘT danh sách cho mọi nơi ghi cân: ScaleWeightPage, ScaleWeightSheet, WeightShortcutPage.
 */
export const WEIGHT_INVALIDATE = [
  weightKeys.all,
  ['goals'],
  ['expenditure'],
  ['energy-balance'],
  ['check-in'],
  ['body-metrics'],
  // Mỗi buổi ảnh Progress Photos mang kèm cân thật / xu hướng của ngày đó (`GET /progress-photos/sessions`)
  ['progress-photos'],
] as const

export const visualBodyFatKeys = {
  all: ['visual-body-fat'] as const,
  history: (to: string) => ['visual-body-fat', 'all', to] as const,
}

export const measurementKeys = {
  all: ['measurements'] as const,
  history: (key: string, to: string) => ['measurements', key, to] as const,
}

export const useWeights = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: weightKeys.range(from ?? '', to ?? ''),
    queryFn: () => weightService.list(from ?? '', to ?? ''),
    enabled: Boolean(from && to),
  })

/** Toàn bộ lịch sử cân tới hôm nay (trang Scale Weight lọc kỳ ở FE); `today` null = chưa mount. */
export const useWeightHistory = (today: string | null) =>
  useQuery({
    queryKey: weightKeys.history(today ?? ''),
    queryFn: () => weightService.listAll(today ?? ''),
    enabled: Boolean(today),
  })

/** `limit` lần cân gần nhất toàn lịch sử cho thẻ Scale Weight; cùng nhóm khoá `weightKeys.all` nên ghi / sửa / xoá cân làm mới nó. */
export const useRecentWeights = (today: string | null, limit: number) =>
  useQuery({
    queryKey: weightKeys.recent(today ?? '', limit),
    queryFn: () => weightService.listRecent(today ?? '', limit),
    enabled: Boolean(today),
  })

/** Habits Weigh-In của một năm (ngày có cân + streak toàn thời gian); `year` null = chưa cần. Cùng nhóm khoá `weightKeys.all` nên ghi / xoá cân làm mới nó. */
export const useWeighInHabit = (year: number | null) =>
  useQuery({
    queryKey: weightKeys.habit(year ?? 0),
    queryFn: () => weightService.habit(year ?? 0),
    enabled: year !== null,
  })

/** Toàn bộ lịch sử Visual Body Fat tới hôm nay. */
export const useVisualBodyFat = (today: string | null) =>
  useQuery({
    queryKey: visualBodyFatKeys.history(today ?? ''),
    queryFn: () => weightService.listVisualBodyFat(today ?? ''),
    enabled: Boolean(today),
  })

const useMetricMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string,
  invalidate: readonly QueryKey[],
  /** Có = thao tác không có chỗ hiện lỗi inline (xoá): báo user bằng toast thay vì chỉ ghi log. */
  failureTitle?: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      for (const queryKey of invalidate) void queryClient.invalidateQueries({ queryKey })
      // Ghi / xoá cân làm BE dựng lại expenditure từ ngày đó: đọc trạng thái dựng lại một lần
      if (invalidate.some((queryKey) => queryKey[0] === 'expenditure'))
        refreshDerivedStatus(queryClient)
    },
    onError: (error) => {
      if (failureTitle) return reportMutationError(error, failureTitle)
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở dialog/trang (UI.md mục 10), không toast
    },
  })
}

// Sheet Metrics (full-body) đọc cùng hàng Visual nên làm mới cả nó
const VISUAL_INVALIDATE = [visualBodyFatKeys.all, ['body-metrics']] as const

export const useUpsertWeight = () =>
  useMetricMutation(
    (payload: UpsertWeightRequest) => weightService.upsert(payload),
    'Weight logged',
    WEIGHT_INVALIDATE
  )
export const useDeleteWeight = () =>
  useMetricMutation(
    (logDate: string) => weightService.remove(logDate),
    'Deleted',
    WEIGHT_INVALIDATE,
    "Couldn't delete weight"
  )

export const useUpsertVisualBodyFat = () =>
  useMetricMutation(
    (payload: UpsertVisualBodyFatRequest) => weightService.upsertVisualBodyFat(payload),
    'Body fat logged',
    VISUAL_INVALIDATE
  )
export const useDeleteVisualBodyFat = () =>
  useMetricMutation(
    (date: string) => weightService.removeVisualBodyFat(date),
    'Deleted',
    VISUAL_INVALIDATE,
    "Couldn't delete body fat"
  )

/** Toàn bộ lịch sử một số đo vòng (cm) tới hôm nay. */
export const useMeasurement = (key: string, today: string | null) =>
  useQuery({
    queryKey: measurementKeys.history(key, today ?? ''),
    queryFn: () => weightService.listMeasurement(key, today ?? ''),
    enabled: Boolean(today),
  })

// Full Body (sheet + trang) đọc cùng hàng Tape
const MEASUREMENT_INVALIDATE = [measurementKeys.all, ['body-metrics']] as const

export const useUpsertMeasurement = (key: string) =>
  useMetricMutation(
    (payload: UpsertMeasurementRequest) => weightService.upsertMeasurement(key, payload),
    'Measurement logged',
    MEASUREMENT_INVALIDATE
  )
export const useDeleteMeasurement = (key: string) =>
  useMetricMutation(
    (date: string) => weightService.removeMeasurement(key, date),
    'Deleted',
    MEASUREMENT_INVALIDATE,
    "Couldn't delete measurement"
  )
