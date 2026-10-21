import { weekStart, type Averaging } from './expenditure.utils'
import type { WeightTrendDay } from './types/weight-trend.types'
import { moveOf, type WeightMove } from './weight-trend.utils'

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

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

const keyOf = (date: string, averaging: Averaging) =>
  averaging === 'weekly' ? weekStart(date) : date.slice(0, 7)

/** Gộp xu hướng ngày theo tuần / tháng bằng trung bình (D = giữ nguyên); điểm đặt ở ngày đầu nhóm. */
export function averageTrendDays(days: readonly TrendDay[], averaging: Averaging): TrendDay[] {
  if (averaging === 'daily') return [...days]
  const groups = new Map<string, TrendDay[]>()
  for (const day of days) {
    const key = keyOf(day.date, averaging)
    groups.set(key, [...(groups.get(key) ?? []), day])
  }
  return [...groups.values()].map((group) => ({
    date: group[0].date,
    trend: mean(group.map((day) => day.trend)),
  }))
}

/** Gộp các lần cân theo tuần / tháng bằng trung bình (D = giữ nguyên). */
export function averageScaleDays(points: readonly ScaleDay[], averaging: Averaging): ScaleDay[] {
  if (averaging === 'daily') return [...points]
  const groups = new Map<string, ScaleDay[]>()
  for (const point of points) {
    const key = keyOf(point.date, averaging)
    groups.set(key, [...(groups.get(key) ?? []), point])
  }
  return [...groups.values()].map((group) => ({
    date: group[0].date,
    value: mean(group.map((item) => item.value)),
  }))
}

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
