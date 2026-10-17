import type { ExpenditurePoint } from './types/dashboard.types'
import { addDaysIso } from '@/lib/date'

export const RANGES = ['1W', '1M', '3M', '6M', '1Y', 'All'] as const
export type RangeKey = (typeof RANGES)[number]
export const AVERAGINGS = ['daily', 'weekly', 'monthly'] as const
export type Averaging = (typeof AVERAGINGS)[number]
export const AVERAGING_LABEL: Record<Averaging, string> = {
  daily: 'D - Daily',
  weekly: 'W - Weekly',
  monthly: 'M - Monthly',
}

/** Số ngày lấy về một lần (đủ cho "All", Expenditure Changes 90 ngày và danh sách theo tháng). */
export const FETCH_DAYS = 730
const RANGE_DAYS: Record<Exclude<RangeKey, 'All' | '1W'>, number> = {
  '1M': 30,
  '3M': 91,
  '6M': 182,
  '1Y': 365,
}

export interface ChartPoint {
  readonly date: string
  readonly value: number
  readonly low: number
  readonly high: number
  readonly holding: boolean
}

const parse = (iso: string) => new Date(`${iso}T00:00:00`)

/** Ngày đầu tuần chứa `iso`; mặc định Thứ Hai (0 = Chủ nhật, như Energy Balance của MacroFactor). */
export const weekStart = (iso: string, startsOn: 0 | 1 = 1) => {
  const day = parse(iso).getDay()
  return addDaysIso(iso, -((day - startsOn + 7) % 7))
}

/**
 * Cửa sổ ngày của một kỳ: 1W = cả tuần Thứ Hai → Chủ nhật hiện tại (ngày chưa tới để trống như MacroFactor),
 * các kỳ khác = N ngày kết thúc hôm nay, All = từ ngày bắt đầu theo dõi (hoặc điểm đầu tiên).
 */
export function windowOf(
  range: RangeKey,
  today: string,
  firstDate: string | null,
  weekStartsOn: 0 | 1 = 1
) {
  if (range === '1W') {
    const from = weekStart(today, weekStartsOn)
    return { from, to: addDaysIso(from, 6) }
  }
  if (range === 'All') return { from: firstDate ?? addDaysIso(today, -29), to: today }
  return { from: addDaysIso(today, -(RANGE_DAYS[range] - 1)), to: today }
}

/**
 * Dải Flux (khoảng bất định của ước lượng). BE chưa trả `fluxLowKcal/fluxHighKcal` nên FE tạm vẽ ± tỉ lệ nghịch với
 * độ dài cửa sổ dữ liệu; đổi sang giá trị BE ngay khi có (xem Docs/.../Expenditure/README.md).
 */
const MOCK_FLUX_KCAL = 150
const mockSpread = (windowDays: number) =>
  Math.max(8, MOCK_FLUX_KCAL / Math.sqrt(Math.max(1, windowDays)))

export function toChartPoints(points: readonly ExpenditurePoint[]): ChartPoint[] {
  return points.map((point) => {
    const spread = mockSpread(point.windowDays)
    return {
      date: point.snapshotDate,
      value: point.estimatedTdeeKcal,
      low: point.fluxLowKcal ?? point.estimatedTdeeKcal - spread,
      high: point.fluxHighKcal ?? point.estimatedTdeeKcal + spread,
      holding: point.status !== 'Updating',
    }
  })
}

const groupKey = (date: string, averaging: Averaging) =>
  averaging === 'weekly' ? weekStart(date) : date.slice(0, 7)

/** Gộp theo tuần/tháng bằng trung bình; điểm gộp là Holding khi mọi điểm trong nhóm đều Holding. */
export function averagePoints(points: readonly ChartPoint[], averaging: Averaging): ChartPoint[] {
  if (averaging === 'daily') return [...points]
  const groups = new Map<string, ChartPoint[]>()
  for (const point of points) {
    const key = groupKey(point.date, averaging)
    groups.set(key, [...(groups.get(key) ?? []), point])
  }
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  return [...groups.values()].map((group) => ({
    date: group[0].date,
    value: mean(group.map((item) => item.value)),
    low: mean(group.map((item) => item.low)),
    high: mean(group.map((item) => item.high)),
    holding: group.every((item) => item.holding),
  }))
}

/** Trung bình của kỳ và chênh lệch cuối − đầu (null khi chưa có điểm nào). */
export function summarize(points: readonly ChartPoint[]) {
  if (points.length === 0) return { average: null, difference: null }
  const average = points.reduce((sum, point) => sum + point.value, 0) / points.length
  return {
    average: Math.round(average),
    difference: Math.round(points[points.length - 1].value - points[0].value),
  }
}

/** Trục y "đẹp": 4 vạch cách đều theo bước 10/20/50/100/…, đủ chứa mọi dải flux. */
export function yScale(points: readonly ChartPoint[]) {
  if (points.length === 0) return { ticks: [0, 1], min: 0, max: 1 }
  const lo = Math.min(...points.map((point) => point.low))
  const hi = Math.max(...points.map((point) => point.high))
  const rough = Math.max(10, (hi - lo) / 3)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= rough) ?? rough
  const min = Math.floor(lo / step) * step
  const max = Math.max(Math.ceil(hi / step) * step, min + step * 3)
  const ticks: number[] = []
  for (let tick = min; tick <= max + 0.1; tick += step) ticks.push(tick)
  return { ticks, min, max: ticks[ticks.length - 1] }
}

export const CHANGE_DAYS = [3, 7, 14, 30, 90] as const

/** Biến thiên TDEE so với N ngày trước (điểm gần nhất trước hoặc đúng ngày đó); null = chưa đủ dữ liệu ("Waiting"). */
export function changeOver(points: readonly ChartPoint[], days: number, today: string) {
  const latest = points[points.length - 1]
  if (!latest) return null
  const target = addDaysIso(today, -days)
  const reference = [...points].reverse().find((point) => point.date <= target)
  return reference ? Math.round(latest.value - reference.value) : null
}

/** Nhóm điểm theo tháng, tháng mới trước, ngày mới trước (danh sách ở cuối trang). */
export function groupByMonth(points: readonly ChartPoint[]) {
  const months = new Map<string, ChartPoint[]>()
  for (const point of [...points].reverse()) {
    const key = point.date.slice(0, 7)
    months.set(key, [...(months.get(key) ?? []), point])
  }
  return [...months.entries()].map(([key, items]) => ({
    key,
    label: parse(`${key}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    items,
  }))
}

export const shortDay = (iso: string) =>
  parse(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

export const rangeLabel = (from: string, to: string) => {
  const a = parse(from)
  const b = parse(to)
  const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' })
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    ? `${month(a)} ${a.getDate()} – ${b.getDate()}, ${b.getFullYear()}`
    : `${month(a)} ${a.getDate()}, ${a.getFullYear()} – ${month(b)} ${b.getDate()}, ${b.getFullYear()}`
}
