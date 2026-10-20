'use client'

import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { weightService } from '../services/weight.service'
import type { UpsertVisualBodyFatRequest, UpsertWeightRequest } from '../types/weight.types'
import { logger } from '@/lib/api'

export const weightKeys = {
  all: ['weights'] as const,
  range: (from: string, to: string) => ['weights', from, to] as const,
  history: (to: string) => ['weights', 'all', to] as const,
}

export const visualBodyFatKeys = {
  all: ['visual-body-fat'] as const,
  history: (to: string) => ['visual-body-fat', 'all', to] as const,
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
  invalidate: readonly QueryKey[]
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      for (const queryKey of invalidate) void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
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
    [weightKeys.all]
  )
export const useDeleteWeight = () =>
  useMetricMutation((logDate: string) => weightService.remove(logDate), 'Deleted', [weightKeys.all])

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
    VISUAL_INVALIDATE
  )
