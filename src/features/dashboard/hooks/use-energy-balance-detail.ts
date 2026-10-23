'use client'

import { useQuery } from '@tanstack/react-query'
import type { BalanceMode } from '../dashboard.utils'
import {
  BALANCE_CHANGE_DAYS,
  averageBalancePoints,
  fromSeriesDay,
  trendOf,
  trendOfStatus,
  type BalancePoint,
} from '../energy-balance.utils'
import type { Averaging } from '../expenditure.utils'
import type {
  EnergyBalanceInsightsResponse,
  EnergyBalanceSeriesResponse,
} from '../types/energy-balance.types'
import { apiRoutes } from '@/config/api-routes'
import { isHistoricalUnverified } from '@/features/nutrition/target-provenance'
import { useIsClient } from '@/hooks/use-is-client'
import { apiCall } from '@/lib/api'
import { todayIso } from '@/lib/date'

export interface BalanceHistoryDay {
  readonly date: string
  /** Đã ăn − mốc (kcal) của ngày đó. */
  readonly difference: number
  readonly trend: ReturnType<typeof trendOf>
}

/**
 * Gom dữ liệu trang Energy Balance từ hai lần gọi của BE (theo múi giờ người dùng; chuỗi liên tục từng ngày tới HÔM NAY, ngày trống
 * = null): `GET /energy-balance/series?all=true` (cột kcal đã ăn, đường mốc Expenditure / Target của từng ngày, chênh lệch từng
 * ngày) và `GET /energy-balance/insights` (các hàng "Relative to …" 3/7/14/30/90 ngày). Trang tự trượt một khung ngày trên chuỗi
 * này (kéo ngang, đổi kỳ) nên không gọi riêng từng kỳ; chuyển tab chỉ đổi mốc và cột chênh lệch, không gọi lại; gộp D / W / M làm ở đây.
 */
export function useEnergyBalanceDetail(averaging: Averaging, mode: BalanceMode) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null

  const series = useQuery({
    queryKey: ['energy-balance', 'series', 'history', today],
    queryFn: () =>
      apiCall.get<EnergyBalanceSeriesResponse>(apiRoutes.energyBalance.series, {
        params: { all: true, to: today },
      }),
    enabled: Boolean(today),
  })
  const insights = useQuery({
    queryKey: ['energy-balance', 'insights', today],
    queryFn: () => apiCall.get<EnergyBalanceInsightsResponse>(apiRoutes.energyBalance.insights),
    enabled: Boolean(today),
  })

  if (!today) return { ready: false as const, isLoading: true, isError: false }

  const days = series.data?.days ?? []
  const all: BalancePoint[] = days.map((day) => fromSeriesDay(day, mode, today))

  const history: BalanceHistoryDay[] = [...days].reverse().flatMap((day): BalanceHistoryDay[] => {
    // Ngày target LEGACY_UNVERIFIED không có chênh lệch (không đạt / không đạt) trong lịch sử tab Target
    const unverified =
      mode === 'targets' && isHistoricalUnverified(day.targetProvenance, day.date, today)
    const difference = unverified
      ? null
      : mode === 'targets'
        ? day.vsTargetKcal
        : day.vsExpenditureKcal
    return difference === null ? [] : [{ date: day.date, difference, trend: trendOf(difference) }]
  })

  const rows =
    mode === 'targets' ? insights.data?.relativeToTargets : insights.data?.relativeToExpenditure
  // Có target chưa xác minh trong chuỗi hoặc ở các hàng "Relative to Targets" (BE đã loại chúng khỏi thống kê): hiện "Historical target not verified"
  const targetUnverified =
    mode === 'targets' &&
    (days.some((day) => isHistoricalUnverified(day.targetProvenance, day.date, today)) ||
      (rows ?? []).some((row) => (row.unverifiedDays ?? 0) > 0) ||
      (series.data?.summary.unverifiedTargetDays ?? 0) > 0)
  const changes = BALANCE_CHANGE_DAYS.map((span) => {
    const found = rows?.find((row) => row.days === span)
    return {
      days: span,
      difference: found?.avgKcal ?? null,
      trend: found ? trendOfStatus(found.status) : null,
    }
  })

  return {
    ready: true as const,
    isLoading: series.isPending,
    isError: series.isError,
    today,
    /** Từng ngày (cũ → mới); số lớn đầu trang tính trên khung đang xem. */
    all,
    /** Dùng để vẽ: đã gộp D / W / M. */
    points: averageBalancePoints(all, averaging),
    changes,
    history,
    targetUnverified,
  }
}
