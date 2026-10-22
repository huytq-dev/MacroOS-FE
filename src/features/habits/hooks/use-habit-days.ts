'use client'

import { useDailyProgress } from '@/features/dashboard/hooks/use-dashboard'
import { isLogged } from '@/features/dashboard/dashboard.utils'
import { useWeighInHabit } from '@/features/weight/hooks/use-weights'
import { streakOf, yearRange, type HabitKind } from '../habits.utils'

/**
 * Các ngày đã thực hiện thói quen trong một năm, giá trị của hôm nay và streak. Weigh-In đọc `GET /weights/habit` (ngày có cân, kg, và
 * streak TOÀN THỜI GIAN của BE: không đứt ở đầu năm); Food Logging đọc tiến độ từng ngày (kcal, ngày có log món; BE chưa có endpoint
 * habit cho ghi món nên streak tính ở FE trên khoảng đã tải). `today` null (chưa mount) thì không tải.
 */
export function useHabitDays(kind: HabitKind, year: number, today: string | null) {
  const range = today ? yearRange(year, today) : null
  const weighIn = kind === 'weigh-in'
  const habit = useWeighInHabit(weighIn && today ? year : null)
  const daily = useDailyProgress(
    weighIn ? null : (range?.from ?? null),
    weighIn ? null : (range?.to ?? null)
  )

  const tracked = new Set<string>()
  let todayValue: number | null = null
  let streak = 0
  if (weighIn) {
    for (const day of habit.data?.days ?? []) {
      // Ngày chỉ có % mỡ (không có cân) không phải lần cân
      if (day.weightKg === null) continue
      tracked.add(day.date)
      if (day.date === today) todayValue = day.weightKg
    }
    streak = habit.data?.currentStreak ?? 0
  } else {
    for (const point of daily.data ?? []) {
      if (!isLogged(point)) continue
      tracked.add(point.snapshotDate)
      if (point.snapshotDate === today) todayValue = point.caloriesConsumed
    }
    streak = today ? streakOf(tracked, today) : 0
  }

  const query = weighIn ? habit : daily
  return {
    tracked,
    todayValue,
    streak,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  }
}
