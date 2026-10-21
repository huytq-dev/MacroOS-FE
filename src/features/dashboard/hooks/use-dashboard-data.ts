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
  energyBalance,
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
  NutrientModel,
  NutrientValue,
  PeriodsResponse,
} from '../types/dashboard.types'
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
}

/** Ngày có hành kinh trong lưới 30 ngày: từ `startDate` tới `endDate` (chưa có thì theo độ dài kỳ, tối thiểu 1 ngày). */
function periodDays(periods: PeriodsResponse | null | undefined) {
  const days = new Set<string>()
  for (const item of periods?.items ?? []) {
    const end =
      item.endDate ?? addDaysIso(item.startDate, Math.max(1, item.periodLengthDays ?? 1) - 1)
    for (let day = item.startDate; day <= end; day = addDaysIso(day, 1)) days.add(day)
  }
  return days
}

/** Thanh của một chất: mốc là target (macro), floor (tối thiểu) hoặc ceiling (tối đa) theo loại thanh của danh mục. */
function nutrientFromApi(item: NutrientModel | undefined, kind: string): NutrientValue {
  if (!item) return { value: 0, target: null, known: false }
  const target =
    kind === 'ceiling'
      ? (item.ceiling ?? item.target)
      : kind === 'floor'
        ? (item.floor ?? item.target)
        : kind === 'target'
          ? item.target
          : null
  return { value: item.amount ?? 0, target, known: item.amount !== null }
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
  const periodSet = periodDays(periodsQuery.data)

  const totals = dayLog.data?.totals
  const target = dayLog.data?.target
  const byCode = new Map((nutrients.data?.items ?? []).map((item) => [item.code, item]))
  const nutrientsToday: Record<string, NutrientValue> = {}
  for (const group of NUTRIENT_GROUPS)
    for (const nutrient of group.nutrients) {
      const code = NUTRIENT_CODE[nutrient.key]
      if (code) nutrientsToday[nutrient.key] = nutrientFromApi(byCode.get(code), nutrient.kind)
    }
  // Calo và macro lấy từ log + target của program (cùng nguồn với vòng "Daily Nutrition")
  nutrientsToday.calories = { value: totals?.calories ?? 0, target: target?.caloriesTarget ?? null }
  nutrientsToday.protein = { value: totals?.protein ?? 0, target: target?.proteinTarget ?? null }
  nutrientsToday.fat = { value: totals?.fat ?? 0, target: target?.fatTarget ?? null }
  nutrientsToday.carbs = { value: totals?.carbs ?? 0, target: target?.carbsTarget ?? null }
  // Ô "Macros": trung bình kcal 7 ngày gần nhất (chỉ ngày có log), không có thanh; chưa log ngày nào thì "---"
  const macrosAverage = energyBalance(daily.slice(-WEEK_DAYS), 'targets', null, null).nutrition
  nutrientsToday.macros = { value: macrosAverage ?? 0, target: null, known: macrosAverage !== null }
  // Chất xơ luôn là số (log không có thì 0) dù BE trả amount null ở ngày trống; mốc tối thiểu vẫn lấy từ BE
  nutrientsToday.fiber = { value: totals?.fiber ?? 0, target: nutrientsToday.fiber?.target ?? null }

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
  }
}
