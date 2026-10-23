'use client'

import {
  useDailyProgress,
  useDayNutrients,
  useEnergyBalanceWindow,
  useExpenditureSeries,
  useGoalProgress,
  useMacrosSeries,
  usePeriods,
  useSteps,
} from './use-dashboard'
import {
  habitCells,
  isLogged,
  lastDays,
  latestByDate,
  weekCount,
  HABIT_DAYS,
} from '../dashboard.utils'
import type { DashboardPending } from '../dashboard-pending'
import type { EnergyBalanceSeriesResponse } from '../types/energy-balance.types'
import { NO_GOAL } from '@/features/nutrition/goal-progress'
import { NUTRIENT_CODE } from '../nutrient-codes'
import { NUTRIENT_GROUPS } from '../nutrient-catalog'
import type { DailyProgress, NutrientModel, NutrientValue } from '../types/dashboard.types'
import { periodDaySet } from '@/features/period/period.utils'
import { useDayLog } from '@/features/food-log/hooks/use-food-log'
import type { MacroTotals } from '@/features/food-log/types/food-log.types'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { useRecentWeights, useVisualBodyFat, useWeights } from '@/features/weight/hooks/use-weights'
import { SPARK_ENTRIES } from '../entry-spark'
import { macroBarOn, type MacroBar } from '../macros-detail'
import { stepsTodayOf, stepsWeekOf, type StepsTileDay } from '../steps-bars'
import { addDaysIso } from '@/lib/date'
import { DAYS_PER_WEEK } from '@/lib/week'

const WEIGHT_LOOKBACK_DAYS = 365
const PERIOD_LOOKBACK_DAYS = 364
const SPARK_POINTS = 8

export interface DashboardData {
  readonly isLoading: boolean
  /** Nguồn nào còn chờ BE: thẻ / ô của nguồn đó hiện khung xám thay vì "—" / "N/A" / "0/7" (`tilePending`, `focusPending`). */
  readonly pending: DashboardPending
  /** Energy Balance 30 ngày từ BE (thẻ Energy Balance): ngày + `summary`; undefined khi chưa tải. */
  readonly energyBalance: EnergyBalanceSeriesResponse | undefined
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
  /** 7 ngày kết thúc hôm nay cho cột của ô Steps; `steps` null = không có bản ghi ngày đó (không phải 0). */
  readonly stepsWeek: readonly StepsTileDay[]
  readonly period: { readonly cells: readonly boolean[]; readonly daysAgo: number | null }
  /** % quãng đường tới cân mục tiêu (`GET /goals/progress`); null = chưa có goal hoặc Maintenance. */
  readonly goalPercent: number | null
  /** Tổng và target của hôm nay (vòng kcal "Dinh dưỡng hôm nay"); null khi chưa tải xong. */
  readonly todayTotals: MacroTotals | null
  readonly todayTarget: ProgramWeek | null
  /** Giá trị hôm nay cho mọi ô nutrient: macro từ log thật, còn lại từ `GET /nutrients` (amount null = chưa có dữ liệu). */
  readonly nutrientsToday: Readonly<Record<string, NutrientValue>>
  /** 7 ngày gần nhất cho cột chồng của ô Macros (cũ → mới); ngày chưa log = null (không có cột). */
  readonly macrosWeek: readonly (MacroBar | null)[]
}

