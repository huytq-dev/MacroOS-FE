'use client'

import {
  useDailyProgress,
  useDayNutrients,
  useExpenditureSeries,
  useGoalProgress,
  usePeriods,
  useSteps,
} from './use-dashboard'
import {
  goalProgressPercent,
  habitCells,
  isLogged,
  lastDays,
  weekCount,
  HABIT_DAYS,
  WEEK_DAYS,
} from '../dashboard.utils'
import { NUTRIENT_CODE } from '../nutrient-codes'
import { NUTRIENT_GROUPS } from '../nutrient-catalog'
import type {
  DailyProgress,
  MacroStackDay,
  NutrientModel,
  NutrientValue,
} from '../types/dashboard.types'
import { periodDaySet } from '@/features/period/period.utils'
import { KCAL_PER_GRAM } from '@/features/program/utils/day-macros'
import { useDayLog } from '@/features/food-log/hooks/use-food-log'
import type { MacroTotals } from '@/features/food-log/types/food-log.types'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { useVisualBodyFat, useWeights } from '@/features/weight/hooks/use-weights'
import { addDaysIso } from '@/lib/date'

const WEIGHT_LOOKBACK_DAYS = 365
const PERIOD_LOOKBACK_DAYS = 364
const SPARK_POINTS = 8
const MS_PER_DAY = 86_400_000

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
  /** Trung bình bước chân 7 ngày (`GET /steps`); null = chưa có dữ liệu. */
  readonly steps: number | null
  readonly period: { readonly cells: readonly boolean[]; readonly daysAgo: number | null }
  /** % quãng đường tới cân mục tiêu (`GET /goals/progress`); null = chưa có goal hoặc Maintenance. */
  readonly goalPercent: number | null
  /** Số ngày từ lúc bắt đầu goal tới hôm nay (nhãn kỳ của Goal Progress); null = chưa có goal. */
  readonly goalDays: number | null
  /** Tổng và target của hôm nay (vòng kcal "Dinh dưỡng hôm nay"); null khi chưa tải xong. */
  readonly todayTotals: MacroTotals | null
  readonly todayTarget: ProgramWeek | null
  /** Giá trị hôm nay cho mọi ô nutrient: macro từ log thật, còn lại từ `GET /nutrients` (amount null = chưa có dữ liệu). */
  readonly nutrientsToday: Readonly<Record<string, NutrientValue>>
  /** 7 ngày gần nhất cho cột chồng của ô Macros (cũ → mới); ngày chưa log = null (không có cột). */
  readonly macrosWeek: readonly (MacroStackDay | null)[]
}

/** Giá trị + mục tiêu của một chất đúng như BE trả (floor / target / ceiling nguyên vẹn; không suy mốc từ loại thanh của FE). */
function nutrientFromApi(item: NutrientModel | undefined): NutrientValue {
  if (!item) return { value: 0, floor: null, target: null, ceiling: null, known: false }
  return {
    value: item.amount ?? 0,
    floor: item.floor,
    target: item.target,
    ceiling: item.ceiling,
    goalKind: item.goalKind,
    known: item.amount !== null,
  }
}

/** Gom toàn bộ số liệu của Dashboard và các trang con; component chỉ nhận kết quả đã tính. */
export function useDashboardData(today: string | null, enabled: boolean): DashboardData {
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
  const goal = useGoalProgress()
  const stepsQuery = useSteps(today ? addDaysIso(today, -(HABIT_DAYS - 1)) : null, today)
  const periodsQuery = usePeriods(today ? addDaysIso(today, -PERIOD_LOOKBACK_DAYS) : null, today)
  const nutrients = useDayNutrients(enabled ? today : null)

  const visualBodyFat = useVisualBodyFat(today)
  const bodyFatPercents = (visualBodyFat.data?.items ?? [])
    .slice(-WEEK_DAYS)
    .map((item) => item.percent)
  const entries = weights.data?.items ?? []
  const scaleSpark = entries.slice(-WEEK_DAYS).map((entry) => entry.weightKg)
  const weightLatest = weights.data?.latestTrendKg ?? weights.data?.latestWeightKg ?? null
  const daily = dailyQuery.data ?? []
  const todayKey = today ?? ''

  const weighInDates = new Set(entries.map((entry) => entry.logDate))
  const loggedDates = new Set(daily.filter(isLogged).map((point) => point.snapshotDate))
  const periodSet = periodDaySet(periodsQuery.data?.days)

  const totals = dayLog.data?.totals
  const target = dayLog.data?.target
  const byCode = new Map((nutrients.data?.items ?? []).map((item) => [item.code, item]))
  const nutrientsToday: Record<string, NutrientValue> = {}
  for (const group of NUTRIENT_GROUPS)
    for (const nutrient of group.nutrients) {
      const code = NUTRIENT_CODE[nutrient.key]
      if (code) nutrientsToday[nutrient.key] = nutrientFromApi(byCode.get(code))
    }
  // Calo và macro lấy từ log + target của program (cùng nguồn với vòng "Daily Nutrition"); chỉ có target, không floor / ceiling
  const macro = (value: number | undefined, goal: number | undefined): NutrientValue => ({
    value: value ?? 0,
    floor: null,
    target: goal ?? null,
    ceiling: null,
  })
  nutrientsToday.calories = macro(totals?.calories, target?.caloriesTarget)
  nutrientsToday.protein = macro(totals?.protein, target?.proteinTarget)
  nutrientsToday.fat = macro(totals?.fat, target?.fatTarget)
  nutrientsToday.carbs = macro(totals?.carbs, target?.carbsTarget)
  // Ô "Macros": số lớn là kcal hôm nay (như MacroFactor), không có thanh target; cột chồng 7 ngày ở `macrosWeek`
  nutrientsToday.macros = macro(totals?.calories, undefined)
  const macrosWeek = daily.slice(-WEEK_DAYS).map((point): MacroStackDay | null => {
    if (!isLogged(point)) return null
    const carbs = point.carbsConsumed * KCAL_PER_GRAM.carbs
    const fat = point.fatConsumed * KCAL_PER_GRAM.fat
    const protein = point.proteinConsumed * KCAL_PER_GRAM.protein
    return {
      date: point.snapshotDate,
      carbs,
      fat,
      protein,
      other: Math.max(0, point.caloriesConsumed - carbs - fat - protein),
    }
  })
  // Chất xơ luôn là số (log không có thì 0) dù BE trả amount null ở ngày trống; mốc tối thiểu vẫn lấy từ BE
  nutrientsToday.fiber = { ...nutrientsToday.fiber, value: totals?.fiber ?? 0, known: true }

  const steps = stepsQuery.data?.last7DayAverage ?? null
  const goalData = goal.data
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
    bodyFat: { spark: bodyFatPercents, latest: visualBodyFat.data?.latestPercent ?? null },
    steps: steps === null ? null : Math.round(steps),
    period: {
      cells: today ? lastDays(today, HABIT_DAYS).map((day) => periodSet.has(day)) : [],
      daysAgo: periodsQuery.data?.daysSinceLastStart ?? null,
    },
    goalPercent: goalData
      ? (goalData.progressPercent ??
        goalProgressPercent(
          goalData.startWeightKg,
          goalData.currentTrendKg,
          goalData.targetWeightKg
        ))
      : null,
    goalDays:
      today && goalData
        ? Math.max(
            0,
            Math.round((Date.parse(todayKey) - Date.parse(goalData.startDate)) / MS_PER_DAY)
          ) + 1
        : null,
    todayTotals: totals ?? null,
    todayTarget: target ?? null,
    nutrientsToday,
    macrosWeek,
  }
}
