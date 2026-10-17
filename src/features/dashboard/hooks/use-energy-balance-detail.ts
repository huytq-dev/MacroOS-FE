'use client'

import { useDailyProgress, useExpenditureSeries } from './use-dashboard'
import type { BalanceMode } from '../dashboard.utils'
import {
  BALANCE_CHANGE_DAYS,
  BALANCE_WEEK_STARTS_ON,
  averageBalancePoints,
  differenceOverDays,
  summarizeBalance,
  toBalancePoints,
} from '../energy-balance.utils'
import {
  FETCH_DAYS,
  rangeLabel,
  windowOf,
  type Averaging,
  type RangeKey,
} from '../expenditure.utils'
import { useIsClient } from '@/hooks/use-is-client'
import { addDaysIso, todayIso } from '@/lib/date'

/**
 * Gom dữ liệu trang Energy Balance: một lần gọi `GET /expenditure/daily` (730 ngày: đã ăn, target, TDEE từng ngày),
 * lọc theo kỳ, gộp D/W/M và tính số lớn + các hàng "Relative to …" ở FE. TDEE hiện tại chỉ làm mốc khi ngày thiếu TDEE.
 */
export function useEnergyBalanceDetail(range: RangeKey, averaging: Averaging, mode: BalanceMode) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const daily = useDailyProgress(today ? addDaysIso(today, -FETCH_DAYS) : null, today)
  const tdee = useExpenditureSeries(today ? addDaysIso(today, -6) : null, today)

  if (!today) return { isLoading: true, today, summary: null, shown: [], changes: [] }

  const all = toBalancePoints(daily.data ?? [], mode, tdee.data?.current?.estimatedTdeeKcal ?? null)
  const win = windowOf(range, today, all[0]?.date ?? null, BALANCE_WEEK_STARTS_ON)
  const inWindow = all.filter((point) => point.date >= win.from && point.date <= win.to)

  return {
    isLoading: daily.isLoading,
    isError: daily.isError,
    today,
    win,
    shown: averageBalancePoints(inWindow, averaging),
    label: rangeLabel(win.from, win.to),
    summary: summarizeBalance(inWindow, mode),
    changes: BALANCE_CHANGE_DAYS.map((days) => ({ days, ...differenceOverDays(all, days, today) })),
  }
}
