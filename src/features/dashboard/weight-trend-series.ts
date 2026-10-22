import { bucketEnd, bucketKey, type Averaging } from './expenditure.utils'
import type { WeightTrendDay } from './types/weight-trend.types'
import { moveOf, type WeightMove } from './weight-trend.utils'
import type { DayOfWeek } from '@/config/enums'
import { roundTo, type Measure, type WeightUnit } from '@/lib/units'

/** Xu hướng của MỘT ngày (đường Trend Weight có vòng tròn rỗng mỗi ngày). */
export interface TrendDay {
  /** D = chính ngày đó; W / M = ngày ĐẦU nhóm theo BE (không phải ngày đầu có dữ liệu). */
  readonly date: string
  readonly trend: number
  /** Ngày cuối của nhóm và số ngày CÓ dữ liệu trong nhóm (D: `date`, 1); chỉ để nhãn điểm đang chạm. */
  readonly end?: string
  readonly days?: number
}

/** Một lần cân thật (đường Scale Weight nối các lần này, không có marker). */
export interface ScaleDay {
  readonly date: string
  readonly value: number
  /** Như `TrendDay`: khoảng của nhóm và số LẦN CÂN thật trong nhóm. */
  readonly end?: string
  readonly days?: number
}

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/** Gộp xu hướng ngày theo tuần (bắt đầu từ `weekStartDay` của user) / tháng bằng trung bình các ngày CÓ dữ liệu (D = giữ nguyên); điểm đặt ở ngày đầu nhóm của BE. */
export function averageTrendDays(
  days: readonly TrendDay[],
  averaging: Averaging,
  weekStartDay: DayOfWeek
): TrendDay[] {
  if (averaging === 'daily') return [...days]
  const groups = new Map<string, TrendDay[]>()
  for (const day of days) {
    const key = bucketKey(day.date, averaging, weekStartDay)
    groups.set(key, [...(groups.get(key) ?? []), day])
  }
  return [...groups.entries()].map(([start, group]) => ({
    date: start,
    end: bucketEnd(start, averaging),
    days: group.length,
    trend: mean(group.map((day) => day.trend)),
  }))
}

/** Gộp các lần cân theo tuần (bắt đầu từ `weekStartDay` của user) / tháng bằng trung bình (D = giữ nguyên). */
export function averageScaleDays(
  points: readonly ScaleDay[],
  averaging: Averaging,
  weekStartDay: DayOfWeek
): ScaleDay[] {
  if (averaging === 'daily') return [...points]
  const groups = new Map<string, ScaleDay[]>()
  for (const point of points) {
    const key = bucketKey(point.date, averaging, weekStartDay)
    groups.set(key, [...(groups.get(key) ?? []), point])
  }
  return [...groups.entries()].map(([start, group]) => ({
    date: start,
    end: bucketEnd(start, averaging),
    days: group.length,
    value: mean(group.map((item) => item.value)),
  }))
}

/**
 * Trục y LUÔN vừa khít dữ liệu đang hiện như MacroFactor (không bắt đầu từ 0, vạch cách đều, có đỉnh và đáy của cả hai đường trong khung; một điểm
 * vẫn có trục). Chưa có dữ liệu thì trục mặc định 0 / 50 / 100 chỉ để vẽ khung trống.
 */
export function yAxis(values: readonly number[]) {
  if (values.length === 0) return { ticks: [0, 50, 100], min: 0, max: 100 }
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

/** Chú giải chỉ liệt kê lớp có điểm trong khung: Scale Weight chỉ khi có lần cân thật, Trend Weight khi có xu hướng. */
export const trendLegend = (scaleInView: number, trendInView: number) => ({
  scale: scaleInView > 0,
  trend: trendInView > 0,
})

/** N + 1 điểm xu hướng cuối (vẽ vùng thu nhỏ của hàng Weight Changes); không đủ thì lấy hết. */
export const recentTrend = (days: readonly TrendDay[], span: number) => days.slice(-(span + 1))

export interface HistoryDay {
  readonly date: string
  readonly trend: number
  /** Thay đổi so với ngày liền trước, ĐÃ đổi sang đơn vị hiển thị rồi mới làm tròn 0.1; null = ngày đầu tiên. */
  readonly delta: number | null
  readonly move: WeightMove
}

/**
 * Lịch sử từng ngày, mới trước, kèm `changeKg` của BE đổi sang đơn vị của user rồi làm tròn 0.1 ("↘ −0.1 kg" / "→ No Change" khi tròn về 0
 * — hướng đổi theo đúng số đang hiển thị, không theo số kg chưa đổi).
 */
export function toHistory(
  days: readonly WeightTrendDay[],
  weight: Measure<WeightUnit>
): HistoryDay[] {
  return days
    .map((day): HistoryDay => {
      const delta = day.changeKg === null ? null : roundTo(weight.convert(day.changeKg), 1)
      return { date: day.date, trend: day.trendKg, delta, move: moveOf(delta) }
    })
    .reverse()
}
