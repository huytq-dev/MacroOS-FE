import { bucketEnd, bucketKey, type Averaging } from '@/features/dashboard/expenditure.utils'
import type { DayOfWeek } from '@/config/enums'
import { formatMonthYear } from '@/lib/date'
import { roundTo } from '@/lib/units'

/** Một điểm trên biểu đồ (giá trị đã gộp theo D/W/M nếu có). */
export interface MetricPoint {
  readonly date: string
  readonly value: number
  /** Nhóm W / M: ngày cuối của nhóm và số lần đo thật trong nhóm (chỉ để nhãn điểm đang chạm). */
  readonly end?: string
  readonly days?: number
}

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/** Gộp theo tuần (bắt đầu từ `weekStartDay` của user) / tháng bằng trung bình; điểm đặt ở ngày đầu nhóm. Đầu vào tăng dần theo ngày. */
export function averageMetric(
  points: readonly MetricPoint[],
  averaging: Averaging,
  weekStartDay: DayOfWeek
) {
  if (averaging === 'daily') return [...points]
  const groups = new Map<string, number[]>()
  for (const point of points) {
    const key = bucketKey(point.date, averaging, weekStartDay)
    groups.set(key, [...(groups.get(key) ?? []), point.value])
  }
  return [...groups.entries()].map(([date, values]) => ({
    date,
    end: bucketEnd(date, averaging),
    days: values.length,
    value: mean(values),
  }))
}

/**
 * Average và Difference (cuối − đầu) của kỳ, 1 số lẻ, cùng định nghĩa với `summary` của BE (trung bình các điểm thật trong kỳ; Difference cần
 * ≥ 2 điểm): null khi chưa có điểm, Difference null khi chỉ có 1 điểm (không bịa 0).
 */
export function summarizeMetric(points: readonly MetricPoint[]) {
  if (points.length === 0) return { average: null, difference: null }
  return {
    average: roundTo(mean(points.map((point) => point.value)), 1),
    difference:
      points.length < 2 ? null : roundTo(points[points.length - 1].value - points[0].value, 1),
  }
}

const NICE_STEPS = [1, 2, 2.5, 5, 10]

/**
 * Trục y: thu gọn = từ 0 tới số tròn ≥ giá trị lớn nhất (≈ 0/50/100); phóng to = vừa dữ liệu (Neck 17/18/19/20 như MF).
 * `tickCount` là số khoảng chia mong muốn (thu gọn 3, phóng to 6).
 */
export function metricScale(values: readonly number[], tickCount: number, fit: boolean) {
  if (values.length === 0) return metricScale([10], tickCount, false)
  const hi = Math.max(...values)
  const lo = fit ? Math.min(...values) : 0
  const rough = Math.max((hi - lo) / tickCount, fit ? 0.5 : 1 / tickCount)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = NICE_STEPS.map((n) => n * magnitude).find((n) => n >= rough) ?? rough
  let min = fit ? Math.floor(lo / step) * step : 0
  let max = Math.ceil(hi / step) * step
  // Ít hơn 3 vạch (dữ liệu gần như phẳng): nới mỗi phía một bước để đường không dính mép
  if (max - min < step * 2) {
    min = fit ? min - step : min
    max += step
  }
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) =>
    roundTo(min + index * step, 2)
  )
  return { ticks, min: ticks[0], max: ticks[ticks.length - 1] }
}

/** Nhóm theo tháng (mới trước): "October 2026". Đầu vào bất kỳ thứ tự. */
export function groupByMonth<T extends { readonly date: string }>(items: readonly T[]) {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date))
  const months = new Map<string, T[]>()
  for (const item of sorted) {
    const key = item.date.slice(0, 7)
    months.set(key, [...(months.get(key) ?? []), item])
  }
  return [...months.entries()].map(([key, monthItems]) => ({
    key,
    label: formatMonthYear(key),
    items: monthItems,
  }))
}
