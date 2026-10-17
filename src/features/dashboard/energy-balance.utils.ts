import { isLogged, type BalanceMode } from './dashboard.utils'
import { weekStart, type Averaging } from './expenditure.utils'
import type { DailyProgress } from './types/dashboard.types'
import { addDaysIso } from '@/lib/date'

/** Energy Balance (MacroFactor) tính tuần từ Chủ nhật → Thứ Bảy. */
export const BALANCE_WEEK_STARTS_ON = 0
export const BALANCE_CHANGE_DAYS = [3, 7, 14, 30, 90] as const
/** Lệch trong khoảng này vẫn gọi là "Balance / At Target". */
const EVEN_TOLERANCE_KCAL = 25

/** Một ngày: kcal đã ăn (null = chưa log, không vẽ cột) và mốc so sánh (TDEE hoặc target; null = chưa có). */
export interface BalancePoint {
  readonly date: string
  readonly consumed: number | null
  readonly baseline: number | null
}

export type BalanceTrend = 'above' | 'below' | 'even'

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

export function toBalancePoints(
  daily: readonly DailyProgress[],
  mode: BalanceMode,
  fallbackTdee: number | null
): BalancePoint[] {
  return daily.map((point) => {
    const baseline =
      mode === 'targets' ? point.caloriesTarget : (point.estimatedTdeeKcal ?? fallbackTdee)
    return {
      date: point.snapshotDate,
      consumed: isLogged(point) ? point.caloriesConsumed : null,
      baseline: baseline !== null && baseline > 0 ? baseline : null,
    }
  })
}

/** Gộp theo tuần (Chủ nhật đầu tuần)/tháng bằng trung bình các ngày có giá trị. */
export function averageBalancePoints(
  points: readonly BalancePoint[],
  averaging: Averaging
): BalancePoint[] {
  if (averaging === 'daily') return [...points]
  const groups = new Map<string, BalancePoint[]>()
  for (const point of points) {
    const key =
      averaging === 'weekly'
        ? weekStart(point.date, BALANCE_WEEK_STARTS_ON)
        : point.date.slice(0, 7)
    groups.set(key, [...(groups.get(key) ?? []), point])
  }
  const avg = (values: readonly (number | null)[]) => {
    const present = values.filter((value): value is number => value !== null)
    return present.length === 0 ? null : mean(present)
  }
  return [...groups.values()].map((group) => ({
    date: group[0].date,
    consumed: avg(group.map((item) => item.consumed)),
    baseline: avg(group.map((item) => item.baseline)),
  }))
}

export const trendOf = (difference: number): BalanceTrend =>
  Math.abs(difference) <= EVEN_TOLERANCE_KCAL ? 'even' : difference > 0 ? 'above' : 'below'

/** Chênh lệch trung bình (đã ăn − mốc) trên các ngày có log và có mốc; không có ngày nào thì 0 như MacroFactor. */
export function averageDifference(points: readonly BalancePoint[]) {
  const pairs = points.filter(
    (point): point is BalancePoint & { consumed: number; baseline: number } =>
      point.consumed !== null && point.baseline !== null
  )
  return pairs.length === 0 ? 0 : Math.round(mean(pairs.map((p) => p.consumed - p.baseline)))
}

/**
 * Số lớn đầu trang: chế độ Expenditure = chênh lệch trung bình (nhãn Surplus/Deficit/Balance); chế độ Targets = kcal đã ăn
 * trung bình ("Average"). null = chưa log ngày nào (hiện "--").
 */
export function summarizeBalance(points: readonly BalancePoint[], mode: BalanceMode) {
  const logged = points.filter((point) => point.consumed !== null)
  if (logged.length === 0) return { label: mode === 'targets' ? 'Average' : 'Balance', value: null }
  if (mode === 'targets')
    return { label: 'Average', value: Math.round(mean(logged.map((point) => point.consumed ?? 0))) }
  const difference = averageDifference(points)
  const trend = trendOf(difference)
  return {
    label: trend === 'above' ? 'Surplus' : trend === 'below' ? 'Deficit' : 'Balance',
    value: Math.abs(difference),
  }
}

/** Trục kcal từ 0 đến mức cao nhất (cột hoặc đường mốc), 3-4 vạch cách đều. */
export function balanceScale(points: readonly BalancePoint[]) {
  const top = Math.max(0, ...points.flatMap((point) => [point.consumed ?? 0, point.baseline ?? 0]))
  if (top === 0) return { ticks: [0, 5], max: 5 }
  const rough = top / 3
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((n) => n * magnitude).find((n) => n >= rough) ?? rough
  const ticks: number[] = []
  for (let tick = 0; tick < top + step; tick += step) ticks.push(tick)
  return { ticks, max: ticks[ticks.length - 1] }
}

/** Chênh lệch trung bình của N ngày gần nhất kết thúc hôm nay (hàng "Relative to …"). */
export function differenceOverDays(points: readonly BalancePoint[], days: number, today: string) {
  const from = addDaysIso(today, -(days - 1))
  const difference = averageDifference(
    points.filter((point) => point.date >= from && point.date <= today)
  )
  return { difference, trend: trendOf(difference) }
}
