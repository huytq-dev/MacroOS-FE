import type { DayOfWeek } from '@/config/enums'
import { bucketEnd, bucketKey, type Averaging } from './expenditure.utils'
import type {
  ExpenditureDayStatus,
  ExpenditureInsightsResponse,
  ExpenditureSeriesDay,
} from './types/expenditure-series.types'

/**
 * Một ngày của đường Expenditure: kcal và trạng thái (Holding / Calibrating = ô vuông, Updating = vòng tròn). KHÔNG có dải Flux: BE vẫn gửi
 * `fluxLowKcal` / `fluxHighKcal` nhưng công thức của BE không phải của MacroFactor (sai số giả định cố định) nên FE không vẽ (docs/UI.md).
 */
export interface ExpDay {
  /** Ngày của điểm: D = chính ngày đó; W / M = ngày ĐẦU nhóm theo BE (đầu tuần theo cài đặt của user / mùng 1), không phải ngày đầu có dữ liệu. */
  readonly date: string
  /** Ngày cuối của nhóm (D = `date`). */
  readonly end: string
  /** Số ngày CÓ dữ liệu trong nhóm (ngày thiếu không là Updating, Holding hay 0). */
  readonly days: number
  readonly kcal: number
  /** Ô vuông (Holding / Calibrating)? Chỉ để vẽ danh sách từng ngày; biểu đồ đọc `marker`. */
  readonly holding: boolean
  /** Trạng thái của BE; nhóm W / M có các ngày KHÁC trạng thái nhau là 'Mixed' (Calibrating hiện nhãn riêng nhưng vẫn là ô vuông như Holding). */
  readonly status: ExpenditureDayStatus | 'Mixed'
  /** Marker vẽ trên đường: vòng tròn = Updating, ô vuông = Holding / Calibrating, null = không vẽ (nhóm lẫn trạng thái hoặc trạng thái lạ). */
  readonly marker: ExpMarker | null
  /** Số ngày Updating / còn lại (Holding, Calibrating) trong nhóm: tooltip "Mixed". */
  readonly updatingDays: number
  readonly otherDays: number
  /** Thay đổi so với hôm trước (kcal, BE tính); null = ngày đầu hoặc ngày đã gộp tuần / tháng. */
  readonly change: number | null
}

export type ExpMarker = 'circle' | 'square'

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/** Marker của MỘT trạng thái BE: chỉ Updating là vòng tròn, Holding / Calibrating là ô vuông, trạng thái lạ thì không vẽ. */
export const markerOf = (status: string): ExpMarker | null =>
  status === 'Updating'
    ? 'circle'
    : status === 'Holding' || status === 'Calibrating'
      ? 'square'
      : null

/** Ngày của BE → điểm biểu đồ (D). */
export const toExpDay = (day: ExpenditureSeriesDay): ExpDay => ({
  date: day.date,
  end: day.date,
  days: 1,
  kcal: day.expenditureKcal,
  holding: day.status !== 'Updating',
  status: day.status,
  marker: markerOf(day.status),
  updatingDays: day.status === 'Updating' ? 1 : 0,
  otherDays: day.status === 'Updating' ? 0 : 1,
  change: day.changeKcal,
})

/**
 * Gộp theo tuần (bắt đầu từ `weekStartDay` của user) / tháng chỉ để HIỂN THỊ (D = giữ nguyên): kcal = trung bình các ngày CÓ dữ liệu, điểm đặt ở
 * ngày đầu nhóm của BE. Marker CHỈ khi mọi ngày có dữ liệu trong nhóm cùng một trạng thái hợp lệ; lẫn nhau thì 'Mixed' và không có marker (không suy
 * trạng thái từ số trung bình; quy tắc này là của FE, không phải của MacroFactor). Gộp ở FE vì bucket BE của Expenditure chỉ có trung bình kcal.
 */
export function averageExpDays(
  days: readonly ExpDay[],
  averaging: Averaging,
  weekStartDay: DayOfWeek
): ExpDay[] {
  if (averaging === 'daily') return [...days]
  const groups = new Map<string, ExpDay[]>()
  for (const day of days) {
    const key = bucketKey(day.date, averaging, weekStartDay)
    groups.set(key, [...(groups.get(key) ?? []), day])
  }
  return [...groups.entries()].map(([start, group]) => {
    const same = group.every((day) => day.status === group[0].status)
    const status = same ? group[0].status : 'Mixed'
    return {
      date: start,
      end: bucketEnd(start, averaging),
      days: group.length,
      kcal: mean(group.map((day) => day.kcal)),
      holding: same && markerOf(status) === 'square',
      status,
      marker: same ? markerOf(status) : null,
      updatingDays: group.filter((day) => day.status === 'Updating').length,
      otherDays: group.filter((day) => day.status !== 'Updating').length,
      change: null,
    }
  })
}

