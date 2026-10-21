'use client'

import { useQuery } from '@tanstack/react-query'
import { averageExpDays, expHistory, recentExp, toExpDay } from '../expenditure-series'
import { CHANGE_DAYS, type Averaging } from '../expenditure.utils'
import type {
  ExpenditureInsightsResponse,
  ExpenditureSeriesResponse,
} from '../types/expenditure-series.types'
import { apiRoutes } from '@/config/api-routes'
import { useIsClient } from '@/hooks/use-is-client'
import { apiCall } from '@/lib/api'
import { todayIso } from '@/lib/date'

/**
 * Gom dữ liệu trang Expenditure từ hai lần gọi của BE (theo múi giờ người dùng; chuỗi liên tục từng ngày tới HÔM NAY, BE đã
 * fill-forward): `GET /expenditure/series?all=true` (TOÀN BỘ chuỗi: vùng Flux, đường, trạng thái, thay đổi từng ngày) và
 * `GET /expenditure/insights` (Expenditure Changes, giá trị hiện tại, Current Strategy). Trang tự trượt một khung ngày trên chuỗi này
 * (kéo ngang, đổi kỳ) nên không gọi riêng từng kỳ; gộp D / W / M làm ở đây.
 */
export function useExpenditureDetail(averaging: Averaging) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null

  const series = useQuery({
    queryKey: ['expenditure', 'series', 'history', today],
    queryFn: () =>
      apiCall.get<ExpenditureSeriesResponse>(apiRoutes.expenditure.series, {
        params: { all: true, to: today, granularity: 'Day' },
      }),
    enabled: Boolean(today),
  })
  const insights = useQuery({
    queryKey: ['expenditure', 'insights', today],
    queryFn: () => apiCall.get<ExpenditureInsightsResponse>(apiRoutes.expenditure.insights),
    enabled: Boolean(today),
  })

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
    days: averageExpDays(daily, averaging),
    current: info?.currentKcal ?? null,
    strategy: info?.strategy ?? null,
    holdingReason: info?.holdingReason ?? null,
    calibratingDaysLeft: info?.calibratingDaysLeft ?? null,
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
