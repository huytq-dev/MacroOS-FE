import type { DayOfWeek } from '@/config/enums'
import { bucketEnd, bucketKey, type Averaging } from './expenditure.utils'
import { daysBetween } from '@/lib/date'
import type {
  ExpenditureDayStatus,
  ExpenditureInsightsResponse,
  ExpenditureSeriesDay,
} from './types/expenditure-series.types'

/**
 * Một ngày của đường Expenditure: kcal và trạng thái (Holding / Calibrating = ô vuông, Updating = vòng tròn) cùng dải Flux Range của BE
 * (`fluxLow` / `fluxHigh`, MACROOS_FLUX_V1; null = không có dải, nhất là khi Calibrating). FE chỉ VẼ dải BE trả, không tự tính hay suy từ đường
 * (docs/Expenditure_Flux_UI_Plan.md); dải là "ước lượng bất đồng giữa các độ nhạy", KHÔNG phải khoảng tin cậy.
 */
export interface ExpDay {
  /** Ngày của điểm: D = chính ngày đó; W / M = ngày ĐẦU nhóm theo BE (đầu tuần theo cài đặt của user / mùng 1), không phải ngày đầu có dữ liệu. */
  readonly date: string
  /** Ngày cuối của nhóm (D = `date`). */
  readonly end: string
  /** Số ngày CÓ dữ liệu trong nhóm (ngày thiếu không là Updating, Holding hay 0). */
  readonly days: number
  readonly kcal: number
  /** Biên dưới / trên của dải Flux (cùng đơn vị với `kcal`); cả hai null = không có dải. Luôn `fluxLow ≤ kcal ≤ fluxHigh` khi có. */
  readonly fluxLow: number | null
  readonly fluxHigh: number | null
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

const isNum = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * Dải Flux của BE → `[low, high]`, hoặc null khi thiếu / không hợp lệ. Hợp đồng BE: `low ≤ kcal ≤ high`; dải vi phạm (hoặc chỉ có một biên)
 * bị bỏ thay vì vẽ sai, FE không sửa số của BE.
 */
export const fluxBandOf = (
  kcal: number,
  low: number | null | undefined,
  high: number | null | undefined
): [number, number] | null =>
  isNum(low) && isNum(high) && low <= kcal && kcal <= high ? [low, high] : null

/**
 * Công tắc dải Flux: TẮT cho tới khi user duyệt công thức Flux mới (quyết định 2026-10-26: "Không tự kích hoạt Flux vì API đã có fields"). Tắt thì
 * `toExpDay` luôn cho dải null nên biểu đồ, chú giải, tooltip và trục không có dấu vết nào của Flux; phần vẽ còn lại là mã chưa chạy (có test với
 * `showFlux = true`). Bật lại = đổi hằng này + sửa `docs/UI.md` + check V5.
 */
export const FLUX_BAND_ENABLED = false

/** Ngày của BE → điểm biểu đồ (D). `showFlux` chỉ để test mã dải đang tắt. */
export function toExpDay(day: ExpenditureSeriesDay, showFlux = FLUX_BAND_ENABLED): ExpDay {
  const band = showFlux ? fluxBandOf(day.expenditureKcal, day.fluxLowKcal, day.fluxHighKcal) : null
  return {
    date: day.date,
    end: day.date,
    days: 1,
    kcal: day.expenditureKcal,
    fluxLow: band?.[0] ?? null,
    fluxHigh: band?.[1] ?? null,
    holding: day.status !== 'Updating',
    status: day.status,
    marker: markerOf(day.status),
    updatingDays: day.status === 'Updating' ? 1 : 0,
    otherDays: day.status === 'Updating' ? 0 : 1,
    change: day.changeKcal,
  }
}

/**
 * Dải của một nhóm W / M theo CHÍNH SÁCH GỘP của BE (`ExpenditureFluxService.Buckets`, cùng công thức): trung bình kcal của nhóm ± NỬA ĐỘ RỘNG trung bình
 * của các ngày CÓ dải (`low = ⌊avg − mean(kcal − low)⌋`, `high = ⌈avg + mean(high − kcal)⌉`); không ngày nào có dải thì null. Bám vào trung bình nên luôn
 * `low ≤ avg ≤ high`. FE chỉ lặp lại phép gộp để vẽ (series Day đã tải sẵn, khỏi gọi lại theo bucket); công thức Flux là của BE.
 */
function bucketBand(group: readonly ExpDay[], average: number): [number, number] | null {
  const down: number[] = []
  const up: number[] = []
  for (const day of group) {
    if (!isNum(day.fluxLow) || !isNum(day.fluxHigh)) continue
    down.push(day.kcal - day.fluxLow)
    up.push(day.fluxHigh - day.kcal)
  }
  if (down.length === 0) return null
  return [Math.floor(average - mean(down)), Math.ceil(average + mean(up))]
}

/**
 * Gộp theo tuần (bắt đầu từ `weekStartDay` của user) / tháng chỉ để HIỂN THỊ (D = giữ nguyên): kcal = trung bình các ngày CÓ dữ liệu, điểm đặt ở
 * ngày đầu nhóm của BE. Marker CHỈ khi mọi ngày có dữ liệu trong nhóm cùng một trạng thái hợp lệ; lẫn nhau thì 'Mixed' và không có marker (không suy
 * trạng thái từ số trung bình; quy tắc này là của FE, không phải của MacroFactor). Gộp ở FE vì bucket BE của Expenditure chỉ có trung bình kcal;
 * dải Flux gộp theo `bucketBand`.
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
    const kcal = mean(group.map((day) => day.kcal))
    const band = bucketBand(group, kcal)
    return {
      date: start,
      end: bucketEnd(start, averaging),
      days: group.length,
      kcal,
      fluxLow: band?.[0] ?? null,
      fluxHigh: band?.[1] ?? null,
      holding: same && markerOf(status) === 'square',
      status,
      marker: same ? markerOf(status) : null,
      updatingDays: group.filter((day) => day.status === 'Updating').length,
      otherDays: group.filter((day) => day.status !== 'Updating').length,
      change: null,
    }
  })
}

/**
 * Các đoạn LIÊN TỤC của dải Flux (mỗi đoạn một path): ngắt khi gặp nhóm không có dải hoặc khi giữa hai nhóm liền nhau còn ngày trống, để dải
 * không nối sai qua chỗ thiếu dữ liệu / Calibrating. Mỗi đoạn có ít nhất một nhóm có dải.
 */
export function fluxSegments(days: readonly ExpDay[]): ExpDay[][] {
  const segments: ExpDay[][] = []
  let last: ExpDay | null = null
  for (const day of days) {
    if (!isNum(day.fluxLow) || !isNum(day.fluxHigh)) {
      last = null
      continue
    }
    const current = segments[segments.length - 1]
    if (last && current && daysBetween(last.end, day.date) === 1) current.push(day)
    else segments.push([day])
    last = day
  }
  return segments
}

/** Khoảng tối thiểu của trục (tỉ lệ so với giá trị giữa): đường phẳng không bị phóng thành dao động giả, cũng không dẹt thành một vạch. */
const MIN_AXIS_SPAN_RATIO = 0.04

/** Đệm hai phía khi có dải Flux (tỉ lệ so với khoảng của đường + dải): mép dải không dính khung. */
const FLUX_AXIS_PAD_RATIO = 0.06

/**
 * Trục y luôn vừa khít ĐƯỜNG Expenditure VÀ dải Flux đang hiện (vạch cách đều 10 / 20 / 50 / 100…, đỉnh và đáy nằm trong khung; một điểm vẫn có trục).
 * Có dải thì đệm thêm ~6% hai phía; không dải thì chỉ theo đường như cũ.
 */
export function expAxis(days: readonly ExpDay[]) {
  if (days.length === 0) return { ticks: [0, 1000], min: 0, max: 1000 }
  const values = days.map((day) => day.kcal)
  const lows = days.flatMap((day) => (isNum(day.fluxLow) ? [day.fluxLow] : []))
  const highs = days.flatMap((day) => (isNum(day.fluxHigh) ? [day.fluxHigh] : []))
  const banded = lows.length > 0 && highs.length > 0
  const top = Math.max(...values, ...highs)
  const bottom = Math.min(...values, ...lows)
  const mid = (bottom + top) / 2
  const span = Math.max(top - bottom, mid * MIN_AXIS_SPAN_RATIO)
  const pad = banded ? span * FLUX_AXIS_PAD_RATIO : 0
  const lo = mid - span / 2 - pad
  const hi = mid + span / 2 + pad
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
    | 'calibratingDaysLeft'
    | 'minLoggedDaysPer7'
    | 'minWeighInDaysPer7'
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
        `Only ${info.loggedDaysLast7} of the last 7 days have your nutrition logged. Updating needs at least ${info.minLoggedDaysPer7 ?? 4}.`,
      ]
    if (code === 'NeedsTwoWeighIns')
      return [
        'Updating needs at least 2 weigh-ins in the last 21 days to measure a change in your weight; one weigh-in is not enough.',
      ]
    if (code === 'NoLogsBetweenWeighIns')
      return [
        'There are no valid nutrition logs between your first and last weigh-in, so your weight change cannot be matched to what you ate.',
      ]
    if (code === 'InitialCalibration') {
      const left = info.calibratingDaysLeft
      return [
        `Your estimate is held steady while MacroOS calibrates in the first weeks${typeof left === 'number' && left > 0 ? ` (${left} ${left === 1 ? 'day' : 'days'} left)` : ''}.`,
      ]
    }
    if (code === 'NoRecentWeighIn')
      return [
        `No weigh-in in the last 7 days. Updating needs at least ${info.minWeighInDaysPer7 ?? 1}.`,
      ]
    return []
  })
}

