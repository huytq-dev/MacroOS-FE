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

/**
 * Làm tròn `digits` chữ số THẬP PHÂN như BE (`Math.Round(decimal, digits, MidpointRounding.AwayFromZero)`, MetricSeries.cs dòng 46): nửa chẵn lẻ làm tròn RA XA
 * số 0 kể cả số âm (Math.round của JS làm tròn -0.5 về 0). Làm sạch nhiễu dấu phẩy động trước (79.305 thường là 79.30499…) để khớp phép tính decimal của BE.
 */
export function roundAway(value: number, digits: number) {
  const factor = 10 ** digits
  const scaled = Math.round(Math.abs(value) * factor * 1e6) / 1e6
  const rounded = (Math.sign(value) * Math.round(scaled)) / factor
  return rounded === 0 ? 0 : rounded
}

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
    // BE `MetricBucket.Average` = trung bình các điểm ngày của nhóm, làm tròn 2 chữ số (MetricSeries.cs dòng 27)
    value: roundAway(mean(values), 2),
  }))
}

/**
 * Average và Difference của kỳ — PHẢI cho đúng kết quả của `MetricSeries.Build` ở BE (MetricSeries.cs dòng 12–23) trên cùng dữ liệu: nhận các điểm NGÀY thô
 * (mỗi ngày một điểm, đã nằm trong kỳ, tăng dần; KHÔNG phải điểm đã gộp W / M), Average = trung bình làm tròn 2 chữ số ra xa số 0, Difference = cuối − đầu
 * (giữ dấu, không Math.abs) làm tròn 2 chữ số, chỉ khi có ≥ 2 điểm. Không có điểm → null (không bịa 0); một điểm → Average của nó, Difference null. Giá trị ở
 * đơn vị CHUẨN của BE (kg, cm, %); đổi sang lb chỉ để hiển thị, sau khi đã tính.
 */
export function summarizeMetric(points: readonly MetricPoint[]) {
  if (points.length === 0) return { average: null, difference: null }
  return {
    average: roundAway(mean(points.map((point) => point.value)), 2),
    difference:
      points.length < 2 ? null : roundAway(points[points.length - 1].value - points[0].value, 2),
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
