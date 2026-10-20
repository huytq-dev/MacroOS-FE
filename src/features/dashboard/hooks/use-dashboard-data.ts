'use client'

import { useDailyProgress, useExpenditureSeries } from './use-dashboard'
import {
  goalProgressPercent,
  habitCells,
  isLogged,
  lastDays,
  weekCount,
  HABIT_DAYS,
  WEEK_DAYS,
} from '../dashboard.utils'
import type { DailyProgress, NutrientValue } from '../types/dashboard.types'
import { useDayLog } from '@/features/food-log/hooks/use-food-log'
import type { MacroTotals } from '@/features/food-log/types/food-log.types'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { useWeights } from '@/features/weight/hooks/use-weights'
import { addDaysIso } from '@/lib/date'

const WEIGHT_LOOKBACK_DAYS = 365
const SPARK_POINTS = 8
const MS_PER_DAY = 86_400_000

/**
 * Nguồn dữ liệu CHƯA có API (vi chất, bước chân, kỳ kinh, mỡ cơ thể): giữ ở một chỗ này để sau thay bằng
 * API thật mà không đụng component. Mỗi trường ghi rõ BE sẽ cấp từ đâu.
 */
const MOCK = {
  /** BE: nhật ký chỉ số cơ thể (body fat). Giá trị mẫu theo ảnh MacroFactor. */
  bodyFatPercent: [26] as readonly number[],
  /** BE/Apple Health: số bước 7 ngày; null = chưa kết nối (hiện "---"). */
  steps: null as number | null,
  /** BE: ngày bắt đầu kỳ kinh gần nhất; null = chưa có (hiện "--- ngày trước"). */
  periodDaysAgo: null as number | null,
  /** BE (MOS-010): vi chất hôm nay theo key trong nutrient-catalog; thiếu key = 0. */
  micronutrientsToday: {} as Readonly<Record<string, NutrientValue>>,
}

export interface DashboardData {
  readonly isLoading: boolean
  /** Truy vấn cân nặng thô, để màn thiết lập ban đầu biết đã có cân nặng chưa. */
  readonly weights: ReturnType<typeof useWeights>
  readonly tdee: number | null
  readonly tdeeSpark: readonly number[]
  readonly weightLatest: number | null
  readonly weightSpark: readonly number[]
  /** Cân thô cùng thứ tự với `weightSpark` (chấm mờ quanh đường trend). */
  readonly weightRaw: readonly number[]
  /** 30 ngày tiến độ từng ngày (cũ → mới), dùng cho Energy Balance. */
  readonly daily: readonly DailyProgress[]
  readonly weighIn: { readonly cells: readonly boolean[]; readonly week: number }
  readonly logging: { readonly cells: readonly boolean[]; readonly week: number }
  readonly scale: { readonly spark: readonly number[]; readonly latest: number | null }
  readonly bodyFat: { readonly spark: readonly number[]; readonly latest: number | null }
  readonly steps: number | null
  readonly period: { readonly cells: readonly boolean[]; readonly daysAgo: number | null }
  readonly goalPercent: number | null
  /** Số ngày từ lần cân đầu tới hôm nay (nhãn kỳ của Goal Progress); null = chưa có cân nặng. */
  readonly goalDays: number | null
  /** Tổng và target của hôm nay (vòng kcal "Dinh dưỡng hôm nay"); null khi chưa tải xong. */
  readonly todayTotals: MacroTotals | null
  readonly todayTarget: ProgramWeek | null
  /** Giá trị hôm nay cho mọi ô nutrient (macro + chất xơ từ log thật, còn lại mock). */
  readonly nutrientsToday: Readonly<Record<string, NutrientValue>>
}

/** Gom toàn bộ số liệu của Dashboard và các trang con; component chỉ nhận kết quả đã tính. */
export function useDashboardData(
  today: string | null,
  enabled: boolean,
  targetWeightKg: number | null | undefined
): DashboardData {
  const weights = useWeights(today ? addDaysIso(today, -WEIGHT_LOOKBACK_DAYS) : null, today)
  const expenditure = useExpenditureSeries(
    enabled && today ? addDaysIso(today, -(WEEK_DAYS * 2 - 1)) : null,
    today
  )
  const dailyQuery = useDailyProgress(
    enabled && today ? addDaysIso(today, -(HABIT_DAYS - 1)) : null,
    today
  )
  const dayLog = useDayLog(enabled ? today : null)

  const entries = weights.data?.items ?? []
  const scaleSpark = entries.slice(-WEEK_DAYS).map((entry) => entry.weightKg)
  const weightLatest = weights.data?.latestTrendKg ?? weights.data?.latestWeightKg ?? null
  const daily = dailyQuery.data ?? []
  const todayKey = today ?? ''

  const weighInDates = new Set(entries.map((entry) => entry.logDate))
  const loggedDates = new Set(daily.filter(isLogged).map((point) => point.snapshotDate))
  const firstWeight = entries[0]?.weightKg ?? null

  const totals = dayLog.data?.totals
  const target = dayLog.data?.target
  const nutrientsToday: Record<string, NutrientValue> = {
    ...MOCK.micronutrientsToday,
    calories: { value: totals?.calories ?? 0, target: target?.caloriesTarget ?? null },
    protein: { value: totals?.protein ?? 0, target: target?.proteinTarget ?? null },
    fat: { value: totals?.fat ?? 0, target: target?.fatTarget ?? null },
    carbs: { value: totals?.carbs ?? 0, target: target?.carbsTarget ?? null },
    fiber: { value: totals?.fiber ?? 0, target: null },
  }

  return {
    isLoading: weights.isLoading || (enabled && (expenditure.isLoading || dailyQuery.isLoading)),
    weights,
    tdee: expenditure.data?.current?.estimatedTdeeKcal ?? null,
    tdeeSpark: (expenditure.data?.points ?? [])
      .slice(-SPARK_POINTS)
      .map((point) => point.estimatedTdeeKcal),
    weightLatest,
    weightSpark: entries.slice(-SPARK_POINTS).map((entry) => entry.trendWeightKg ?? entry.weightKg),
    weightRaw: entries.slice(-SPARK_POINTS).map((entry) => entry.weightKg),
    daily,
    weighIn: { cells: habitCells(weighInDates, todayKey), week: weekCount(weighInDates, todayKey) },
    logging: { cells: habitCells(loggedDates, todayKey), week: weekCount(loggedDates, todayKey) },
    scale: { spark: scaleSpark, latest: weights.data?.latestWeightKg ?? null },
    bodyFat: { spark: MOCK.bodyFatPercent, latest: MOCK.bodyFatPercent.at(-1) ?? null },
    steps: MOCK.steps,
    period: {
      cells: today ? lastDays(today, HABIT_DAYS).map(() => false) : [],
      daysAgo: MOCK.periodDaysAgo,
    },
    goalPercent: goalProgressPercent(firstWeight, weightLatest, targetWeightKg),
    goalDays:
      today && entries[0]
        ? Math.round((Date.parse(today) - Date.parse(entries[0].logDate)) / MS_PER_DAY) + 1
        : null,
    todayTotals: totals ?? null,
    todayTarget: target ?? null,
    nutrientsToday,
  }
}