/** Khoảng tối thiểu của trục (tỉ lệ so với giá trị giữa): đường phẳng không bị phóng thành dao động giả, cũng không dẹt thành một vạch. */
const MIN_AXIS_SPAN_RATIO = 0.04

/** Trục y luôn vừa khít ĐƯỜNG Expenditure đang hiện (vạch cách đều 10 / 20 / 50 / 100…, đỉnh và đáy đường nằm trong khung; một điểm vẫn có trục). */
export function expAxis(days: readonly ExpDay[]) {
  if (days.length === 0) return { ticks: [0, 1000], min: 0, max: 1000 }
  const values = days.map((day) => day.kcal)
  const mid = (Math.min(...values) + Math.max(...values)) / 2
  const span = Math.max(Math.max(...values) - Math.min(...values), mid * MIN_AXIS_SPAN_RATIO)
  const lo = mid - span / 2
  const hi = mid + span / 2
  const rough = Math.max(10, (hi - lo) / 3)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= rough) ?? rough
  const min = Math.floor(lo / step) * step
  const max = Math.max(Math.ceil(hi / step) * step, min + step * 3)
  const ticks: number[] = []
  for (let tick = min; tick <= max + 0.1; tick += step) ticks.push(tick)
  return { ticks, min, max: ticks[ticks.length - 1] }
}

/**
 * Lý do Holding bằng tiếng Anh, dựng từ `holdingReasonCodes` + số ngày thật của BE (câu `holdingReason` của BE là tiếng Việt nên không hiện
 * ra giao diện). Mỗi mã một câu; mã lạ (BE thêm lý do mới) bị bỏ qua và không có câu nào thì thôi: câu giải thích chung của Holding vẫn đủ nghĩa.
 */
export function holdingReasonsOf(
  info: Pick<
    ExpenditureInsightsResponse,
    | 'holdingReasonCodes'
    | 'loggedDaysLast7'
    | 'weighInDaysLast7'
    | 'resumeInDays'
    | 'resumeConsecutiveDays'
  > | null
): string[] {
  if (!info) return []
  return info.holdingReasonCodes.flatMap((code) => {
    // Đang ghi lại sau chuỗi thiếu log: chỉ dùng SỐ của BE (số ngày liên tiếp cần có, số ngày dự kiến nếu tiếp tục ghi); thiếu số nào thì bỏ câu đó, không đoán
    if (code === 'RecoveringLogs') {
      const lines: string[] = []
      const needed = info.resumeConsecutiveDays
      if (typeof needed === 'number' && needed > 0)
        lines.push(
          `Updating resumes after ${needed} consecutive ${needed === 1 ? 'day' : 'days'} of valid logs.`
        )
      const left = info.resumeInDays
      if (typeof left === 'number' && left > 0)
        lines.push(`If you keep logging, about ${left} more ${left === 1 ? 'day' : 'days'} to go.`)
      return lines
    }
    if (code === 'MissingLogs')
      return [
        `Only ${info.loggedDaysLast7} of the last 7 days have your nutrition logged. Updating needs at least 4.`,
      ]
    if (code === 'NoRecentWeighIn')
      return ['No weigh-in in the last 7 days. Updating needs at least 1.']
    return []
  })
}

/**
 * Chú giải chỉ liệt kê lớp ĐANG vẽ trong khung: đường theo các ngày đang xem, ô vuông Holding chỉ khi có ngày Holding / Calibrating
 * (trạng thái của BE), vòng tròn Updating chỉ khi có ngày Updating.
 */
export const expLegend = (inView: readonly ExpDay[]) => ({
  line: inView.length > 0,
  holding: inView.some((day) => day.marker === 'square'),
  updating: inView.some((day) => day.marker === 'circle'),
})

/** N + 1 ngày cuối (vẽ vùng thu nhỏ của hàng Expenditure Changes). */
export const recentExp = (days: readonly ExpDay[], span: number) => days.slice(-(span + 1))

export interface ExpHistoryDay {
  readonly date: string
  readonly kcal: number
  readonly holding: boolean
  readonly status: ExpDay['status']
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
