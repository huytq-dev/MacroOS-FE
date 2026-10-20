'use client'

import { useDailyProgress } from '@/features/dashboard/hooks/use-dashboard'
import { isLogged } from '@/features/dashboard/dashboard.utils'
import { useWeights } from '@/features/weight/hooks/use-weights'
import { yearRange, type HabitKind } from '../habits.utils'

/**
 * Các ngày đã thực hiện thói quen trong một năm (cộng 7 ngày hai đầu cho ô tháng kề) và giá trị của hôm nay: Weigh-In lấy từ
 * danh sách cân (kg), Food Logging từ tiến độ từng ngày (kcal, ngày có log món). `today` null (chưa mount) thì không tải.
 */
export function useHabitDays(kind: HabitKind, year: number, today: string | null) {
  const range = today ? yearRange(year, today) : null
  const weighIn = kind === 'weigh-in'
  const weights = useWeights(
    weighIn ? (range?.from ?? null) : null,
    weighIn ? (range?.to ?? null) : null
  )
  const daily = useDailyProgress(
    weighIn ? null : (range?.from ?? null),
    weighIn ? null : (range?.to ?? null)
  )

  const tracked = new Set<string>()
  let todayValue: number | null = null
  if (weighIn) {
    for (const entry of weights.data?.items ?? []) {
      tracked.add(entry.logDate)
      if (entry.logDate === today) todayValue = entry.weightKg
    }
  } else {
    for (const point of daily.data ?? []) {
      if (!isLogged(point)) continue
      tracked.add(point.snapshotDate)
      if (point.snapshotDate === today) todayValue = point.caloriesConsumed
    }
  }

  const query = weighIn ? weights : daily
  return {
    tracked,
    todayValue,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  }
}