/** Hành động sửa được lý do: ghi cân (thiếu lần cân) hoặc ghi ăn uống (thiếu log). Calibrating ban đầu chỉ cần chờ nên không có nút. */
export type HoldingAction = 'weigh-in' | 'food'

export interface HoldingNotice {
  /** Holding = đang giữ số cũ; Calibrating = TDEE đóng băng theo thiết kế ở giai đoạn đầu. */
  readonly kind: 'Holding' | 'Calibrating'
  /** Một câu ngắn cho ô Dashboard (vd. "No weigh-in in 7 days"). */
  readonly summary: string
  /** Từng lý do đầy đủ cho trang Expenditure (`holdingReasonsOf`). */
  readonly reasons: readonly string[]
  readonly actions: readonly HoldingAction[]
}

/** Mã lý do của BE mà FE hiểu (docs: ExpenditureInsightsResponse.HoldingReasonCodes); mã lạ bị bỏ qua. */
const REASON_ACTION: Readonly<Record<string, HoldingAction | null>> = {
  NoRecentWeighIn: 'weigh-in',
  NeedsTwoWeighIns: 'weigh-in',
  MissingLogs: 'food',
  RecoveringLogs: 'food',
  NoLogsBetweenWeighIns: 'food',
  InitialCalibration: null,
}

