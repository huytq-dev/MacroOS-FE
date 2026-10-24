'use client'

import { useQuery } from '@tanstack/react-query'
import { pairStatus } from '../dashboard.utils'
import type { Averaging } from '../expenditure.utils'
import type { WeightTrendInsightsResponse, WeightTrendResponse } from '../types/weight-trend.types'
import {
  averageScaleDays,
  averageTrendDays,
  recentTrend,
  toHistory,
  type ScaleDay,
  type TrendDay,
} from '../weight-trend-series'
import { WEIGHT_CHANGE_DAYS, weightRates } from '../weight-trend.utils'
import { apiRoutes } from '@/config/api-routes'
import { useUnits } from '@/features/users/hooks/use-units'
import { useIsClient } from '@/hooks/use-is-client'
import { apiCall } from '@/lib/api'
import { todayIso } from '@/lib/date'

/**
 * Gom dữ liệu trang Weight Trend từ hai lần gọi của BE (theo múi giờ người dùng, tính khi đọc nên sửa / xoá cân tự cập nhật):
 * `GET /weights/trend?all=true` (TOÀN BỘ chuỗi từng ngày: trend mỗi ngày, scale ở ngày có cân) và `GET /weights/trend/insights`.
 * Trang tự trượt một khung ngày trên chuỗi này (kéo ngang, đổi kỳ) nên không gọi riêng từng kỳ; gộp D / W / M làm ở đây.
 */
export function useWeightTrendDetail(averaging: Averaging) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const { weight, weekStartDay } = useUnits()

  const series = useQuery({
    queryKey: ['weights', 'trend', 'history', today],
    queryFn: () =>
      apiCall.get<WeightTrendResponse>(apiRoutes.weights.trend, {
        params: { all: true, to: today, granularity: 'Day' },
      }),
    enabled: Boolean(today),
  })
  const insights = useQuery({
    queryKey: ['weights', 'trend', 'insights', today],
    queryFn: () => apiCall.get<WeightTrendInsightsResponse>(apiRoutes.weights.trendInsights),
    enabled: Boolean(today),
  })

  if (!today) return { ready: false as const, isLoading: true, isError: false }

  const days = series.data?.days ?? []
  const daily: TrendDay[] = days.map((day) => ({ date: day.date, trend: day.trendKg }))
  const weighIns: ScaleDay[] = days.flatMap((day) =>
    day.scaleKg === null ? [] : [{ date: day.date, value: day.scaleKg }]
  )
  const info = insights.data
  const rates = weightRates(info)

  const status = pairStatus(series, insights)
  return {
    ready: true as const,
    // Số hiện tại / thay đổi lấy từ insights: insights lỗi (còn giữ số cũ) cũng là lỗi, không hiện số đó như số cuối
    isLoading: status.isLoading,
    isError: status.isError,
    isFetching: status.isFetching,
    /** Thử lại cả chuỗi và insights (nút Retry của ErrorState). */
    refetch: () => {
      void series.refetch()
      void insights.refetch()
    },
    today,
    /** Xu hướng từng ngày (cũ → mới); số liệu Average / Difference tính trên chuỗi này. */
    daily,
    /** Dùng để vẽ: đã gộp D / W / M. */
    trend: averageTrendDays(daily, averaging, weekStartDay),
    scale: averageScaleDays(weighIns, averaging, weekStartDay),
    current: info?.currentWeightKg ?? null,
    weeklyRate: rates.weeklyChange,
    energyKcal: rates.energyKcal,
    projection: rates.projection,
    waiting: rates.waiting,
    changes: WEIGHT_CHANGE_DAYS.map((span) => {
      const found = info?.weightChanges.find((item) => item.days === span)
      return {
        days: span,
        delta: found?.changeKg ?? null,
        status: found?.status ?? 'Waiting',
        area: recentTrend(daily, span),
      }
    }),
    history: toHistory(days, weight),
  }
}
