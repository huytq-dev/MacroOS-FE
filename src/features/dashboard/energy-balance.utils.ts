import type { DayOfWeek } from '@/config/enums'
import { isHistoricalUnverified } from '@/features/nutrition/target-provenance'
import { weekStartOf } from '@/lib/week'
import type { BalanceMode } from './dashboard.utils'
import { bucketEnd, type Averaging } from './expenditure.utils'
import type {
  EnergyBalanceSeriesDay,
  ExpenditureBalanceStatus,
  TargetBalanceStatus,
} from './types/energy-balance.types'

/** Energy Balance (MacroFactor) tính tuần từ Chủ nhật → Thứ Bảy (D12 chốt riêng nên chưa theo `weekStartDay` của user). */
export const BALANCE_WEEK_STARTS_ON: DayOfWeek = 'Sunday'
export const BALANCE_CHANGE_DAYS = [3, 7, 14, 30, 90] as const
/** Lệch trong khoảng này vẫn gọi là "Balance / At Target". */
const EVEN_TOLERANCE_KCAL = 25

/**
 * Một ngày: kcal đã ăn (null = chưa log, không vẽ cột) và mốc so sánh (TDEE hoặc target; null = chưa có). `incomplete` = ngày
 * chưa log đủ: vẫn vẽ cột (mờ) nhưng không tính vào trung bình.
 */
export interface BalancePoint {
  readonly date: string
  readonly consumed: number | null
  readonly baseline: number | null
  readonly incomplete?: boolean
  /**
   * Chênh lệch của ngày theo tab đang chọn (`vsExpenditureKcal` / `vsTargetKcal` do BE tính, đã ăn − mốc); null = BE không tính ngày này. Số lớn đầu
   * trang và nhóm W / M chỉ lấy trung bình các giá trị BE này, FE không tự trừ `consumed − baseline` hay tự quyết ngày nào hợp lệ.
   */
  readonly diff?: number | null
  /** Nhóm W / M: ngày cuối của nhóm và số ngày đã log đủ trong nhóm (điểm đặt ở ngày ĐẦU nhóm; tuần Chủ nhật đến D12). */
  readonly end?: string
  readonly days?: number
}

export type BalanceTrend = 'above' | 'below' | 'even'

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/** Ngày của `GET /energy-balance/series` → điểm vẽ: đường mốc là expenditure (tab 1) hoặc target của ngày đó (tab 2). */
export const fromSeriesDay = (
  day: EnergyBalanceSeriesDay,
  mode: BalanceMode,
  today: string | null = null
): BalancePoint => {
  // Tab Target: ngày LỊCH SỬ (< hôm nay) có target LEGACY_UNVERIFIED (cờ của BE) chỉ để tham khảo nên không có mốc và không có chênh lệch (không đạt / không đạt);
  // hôm nay hiện bình thường. BE cũng loại ngày chưa xác minh khỏi thống kê
  const unverified =
    mode === 'targets' && isHistoricalUnverified(day.targetProvenance, day.date, today)
  return {
    date: day.date,
    consumed: day.caloriesKcal,
    baseline: unverified ? null : mode === 'targets' ? day.targetKcal : day.expenditureKcal,
    diff: unverified ? null : mode === 'targets' ? day.vsTargetKcal : day.vsExpenditureKcal,
    incomplete: day.isIncomplete,
  }
}

/** Trạng thái BE → xu hướng dùng chung (Deficit / BelowTarget = below, Surplus / AboveTarget = above); Waiting = null. */
export const trendOfStatus = (
  status: ExpenditureBalanceStatus | TargetBalanceStatus
): BalanceTrend | null =>
  status === 'Deficit' || status === 'BelowTarget'
    ? 'below'
    : status === 'Surplus' || status === 'AboveTarget'
      ? 'above'
      : status === 'Waiting'
        ? null
        : 'even'

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
        ? weekStartOf(point.date, BALANCE_WEEK_STARTS_ON)
        : `${point.date.slice(0, 7)}-01`
    groups.set(key, [...(groups.get(key) ?? []), point])
  }
  const avg = (values: readonly (number | null)[]) => {
    const present = values.filter((value): value is number => value !== null)
    return present.length === 0 ? null : mean(present)
  }
  return [...groups.entries()].map(([start, group]) => ({
    date: start,
    end: bucketEnd(start, averaging),
    days: countedDiffs(group).length,
    // Cột trung bình chỉ lấy các ngày BE tính (cùng tập với header / số ngày): ngày 0 kcal không nhịn ăn (BE: vs* null) và ngày chưa đủ không kéo cột xuống
    consumed: avg(group.map((item) => (isCounted(item) ? item.consumed : null))),
    // Mốc trung bình cùng tập ngày với cột và chênh lệch (BE: AvgExpenditure / AvgVsExpenditure cùng một tập), để cột − mốc = chênh lệch
    baseline: avg(group.map((item) => (isCounted(item) ? item.baseline : null))),
    diff: avg(group.map((item) => (item.incomplete ? null : (item.diff ?? null)))),
  }))
}

export const trendOf = (difference: number): BalanceTrend =>
  Math.abs(difference) <= EVEN_TOLERANCE_KCAL ? 'even' : difference > 0 ? 'above' : 'below'

/** Các ngày BE có chênh lệch (không chưa-đủ): ngày BE không tính (`diff` null) không nằm trong trung bình cũng như mẫu số. */
const isCounted = (point: BalancePoint) => point.diff != null && !point.incomplete

const countedDiffs = (points: readonly BalancePoint[]) =>
  points.flatMap((point) => (isCounted(point) ? [point.diff as number] : []))

/** Chênh lệch trung bình của các ngày BE tính (số của BE, không tự trừ đã ăn − mốc); không có ngày nào thì 0 như MacroFactor. */
function averageDifference(points: readonly BalancePoint[]) {
  const diffs = countedDiffs(points)
  return diffs.length === 0 ? 0 : Math.round(mean(diffs))
}

/**
 * Số lớn đầu trang, có dấu như MacroFactor: chế độ Expenditure = chênh lệch trung bình so với expenditure (nhãn
 * Surplus/Deficit/Balance, vd "Deficit −1154"); chế độ Targets = chênh lệch trung bình so với target ("Average −1604").
 * null = chưa log ngày nào (hiện "--").
 */
export function summarizeBalance(points: readonly BalancePoint[], mode: BalanceMode) {
  if (countedDiffs(points).length === 0)
    return { label: mode === 'targets' ? 'Average' : 'Balance', value: null }
  const difference = averageDifference(points)
  if (mode === 'targets') return { label: 'Average', value: difference }
  const trend = trendOf(difference)
  return {
    label: trend === 'above' ? 'Surplus' : trend === 'below' ? 'Deficit' : 'Balance',
    value: difference,
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
