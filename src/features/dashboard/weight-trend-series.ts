import type { RangeKey } from './expenditure.utils'
import type { WeightTrendBucket, WeightTrendDay } from './types/weight-trend.types'
import { moveOf, type WeightMove } from './weight-trend.utils'
import { addDaysIso } from '@/lib/date'

/** Xu hướng của MỘT ngày (đường Trend Weight có vòng tròn rỗng mỗi ngày). */
export interface TrendDay {
  readonly date: string
  readonly trend: number
}

/** Một lần cân thật (đường Scale Weight nối các lần này, không có marker). */
export interface ScaleDay {
  readonly date: string
  readonly value: number
}

const RANGE_DAYS: Record<Exclude<RangeKey, 'All'>, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 91,
  '6M': 182,
  '1Y': 365,
}

const parse = (iso: string) => new Date(`${iso}T00:00:00`)
const daysBetween = (from: string, to: string) =>
  Math.round((parse(to).getTime() - parse(from).getTime()) / 864e5)

/** Cửa sổ của một kỳ: LUÔN kết thúc hôm nay (1W = 7 ngày gần nhất, không phải tuần lịch có ngày chưa tới); All = từ lần cân đầu. */
export function trailingWindow(range: RangeKey, today: string, firstDate: string | null) {
  if (range === 'All') return { from: firstDate ?? addDaysIso(today, -29), to: today }
  return { from: addDaysIso(today, -(RANGE_DAYS[range] - 1)), to: today }
}

/** Hai đường của biểu đồ từ chuỗi ngày của BE: trend mỗi ngày, scale chỉ ở ngày có cân (nối qua các ngày cân). */
export function daysToSeries(days: readonly WeightTrendDay[]) {
  return {
    trend: days.map((day): TrendDay => ({ date: day.date, trend: day.trendKg })),
    scale: days.flatMap((day): ScaleDay[] =>
      day.scaleKg === null ? [] : [{ date: day.date, value: day.scaleKg }]
    ),
  }
}

/** Như `daysToSeries` nhưng từ bucket tuần / tháng (điểm đặt ở ngày đầu bucket). */
export function bucketsToSeries(buckets: readonly WeightTrendBucket[]) {
  return {
    trend: buckets.map((bucket): TrendDay => ({ date: bucket.start, trend: bucket.trendKg })),
    scale: buckets.flatMap((bucket): ScaleDay[] =>
      bucket.scaleKg === null ? [] : [{ date: bucket.start, value: bucket.scaleKg }]
    ),
  }
}

/** Số ô ngày của cửa sổ (1W = 7); điểm đặt tại ô thứ `slotOf(date)`. */
export const windowDays = (window: { from: string; to: string }) =>
  daysBetween(window.from, window.to) + 1
export const slotOf = (window: { from: string; to: string }, date: string) =>
  daysBetween(window.from, date)

/**
 * Trục y: thu gọn = từ 0 (0 / 50 / 100…, thêm vạch khi cân nặng vượt 100 kg); mở rộng = vừa khít dữ liệu (vạch cách đều, có đỉnh và đáy
 * của cả hai đường trong khung).
 */
export function yAxis(values: readonly number[], fit: boolean) {
  if (!fit || values.length === 0) {
    const top = Math.max(100, Math.ceil(Math.max(0, ...values) / 50) * 50)
    const ticks: number[] = []
    for (let tick = 0; tick <= top; tick += 50) ticks.push(tick)
    return { ticks, min: 0, max: top }
  }
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const rough = Math.max(0.5, (hi - lo) / 3)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((n) => n * magnitude).find((n) => n >= rough) ?? rough
  const min = Math.floor((lo - step / 4) / step) * step
  let max = Math.ceil((hi + step / 4) / step) * step
  max = Math.max(max, min + step * 2)
  const ticks: number[] = []
  for (let tick = min; tick <= max + step / 2; tick += step) ticks.push(Number(tick.toFixed(4)))
  return { ticks, min, max: ticks[ticks.length - 1] }
}

/** N + 1 điểm xu hướng cuối (vẽ vùng thu nhỏ của hàng Weight Changes); không đủ thì lấy hết. */
export const recentTrend = (days: readonly TrendDay[], span: number) => days.slice(-(span + 1))

export interface HistoryDay {
  readonly date: string
  readonly trend: number
  /** Thay đổi so với ngày liền trước (làm tròn 0.1); null = ngày đầu tiên. */
  readonly delta: number | null
  readonly move: WeightMove
}

/** Lịch sử từng ngày, mới trước, kèm `changeKg` của BE làm tròn 0.1 ("↘ −0.1 kg" / "→ No Change" khi tròn về 0). */
export function toHistory(days: readonly WeightTrendDay[]): HistoryDay[] {
  return days
    .map((day): HistoryDay => {
      const delta = day.changeKg === null ? null : Math.round(day.changeKg * 10) / 10
      return { date: day.date, trend: day.trendKg, delta, move: moveOf(delta) }
    })
    .reverse()
}
