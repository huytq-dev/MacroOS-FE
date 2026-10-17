'use client'

import {
  FETCH_DAYS,
  rangeLabel,
  windowOf,
  type Averaging,
  type RangeKey,
} from '../expenditure.utils'
import {
  averageWeightPoints,
  dailyEnergyKcal,
  groupWeightByMonth,
  projectWeight,
  summarizeWeight,
  toWeightPoints,
  WEIGHT_CHANGE_DAYS,
  weeklyRate,
  weightChangeOver,
} from '../weight-trend.utils'
import { useWeights } from '@/features/weight/hooks/use-weights'
import { useIsClient } from '@/hooks/use-is-client'
import { addDaysIso, todayIso } from '@/lib/date'

const PROJECTION_DAYS = 30

/**
 * Gom dữ liệu trang Weight Trend: một lần gọi `GET /weights` (730 ngày), lọc theo kỳ, gộp D/W/M và tính Average/Difference,
 * tốc độ tuần, năng lượng dư/thiếu, dự báo 30 ngày ở FE (BE đã trả sẵn xu hướng từng ngày).
 */
export function useWeightTrendDetail(range: RangeKey, averaging: Averaging) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const query = useWeights(today ? addDaysIso(today, -FETCH_DAYS) : null, today)

  const all = toWeightPoints(query.data?.items ?? [])
  if (!today) return { isLoading: true, today, all, shown: [], months: [] }

  const win = windowOf(range, today, all[0]?.date ?? null)
  const inWindow = all.filter((point) => point.date >= win.from && point.date <= win.to)
  const latest = all[all.length - 1]
  const rate = weeklyRate(all, today, query.data?.rateKgPerWeek ?? null)

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    today,
    all,
    win,
    shown: averageWeightPoints(inWindow, averaging),
    label: rangeLabel(win.from, win.to),
    ...summarizeWeight(inWindow),
    current: latest?.trend ?? null,
    weeklyRate: rate,
    energyKcal: dailyEnergyKcal(rate),
    projection: latest ? projectWeight(latest.trend, rate, PROJECTION_DAYS) : null,
    changes: WEIGHT_CHANGE_DAYS.map((days) => ({
      days,
      delta: weightChangeOver(all, days, today),
    })),
    months: groupWeightByMonth(all),
  }
}
