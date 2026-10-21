import { weekStart, type Averaging } from './expenditure.utils'
import type { ExpenditureDayStatus, ExpenditureSeriesDay } from './types/expenditure-series.types'

/** Một ngày của đường Expenditure: kcal, dải Flux và trạng thái (Holding / Calibrating = ô vuông, Updating = vòng tròn). */
export interface ExpDay {
  readonly date: string
  readonly kcal: number
  readonly low: number
  readonly high: number
  readonly holding: boolean
  /** Trạng thái của BE (Calibrating hiện nhãn riêng nhưng vẫn là ô vuông như Holding). */
  readonly status: ExpenditureDayStatus
  /** Thay đổi so với hôm trước (kcal, BE tính); null = ngày đầu hoặc ngày đã gộp tuần / tháng. */
  readonly change: number | null
}

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/** Ngày của BE → điểm biểu đồ; chỉ Updating là vòng tròn, các trạng thái còn lại (Holding, Calibrating) là ô vuông. */
export const toExpDay = (day: ExpenditureSeriesDay): ExpDay => ({
  date: day.date,
  kcal: day.expenditureKcal,
  low: day.fluxLowKcal,
  high: day.fluxHighKcal,
  holding: day.status !== 'Updating',
  status: day.status,
  change: day.changeKcal,
})

/** Gộp theo tuần / tháng bằng trung bình (D = giữ nguyên); gộp là Holding khi mọi ngày trong nhóm đều không phải Updating. */
export function averageExpDays(days: readonly ExpDay[], averaging: Averaging): ExpDay[] {
  if (averaging === 'daily') return [...days]
  const groups = new Map<string, ExpDay[]>()
  for (const day of days) {
    const key = averaging === 'weekly' ? weekStart(day.date) : day.date.slice(0, 7)
    groups.set(key, [...(groups.get(key) ?? []), day])
  }
  return [...groups.values()].map((group) => ({
    date: group[0].date,
    kcal: mean(group.map((day) => day.kcal)),
    low: mean(group.map((day) => day.low)),
    high: mean(group.map((day) => day.high)),
    holding: group.every((day) => day.holding),
    status: group.every((day) => day.holding) ? group[group.length - 1].status : 'Updating',
    change: null,
  }))
}

/**
 * Trục y: thu gọn = từ 0 (vạch mỗi 1000 kcal); mở rộng = vừa khít dải Flux (vạch cách đều 10 / 20 / 50 / 100…, đỉnh và đáy dải nằm
 * trong khung).
 */
export function expAxis(days: readonly ExpDay[], fit: boolean) {
  if (days.length === 0) return { ticks: [0, 1000], min: 0, max: 1000 }
  const lo = Math.min(...days.map((day) => day.low))
  const hi = Math.max(...days.map((day) => day.high))
  if (!fit) {
    const top = Math.max(1000, Math.ceil(hi / 1000) * 1000)
    const ticks: number[] = []
    for (let tick = 0; tick <= top; tick += 1000) ticks.push(tick)
    return { ticks, min: 0, max: top }
  }
  const rough = Math.max(10, (hi - lo) / 3)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= rough) ?? rough
  const min = Math.floor(lo / step) * step
  const max = Math.max(Math.ceil(hi / step) * step, min + step * 3)
  const ticks: number[] = []
  for (let tick = min; tick <= max + 0.1; tick += step) ticks.push(tick)
  return { ticks, min, max: ticks[ticks.length - 1] }
}

/** N + 1 ngày cuối (vẽ vùng thu nhỏ của hàng Expenditure Changes). */
export const recentExp = (days: readonly ExpDay[], span: number) => days.slice(-(span + 1))

export interface ExpHistoryDay {
  readonly date: string
  readonly kcal: number
  readonly holding: boolean
  readonly status: ExpenditureDayStatus
  /** Thay đổi so với ngày liền trước (kcal, BE tính); null = ngày đầu tiên. */
  readonly delta: number | null
}

/** Lịch sử từng ngày, mới trước: Holding hiện "□ Holding", Updating hiện biểu tượng xu hướng + "−3 kcal" so với hôm trước. */
export function expHistory(days: readonly ExpDay[]): ExpHistoryDay[] {
  return days
    .map((day): ExpHistoryDay => ({
      date: day.date,
      kcal: day.kcal,
      holding: day.holding,
      status: day.status,
      delta: day.change,
    }))
    .reverse()
}
