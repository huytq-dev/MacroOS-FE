import { weekStart, type Averaging, type RangeKey } from '@/features/dashboard/expenditure.utils'
import { addDaysIso } from '@/lib/date'

/** Một điểm trên biểu đồ (giá trị đã gộp theo D/W/M nếu có). */
export interface MetricPoint {
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
const DAY_MS = 864e5
export const daysBetween = (from: string, to: string) =>
  Math.round((parse(to).getTime() - parse(from).getTime()) / DAY_MS)

const round1 = (value: number) => Math.round(value * 10) / 10
const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/** Cửa sổ ngày của kỳ: N ngày kết thúc hôm nay (1W = 7 ngày gần nhất như MacroFactor), All = từ điểm đầu tiên. */
export function metricWindow(range: RangeKey, today: string, firstDate: string | null) {
  if (range === 'All') {
    const from = firstDate && firstDate < today ? firstDate : addDaysIso(today, -6)
    return { from, to: today }
  }
  return { from: addDaysIso(today, -(RANGE_DAYS[range] - 1)), to: today }
}

/** Gộp theo tuần (thứ Hai) / tháng bằng trung bình; điểm đặt ở ngày đầu nhóm. Đầu vào tăng dần theo ngày. */
export function averageMetric(points: readonly MetricPoint[], averaging: Averaging) {
  if (averaging === 'daily') return [...points]
  const groups = new Map<string, number[]>()
  for (const point of points) {
    const key = averaging === 'weekly' ? weekStart(point.date) : `${point.date.slice(0, 7)}-01`
    groups.set(key, [...(groups.get(key) ?? []), point.value])
  }
  return [...groups.entries()].map(([date, values]) => ({ date, value: mean(values) }))
}

/** Average và Difference (cuối − đầu) của kỳ, 1 số lẻ; null khi chưa có điểm. */
export function summarizeMetric(points: readonly MetricPoint[]) {
  if (points.length === 0) return { average: null, difference: null }
  return {
    average: round1(mean(points.map((point) => point.value))),
    difference: round1(points[points.length - 1].value - points[0].value),
  }
}

/**
 * Trục y luôn từ 0 (như MacroFactor) tới số tròn ≥ giá trị lớn nhất; số vạch theo chiều cao biểu đồ
 * (thu gọn ≈ 0/50/100, phóng to ≈ 0/20/…/80).
 */
export function zeroBasedScale(values: readonly number[], tickCount: number) {
  const hi = values.length > 0 ? Math.max(1, ...values) : 10
  const rough = hi / tickCount
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10].map((n) => n * magnitude).find((n) => n * tickCount >= hi) ?? rough
  const ticks = Array.from({ length: Math.ceil(hi / step) + 1 }, (_, index) => index * step)
  return { ticks, max: ticks[ticks.length - 1] }
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Nhãn trục x: 1W = từng ngày (Mon…), ≤ 3 tháng = "Oct 14", dài hơn = tên tháng (kèm năm khi > 1 năm). */
export function xAxisLabels(from: string, to: string) {
  const span = daysBetween(from, to)
  if (span <= 6)
    return Array.from({ length: span + 1 }, (_, index) => {
      const date = addDaysIso(from, index)
      return { date, text: WEEKDAY[parse(date).getDay()] }
    })
  const count = 5
  return Array.from({ length: count }, (_, index) => {
    const date = addDaysIso(from, Math.round((span * index) / (count - 1)))
    const day = parse(date)
    const text =
      span <= 92
        ? `${MONTH[day.getMonth()]} ${day.getDate()}`
        : span <= 366
          ? MONTH[day.getMonth()]
          : `${MONTH[day.getMonth()]} '${String(day.getFullYear()).slice(2)}`
    return { date, text }
  })
}

/** "Mon, Oct 19" cho dòng lịch sử và nhãn điểm đang chạm. */
export const entryDayLabel = (iso: string) => {
  const day = parse(iso)
  return `${WEEKDAY[day.getDay()]}, ${MONTH[day.getMonth()]} ${day.getDate()}`
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
    label: parse(`${key}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    items: monthItems,
  }))
}