/**
 * Thông báo "vì sao Expenditure chưa cập nhật" ở nơi nhìn thấy ngay (trang Expenditure + ô Dashboard), dựng từ `holdingReasonCodes` của BE (KHÔNG tự suy lý do
 * từ số liệu ở FE; BE điền mã cho cả Holding lẫn Calibrating): null khi đang Updating hoặc BE không gửi mã nào FE biết (câu giải thích chung ở Current Strategy vẫn có).
 */
export function holdingNoticeOf(
  info:
    | (NonNullable<Parameters<typeof holdingReasonsOf>[0]> &
        Partial<Pick<ExpenditureInsightsResponse, 'strategy' | 'calibratingDaysLeft'>>)
    | null
): HoldingNotice | null {
  if (!info || (info.strategy !== 'Holding' && info.strategy !== 'Calibrating')) return null
  const known = info.holdingReasonCodes.filter((code) => code in REASON_ACTION)
  if (known.length === 0) return null
  const left = info.calibratingDaysLeft
  const parts = known.map((code) => {
    if (code === 'NoRecentWeighIn') return 'No weigh-in in 7 days'
    if (code === 'MissingLogs') return `${info.loggedDaysLast7} of 7 days logged`
    if (code === 'NeedsTwoWeighIns') return 'Needs 2 weigh-ins'
    if (code === 'NoLogsBetweenWeighIns') return 'No logs between weigh-ins'
    if (code === 'InitialCalibration')
      return typeof left === 'number' && left > 0
        ? `Calibrating, ${left} ${left === 1 ? 'day' : 'days'} left`
        : 'Calibrating'
    return 'Logging again, updating resumes soon'
  })
  const actions = [
    ...new Set(known.flatMap((code) => (REASON_ACTION[code] ? [REASON_ACTION[code]] : []))),
  ]
  return {
    kind: info.strategy,
    summary: parts.join(' · '),
    reasons: holdingReasonsOf(info),
    actions,
  }
}

/**
 * Chú giải chỉ liệt kê lớp ĐANG vẽ trong khung: dải Flux chỉ khi có ngày có dải, đường theo các ngày đang xem, ô vuông Holding chỉ khi có ngày
 * Holding / Calibrating (trạng thái của BE), vòng tròn Updating chỉ khi có ngày Updating.
 */
export const expLegend = (inView: readonly ExpDay[]) => ({
  flux: inView.some((day) => isNum(day.fluxLow) && isNum(day.fluxHigh)),
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
