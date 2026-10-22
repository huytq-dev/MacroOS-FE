'use client'

import { useQuery } from '@tanstack/react-query'
import {
  averageExpDays,
  expHistory,
  holdingReasonsOf,
  recentExp,
  toExpDay,
} from '../expenditure-series'
import { CHANGE_DAYS, type Averaging } from '../expenditure.utils'
import type {
  ExpenditureInsightsResponse,
  ExpenditureSeriesResponse,
} from '../types/expenditure-series.types'
import { apiRoutes } from '@/config/api-routes'
import { useUnits } from '@/features/users/hooks/use-units'
import { useIsClient } from '@/hooks/use-is-client'
import { apiCall } from '@/lib/api'
import { todayIso } from '@/lib/date'

/**
 * `GET /expenditure/insights` (số hiện tại, strategy, thay đổi): MỘT truy vấn dùng chung — trang Expenditure và ô Set TDEE của Program cùng
 * khoá nên cùng một số và cùng bộ nhớ đệm. `currentKcal` null = BE chưa có ước tính. `enabled` = false thì chưa gọi (nơi chỉ cần khi mở một bảng).
 */
export function useExpenditureInsights(enabled = true) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  return useQuery({
    queryKey: ['expenditure', 'insights', today],
    queryFn: () => apiCall.get<ExpenditureInsightsResponse>(apiRoutes.expenditure.insights),
    enabled: enabled && Boolean(today),
  })
}

/**
 * Gom dữ liệu trang Expenditure từ hai lần gọi của BE (theo múi giờ người dùng; chuỗi liên tục từng ngày tới HÔM NAY, BE đã
 * fill-forward): `GET /expenditure/series?all=true` (TOÀN BỘ chuỗi: vùng Flux, đường, trạng thái, thay đổi từng ngày) và
 * `GET /expenditure/insights` (Expenditure Changes, giá trị hiện tại, Current Strategy). Trang tự trượt một khung ngày trên chuỗi này
 * (kéo ngang, đổi kỳ) nên không gọi riêng từng kỳ; gộp D / W / M làm ở đây.
 */
export function useExpenditureDetail(averaging: Averaging) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const { weekStartDay } = useUnits()

  const series = useQuery({
    queryKey: ['expenditure', 'series', 'history', today],
    queryFn: () =>
      apiCall.get<ExpenditureSeriesResponse>(apiRoutes.expenditure.series, {
        params: { all: true, to: today, granularity: 'Day' },
      }),
    enabled: Boolean(today),
  })
  const insights = useExpenditureInsights()

  if (!today) return { ready: false as const, isLoading: true, isError: false }

  const daily = (series.data?.days ?? []).map(toExpDay)
  const info = insights.data

  return {
    ready: true as const,
    isLoading: series.isPending,
    isError: series.isError,
    today,
    /** Từng ngày (cũ → mới); Average / Difference tính trên chuỗi này. */
    daily,
    /** Dùng để vẽ: đã gộp D / W / M. */
    days: averageExpDays(daily, averaging, weekStartDay),
    current: info?.currentKcal ?? null,
    strategy: info?.strategy ?? null,
    holdingReasons: holdingReasonsOf(info ?? null),
    changes: CHANGE_DAYS.map((span) => {
      const found = info?.changes.find((item) => item.days === span)
      return {
        days: span,
        delta: found?.changeKcal ?? null,
        status: found?.status ?? 'Waiting',
        area: recentExp(daily, span),
      }
    }),
    history: expHistory(daily),
  }
}
