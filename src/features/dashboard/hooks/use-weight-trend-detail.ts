'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Averaging, RangeKey } from '../expenditure.utils'
import type {
  WeightTrendGranularity,
  WeightTrendInsightsResponse,
  WeightTrendResponse,
} from '../types/weight-trend.types'
import {
  bucketsToSeries,
  daysToSeries,
  recentTrend,
  toHistory,
  trailingWindow,
} from '../weight-trend-series'
import { WEIGHT_CHANGE_DAYS } from '../weight-trend.utils'
import { apiRoutes } from '@/config/api-routes'
import { useIsClient } from '@/hooks/use-is-client'
import { apiCall } from '@/lib/api'
import { addDaysIso, todayIso } from '@/lib/date'

const GRANULARITY: Record<Averaging, WeightTrendGranularity> = {
  daily: 'Day',
  weekly: 'Week',
  monthly: 'Month',
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
/** "2026-10" → "October 2026" (không qua Intl để khỏi lệch locale giữa máy chủ và máy người dùng). */
export const monthTitle = (key: string) =>
  `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`

/**
 * Gom dữ liệu trang Weight Trend từ ba lần gọi của BE (đều theo múi giờ người dùng, tính khi đọc nên sửa / xoá cân tự cập nhật):
 * `GET /weights/trend` của kỳ đang chọn (kết thúc HÔM NAY; hai đường + Average / Difference theo trend), cùng endpoint `all=true` cho
 * lịch sử từng ngày và vùng thu nhỏ, và `GET /weights/trend/insights` (Weight Changes, cân hiện tại, tốc độ tuần, năng lượng, dự báo).
 */
export function useWeightTrendDetail(range: RangeKey, averaging: Averaging) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const granularity = GRANULARITY[averaging]
  const from = today && range !== 'All' ? trailingWindow(range, today, null).from : undefined

  const series = useQuery({
    queryKey: ['weights', 'trend', 'series', range, granularity, today],
    queryFn: () =>
      apiCall.get<WeightTrendResponse>(apiRoutes.weights.trend, {
        params: { from, to: today, all: range === 'All' ? true : undefined, granularity },
      }),
    enabled: Boolean(today),
    placeholderData: keepPreviousData,
  })
  const history = useQuery({
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

  const data = series.data
  const allDays = history.data?.days ?? []
  const win = {
    from: from ?? data?.days[0]?.date ?? addDaysIso(today, -29),
    to: today,
  }
  const drawn =
    granularity !== 'Day' && data?.buckets?.length
      ? bucketsToSeries(data.buckets)
      : daysToSeries(data?.days ?? [])
  const trendAll = allDays.map((day) => ({ date: day.date, trend: day.trendKg }))
  const info = insights.data

  return {
    ready: true as const,
    isLoading: series.isPending,
    isError: series.isError,
    today,
    win,
    trend: drawn.trend,
    scale: drawn.scale,
    average: data && data.summary.count > 0 ? data.summary.average : null,
    difference: data && data.summary.count > 0 ? data.summary.difference : null,
    current: info?.currentWeightKg ?? null,
    weeklyRate: info?.weeklyChangeKg ?? null,
    energyKcal: info?.energyDeficitKcalPerDay ?? null,
    projection: info?.projected30DaysKg ?? null,
    changes: WEIGHT_CHANGE_DAYS.map((days) => {
      const found = info?.weightChanges.find((item) => item.days === days)
      return {
        days,
        delta: found?.changeKg ?? null,
        status: found?.status ?? 'Waiting',
        area: recentTrend(trendAll, days),
      }
    }),
    history: toHistory(allDays),
  }
}