/** Giá trị + mục tiêu của một chất đúng như BE trả (floor / target / ceiling nguyên vẹn; không suy mốc từ loại thanh của FE). */
function nutrientFromApi(item: NutrientModel | undefined): NutrientValue {
  if (!item) return { value: 0, ...NO_GOAL, known: false }
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
    enabled && today ? addDaysIso(today, -(DAYS_PER_WEEK * 2 - 1)) : null,
    today
  )
  const dailyQuery = useDailyProgress(
    enabled && today ? addDaysIso(today, -(HABIT_DAYS - 1)) : null,
    today
  )
  // Thẻ Energy Balance: từng ngày + thống kê 30 ngày do BE tính (`summary`), không tự tính trung bình từ DailyProgress
  const energyBalanceQuery = useEnergyBalanceWindow(
    enabled && today ? addDaysIso(today, -(HABIT_DAYS - 1)) : null,
    today
  )
  const dayLog = useDayLog(enabled ? today : null)
  const goal = useGoalProgress()
  const stepsQuery = useSteps(today ? addDaysIso(today, -(HABIT_DAYS - 1)) : null, today)
  const periodsQuery = usePeriods(today ? addDaysIso(today, -PERIOD_LOOKBACK_DAYS) : null, today)
  const nutrients = useDayNutrients(enabled ? today : null)
  const macrosSeries = useMacrosSeries(
    today ? { from: addDaysIso(today, -(DAYS_PER_WEEK - 1)), to: today } : {},
    Boolean(today)
  )

  const visualBodyFat = useVisualBodyFat(today)
  // BE trả mới → cũ: lấy các lần đo MỚI NHẤT rồi xếp cũ → mới cho đường nhỏ (`slice(-n)` thẳng sẽ lấy các lần CŨ NHẤT)
  const bodyFatPercents = latestByDate(
    visualBodyFat.data?.items ?? [],
    (item) => item.date,
    DAYS_PER_WEEK
  ).map((item) => item.percent)
  const entries = weights.data?.items ?? []
  // Thẻ Scale Weight: BE trả đúng 7 lần cân gần nhất toàn lịch sử (không phụ thuộc cửa sổ 365 ngày); số lớn là lần cân mới nhất của CÙNG phản hồi
  const recentWeights = useRecentWeights(today, SPARK_ENTRIES)
  const scaleSpark = latestByDate(
    recentWeights.data?.items ?? [],
    (entry) => entry.logDate,
    SPARK_ENTRIES
  ).map((entry) => entry.weightKg)
  const sparkEntries = latestByDate(entries, (entry) => entry.logDate, SPARK_POINTS)
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
  // Calo và macro lấy từ log + target của program (cùng nguồn với vòng "Daily Nutrition"); chỉ có target, không floor / ceiling.
  // Loại mục tiêu như BE: Target khi program có target, None khi chưa có.
  const macro = (value: number | undefined, goal: number | undefined): NutrientValue => ({
    value: value ?? 0,
    floor: null,
    target: goal ?? null,
    ceiling: null,
    goalKind: goal === undefined ? 'None' : 'Target',
  })
  nutrientsToday.calories = macro(totals?.calories, target?.caloriesTarget)
  nutrientsToday.protein = macro(totals?.protein, target?.proteinTarget)
  nutrientsToday.fat = macro(totals?.fat, target?.fatTarget)
  nutrientsToday.carbs = macro(totals?.carbs, target?.carbsTarget)
  // Ô "Macros": số lớn là kcal hôm nay (như MacroFactor), không có thanh target; cột chồng 7 ngày ở `macrosWeek`
  nutrientsToday.macros = macro(totals?.calories, undefined)
  // 7 NGÀY LỊCH kết thúc hôm nay (không phải 7 điểm cuối của một danh sách): ngày chưa log để trống. Cùng nguồn BE (`GET /nutrients/macros/series`) và cùng
  // `macroBarOn` / `drawnKcal` với màn Macros Detail nên tile và chi tiết không bao giờ tính kcal / Other khác nhau.
  const macrosWeek = (today ? lastDays(today, DAYS_PER_WEEK) : []).map((date): MacroBar | null =>
    macrosSeries.data ? macroBarOn(macrosSeries.data, date) : null
  )
  // Chất xơ lấy đúng số BE: 0 cho ngày trống, null (known: false → "---") khi có món nhưng không món nào có dữ liệu chất xơ, như Overview / Detail
  // Chân ô Steps = số bước của hôm nay (user chọn): cùng nguồn `items` với các cột, hôm nay chưa có bản ghi thì null ("---")
  const stepsWeek = today ? stepsWeekOf(stepsQuery.data?.items, today) : []
  const steps = stepsTodayOf(stepsWeek)
  const goalData = goal.data
  return {
    isLoading: weights.isLoading || (enabled && (expenditure.isLoading || dailyQuery.isLoading)),
    /** `GET /energy-balance/series` của 30 ngày gần nhất (từng ngày + `summary` của BE) cho thẻ Energy Balance. */
    energyBalance: energyBalanceQuery.data ?? undefined,
    pending: {
      weights: weights.isPending,
      recentWeights: recentWeights.isPending,
      daily: dailyQuery.isPending,
      energyBalance: energyBalanceQuery.isPending,
      dayLog: dayLog.isPending,
      nutrients: nutrients.isPending,
      steps: stepsQuery.isPending,
      periods: periodsQuery.isPending,
      bodyFat: visualBodyFat.isPending,
      expenditure: expenditure.isPending,
      macros: macrosSeries.isPending,
    },
    weights,
    tdee: expenditure.data?.current?.estimatedTdeeKcal ?? null,
    tdeeSpark: (expenditure.data?.points ?? [])
      .slice(-SPARK_POINTS)
      .map((point) => point.estimatedTdeeKcal),
    weightLatest,
    weightSpark: sparkEntries.map((entry) => entry.trendWeightKg ?? entry.weightKg),
    weightRaw: sparkEntries.map((entry) => entry.weightKg),
    daily,
    weighIn: { cells: habitCells(weighInDates, todayKey), week: weekCount(weighInDates, todayKey) },
    logging: { cells: habitCells(loggedDates, todayKey), week: weekCount(loggedDates, todayKey) },
    scale: { spark: scaleSpark, latest: recentWeights.data?.latestWeightKg ?? null },
    bodyFat: { spark: bodyFatPercents, latest: visualBodyFat.data?.latestPercent ?? null },
    steps: steps === null ? null : Math.round(steps),
    stepsWeek,
    period: {
      cells: today ? lastDays(today, HABIT_DAYS).map((day) => periodSet.has(day)) : [],
      daysAgo: periodsQuery.data?.daysSinceLastPeriodDay ?? null,
    },
    // % do BE tính (null khi chưa có cân mục tiêu, vd. Maintenance): không tự tính thay
    goalPercent: goalData?.progressPercent == null ? null : Math.round(goalData.progressPercent),
    todayTotals: totals ?? null,
    todayTarget: target ?? null,
    nutrientsToday,
    macrosWeek,
  }
}
