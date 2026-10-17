'use client'

import { useExpenditureChanges, useExpenditureSeries } from './use-dashboard'
import {
  FETCH_DAYS,
  averagePoints,
  groupByMonth,
  rangeLabel,
  summarize,
  toChartPoints,
  windowOf,
  type Averaging,
  type RangeKey,
} from '../expenditure.utils'
import { useIsClient } from '@/hooks/use-is-client'
import { addDaysIso, todayIso } from '@/lib/date'

/**
 * Gom dữ liệu trang Expenditure: một lần gọi `GET /expenditure` (730 ngày), rồi lọc theo kỳ, gộp D/W/M và tính
 * Average/Difference ở FE. Phần BE chưa có (dải flux, biến thiên N ngày) nằm trong `expenditure.utils.ts`.
 */
export function useExpenditureDetail(range: RangeKey, averaging: Averaging) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const query = useExpenditureSeries(today ? addDaysIso(today, -FETCH_DAYS) : null, today)
  const changes = useExpenditureChanges()

  // React Compiler tự memo; useMemo thủ công bị rule preserve-manual-memoization chặn.
  const all = toChartPoints(query.data?.points ?? [])
  if (!today) return { isLoading: true, today, all, shown: [], months: [] }
  const win = windowOf(range, today, query.data?.expenditureStartDate ?? all[0]?.date ?? null)
  const inWindow = all.filter((point) => point.date >= win.from && point.date <= win.to)
  const shown = averagePoints(inWindow, averaging)
  return {
    isLoading: query.isLoading,
    isError: query.isError,
    today,
    all,
    win,
    shown,
    label: rangeLabel(win.from, win.to),
    ...summarize(inWindow),
    current: query.data?.current ?? null,
    holdingReason: query.data?.holdingReason ?? null,
    months: groupByMonth(all),
    changes: changes.data ?? null,
  }
}
