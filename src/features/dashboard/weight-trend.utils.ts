import { weekStart, type Averaging } from './expenditure.utils'
import type { WeightEntry } from '@/features/weight/types/weight.types'
import { addDaysIso } from '@/lib/date'

/** Một ngày cân: số cân thô và đường xu hướng (BE trả `trendWeightKg`; chưa có thì lấy luôn số cân). */
export interface WeightPoint {
  readonly date: string
  readonly scale: number
  readonly trend: number
}

export const KCAL_PER_KG = 7700
/** Cửa sổ tính tốc độ tăng/giảm cân ("past three weeks" như MacroFactor). */
const RATE_DAYS = 21

const round1 = (value: number) => Math.round(value * 10) / 10
const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length
const parse = (iso: string) => new Date(`${iso}T00:00:00`)

/** `GET /weights` trả mới → cũ; biểu đồ cần cũ → mới. */
export const toWeightPoints = (items: readonly WeightEntry[]): WeightPoint[] =>
  [...items]
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .map((item) => ({
      date: item.logDate,
      scale: item.weightKg,
      trend: item.trendWeightKg ?? item.weightKg,
    }))

/** Gộp theo tuần/tháng bằng trung bình cả số cân lẫn xu hướng. */
export function averageWeightPoints(
  points: readonly WeightPoint[],
  averaging: Averaging
): WeightPoint[] {
  if (averaging === 'daily') return [...points]
  const groups = new Map<string, WeightPoint[]>()
  for (const point of points) {
    const key = averaging === 'weekly' ? weekStart(point.date) : point.date.slice(0, 7)
    groups.set(key, [...(groups.get(key) ?? []), point])
  }
  return [...groups.values()].map((group) => ({
    date: group[0].date,
    scale: mean(group.map((item) => item.scale)),
    trend: mean(group.map((item) => item.trend)),
  }))
}

/** Trung bình xu hướng của kỳ và chênh lệch cuối − đầu (kg, 1 số lẻ); null khi chưa có điểm. */
export function summarizeWeight(points: readonly WeightPoint[]) {
  if (points.length === 0) return { average: null, difference: null }
  return {
    average: round1(mean(points.map((point) => point.trend))),
    difference: round1(points[points.length - 1].trend - points[0].trend),
  }
}

/** Trục y "đẹp" quanh dữ liệu (số cân + xu hướng): ≥4 vạch cách đều, đỉnh/đáy luôn nằm trong khung. */
export function weightScale(points: readonly WeightPoint[]) {
  if (points.length === 0) return { ticks: [0, 1], min: 0, max: 1 }
  const values = points.flatMap((point) => [point.scale, point.trend])
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const rough = Math.max(1, (hi - lo) / 3)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= rough) ?? rough
  const min = Math.floor((lo - step / 2) / step) * step
  let max = Math.ceil((hi + step / 2) / step) * step
  max = Math.max(max, min + step * 3)
  const ticks: number[] = []
  for (let tick = min; tick <= max + step / 2; tick += step) ticks.push(tick)
  return { ticks, min, max: ticks[ticks.length - 1] }
}

export const WEIGHT_CHANGE_DAYS = [3, 7, 14, 30, 90] as const

/** Biến thiên xu hướng so với N ngày trước (kg); null = chưa đủ dữ liệu ("Waiting"). */
export function weightChangeOver(points: readonly WeightPoint[], days: number, today: string) {
  const latest = points[points.length - 1]
  if (!latest) return null
  const target = addDaysIso(today, -days)
  const reference = [...points].reverse().find((point) => point.date <= target)
  return reference ? round1(latest.trend - reference.trend) : null
}

/**
 * kg/tuần của xu hướng trong ~3 tuần gần nhất; ít hơn 7 ngày dữ liệu thì dùng tốc độ BE tính sẵn, không có thì 0.
 */
export function weeklyRate(points: readonly WeightPoint[], today: string, apiRate: number | null) {
  const from = addDaysIso(today, -RATE_DAYS)
  const recent = points.filter((point) => point.date >= from)
  const first = recent[0]
  const last = recent[recent.length - 1]
  const spanDays =
    first && last ? (parse(last.date).getTime() - parse(first.date).getTime()) / 864e5 : 0
  if (spanDays >= 7) return ((last.trend - first.trend) / spanDays) * 7
  return apiRate ?? 0
}

/** kcal/ngày dư (+) hoặc thiếu (−) suy từ tốc độ đổi cân. */
export const dailyEnergyKcal = (ratePerWeek: number) => Math.round((ratePerWeek * KCAL_PER_KG) / 7)

export const projectWeight = (trendKg: number, ratePerWeek: number, days: number) =>
  round1(trendKg + (ratePerWeek * days) / 7)

export type WeightMove = 'up' | 'down' | 'same'

export const moveOf = (delta: number | null): WeightMove =>
  delta === null || Math.abs(delta) < 0.05 ? 'same' : delta > 0 ? 'up' : 'down'

/** Nhóm theo tháng (mới trước); mỗi ngày kèm biến động xu hướng so với lần cân liền trước. */
export function groupWeightByMonth(points: readonly WeightPoint[]) {
  const months = new Map<string, { point: WeightPoint; move: WeightMove }[]>()
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index]
    const previous = points[index - 1]
    const key = point.date.slice(0, 7)
    months.set(key, [
      ...(months.get(key) ?? []),
      { point, move: moveOf(previous ? point.trend - previous.trend : null) },
    ])
  }
  return [...months.entries()].map(([key, items]) => ({
    key,
    label: parse(`${key}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    items,
  }))
}
