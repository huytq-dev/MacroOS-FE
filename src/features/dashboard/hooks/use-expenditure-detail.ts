'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { averageExpDays, expHistory, recentExp, toExpDay } from '../expenditure-series'
import { CHANGE_DAYS, type Averaging, type RangeKey } from '../expenditure.utils'
import type {
  ExpenditureInsightsResponse,
  ExpenditureSeriesResponse,
} from '../types/expenditure-series.types'
import { trailingWindow } from '../weight-trend-series'
import { apiRoutes } from '@/config/api-routes'
import { useIsClient } from '@/hooks/use-is-client'
import { apiCall } from '@/lib/api'
import { addDaysIso, todayIso } from '@/lib/date'

/**
 * Gom dữ liệu trang Expenditure từ ba lần gọi của BE (đều theo múi giờ người dùng; chuỗi liên tục từng ngày tới HÔM NAY, BE đã
 * fill-forward): `GET /expenditure/series` của kỳ đang chọn (vùng Flux + đường + Average / Difference), cùng endpoint `all=true` cho lịch
 * sử từng ngày và vùng thu nhỏ, và `GET /expenditure/insights` (Expenditure Changes, giá trị hiện tại, Current Strategy). Gộp D / W / M
 * làm ở FE từ các ngày.
 */
export function useExpenditureDetail(range: RangeKey, averaging: Averaging) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const from = today && range !== 'All' ? trailingWindow(range, today, null).from : undefined

  const series = useQuery({
    queryKey: ['expenditure', 'series', range, today],
    queryFn: () =>
      apiCall.get<ExpenditureSeriesResponse>(apiRoutes.expenditure.series, {
        params: { from, to: today, all: range === 'All' ? true : undefined, granularity: 'Day' },
      }),
    enabled: Boolean(today),
    placeholderData: keepPreviousData,
  })
  const history = useQuery({
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

  const data = series.data
  const allDays = (history.data?.days ?? []).map(toExpDay)
  const inWindow = (data?.days ?? []).map(toExpDay)
  const win = {
    from: from ?? data?.days[0]?.date ?? addDaysIso(today, -29),
    to: today,
  }
  const info = insights.data

  return {
    ready: true as const,
    isLoading: series.isPending,
    isError: series.isError,
    today,
    win,
    days: averageExpDays(inWindow, averaging),
    average: data && data.summary.count > 0 ? data.summary.average : null,
    difference: data && data.summary.count > 0 ? data.summary.difference : null,
    current: info?.currentKcal ?? null,
    strategy: info?.strategy ?? null,
    holdingReason: info?.holdingReason ?? null,
    calibratingDaysLeft: info?.calibratingDaysLeft ?? null,
    changes: CHANGE_DAYS.map((days) => {
      const found = info?.changes.find((item) => item.days === days)
      return {
        days,
        delta: found?.changeKcal ?? null,
        status: found?.status ?? 'Waiting',
        area: recentExp(allDays, days),
      }
    }),
    history: expHistory(allDays),
  }
}
