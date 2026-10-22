import type { GoalProgress, GoalWeek } from './types/dashboard.types'
import type { WeightEntry } from '@/features/weight/types/weight.types'
import { addDaysIso, daysBetween } from '@/lib/date'
import type { Measure, WeightUnit } from '@/lib/units'
import { DAYS_PER_WEEK } from '@/lib/week'

/** Hai cách nhìn của trang: số cân thô (xanh lá) hoặc xu hướng (tím). */
export type GoalTab = 'scale' | 'trend'

export type WaterfallKind = 'start' | 'toward' | 'away' | 'status'

/**
 * Một cột thác nước, tính bằng khoảng cách còn lại tới cân mục tiêu: cột trải từ `low` đến `high`, ĐÃ ở đơn vị hiển thị của user (kg hoặc
 * lb) để trục y và chú thích cùng đơn vị; mọi phép tính (ngưỡng 0.05, hướng) vẫn theo kg.
 */
export interface WaterfallBar {
  readonly key: string
  readonly label: string
  readonly kind: WaterfallKind
  readonly low: number
  readonly high: number
  /** Nội dung chú thích khi chạm cột, vd. "Day 0: 3.7 kg to gain". */
  readonly tip: string
}

const weightOf = (entry: WeightEntry, tab: GoalTab) =>
  tab === 'scale' ? entry.weightKg : (entry.trendWeightKg ?? entry.weightKg)

interface WaterfallInput {
  readonly startKg: number
  readonly targetKg: number
  readonly startDate: string
  readonly today: string
  readonly entries: readonly WeightEntry[]
  readonly tab: GoalTab
  /**
   * Các tuần do BE tính (`GoalProgressResponse.weeks`: trend cuối tuần, `trendKg` null = tuần không có cân). Có thì dùng thay vì tự gom
   * từ `entries` — dùng cho tab Trend; tab Scale không có chuỗi cân thô ở BE nên vẫn gom từ các lần cân.
   */
  readonly weeks?: readonly GoalWeek[] | null
  /** Đơn vị hiển thị của cột và chú thích (của user; không có mặc định kg ngầm). */
  readonly weight: Measure<WeightUnit>
}

interface WeekEnd {
  readonly start: string
  /** Cân cuối tuần (kg); null = tuần không có cân. */
  readonly kg: number | null
}

/** Tuần k = 7 ngày từ ngày bắt đầu (tới hôm nay): lần cân cuối tuần, null khi cả tuần không cân. */
function weeksFromEntries(
  startDate: string,
  today: string,
  entries: readonly WeightEntry[],
  tab: GoalTab
): WeekEnd[] {
  const sorted = [...entries].sort((a, b) => a.logDate.localeCompare(b.logDate))
  const weeks: WeekEnd[] = []
  for (let start = startDate; start <= today; start = addDaysIso(start, DAYS_PER_WEEK)) {
    const end = addDaysIso(start, DAYS_PER_WEEK - 1)
    const inWeek = sorted.filter((entry) => entry.logDate >= start && entry.logDate <= end)
    const last = inWeek[inWeek.length - 1]
    weeks.push({ start, kg: last ? weightOf(last, tab) : null })
  }
  return weeks
}

export interface WaterfallResult {
  readonly bars: WaterfallBar[]
  /** kg còn lại tới mục tiêu THEO HƯỚNG của goal, không âm: 0 = đã tới hoặc vượt mục tiêu. */
  readonly distance: number
  /** Đã tới mục tiêu (cân ở hoặc quá mốc đích theo hướng của goal). */
  readonly reached: boolean
  /** kg đã đi QUÁ mục tiêu (0 khi chưa tới): quá mục tiêu không bao giờ hiện thành "còn 1 kg". */
  readonly pastKg: number
}

/**
 * Thác nước tiến độ: "Day 0" = khoảng cách ban đầu tới mục tiêu, mỗi tuần (7 ngày kể từ ngày bắt đầu, lấy lần cân cuối tuần)
 * là một cột nổi — nhạt khi đi xa mục tiêu, đậm khi lại gần — và "Status" = khoảng cách hiện tại. Tuần không cân thì bỏ qua; tuần đổi
 * dưới 0.05 kg không có cột nhưng cột kế tiếp vẫn nối đúng từ mức cuối của cột đã vẽ (vạch nối luôn khớp).
 */
export function buildWaterfall({
  startKg,
  targetKg,
  startDate,
  today,
  entries,
  tab,
  weeks,
  weight,
}: WaterfallInput): WaterfallResult {
  const gain = targetKg > startKg
  const goalWord = gain ? 'gain' : 'lose'
  // kg còn lại tới mục tiêu THEO HƯỚNG của goal; âm = đã đi quá mục tiêu (`Math.abs` biến "quá 1 kg" thành "còn 1 kg")
  const remainingOf = (weightKg: number) => (gain ? targetKg - weightKg : weightKg - targetKg)
  // Số hiển thị: đổi sang đơn vị của user rồi mới làm tròn 1 chữ số ("4" thay vì "4.0", như trước đây)
  const shown = (kg: number) => `${Math.round(weight.convert(kg) * 10) / 10} ${weight.unit}`
  const weekEnds: readonly WeekEnd[] = weeks
    ? weeks.map((week) => ({ start: week.weekStart, kg: week.trendKg }))
    : weeksFromEntries(startDate, today, entries, tab)
  const initial = Math.abs(targetKg - startKg)
  const bars: WaterfallBar[] = [
    {
      key: 'start',
      label: 'Day 0',
      kind: 'start',
      low: 0,
      high: weight.convert(initial),
      tip: `Day 0: ${shown(initial)} to ${goalWord}`,
    },
  ]

  // `drawn` = mức cuối của cột đã VẼ gần nhất; cột kế tiếp đo và nối từ đó, nên phần tuần bị bỏ qua (< 0.05 kg) không cộng dồn quá 0.05 kg
  // và vạch nối không bao giờ lệch. `remaining` = khoảng cách thật còn lại (có thể âm).
  let drawn = initial
  let remaining = initial
  weekEnds.forEach(({ start, kg }, index) => {
    if (kg === null) return
    const week = index + 1
    remaining = remainingOf(kg)
    // Cột vẽ từ trục 0 (= mục tiêu) nên đi quá mục tiêu thì cột dừng ở 0; phần quá nằm ở `pastKg`
    const distance = Math.max(0, remaining)
    const change = distance - drawn
    if (Math.abs(change) >= 0.05) {
      const toward = change < 0
      bars.push({
        key: start,
        label: `Wk ${week}`,
        kind: toward ? 'toward' : 'away',
        low: weight.convert(Math.min(drawn, distance)),
        high: weight.convert(Math.max(drawn, distance)),
        tip: `Wk ${week}: ${shown(Math.abs(change))} ${toward ? 'towards' : 'away'}`,
      })
      drawn = distance
    }
  })

  const reached = remaining <= 0
  const distance = Math.max(0, remaining)
  const pastKg = Math.max(0, -remaining)
  bars.push({
    key: 'status',
    label: 'Status',
    kind: 'status',
    low: 0,
    high: weight.convert(drawn),
    tip: reached
      ? `Status: goal reached${pastKg >= 0.05 ? `, ${shown(pastKg)} past` : ''}`
      : `Status: ${shown(distance)} to ${goalWord}`,
  })
  return { bars, distance, reached, pastKg }
}

/** Trục y từ 0 lên mức cao nhất: ~4 vạch cách đều theo bước 1/2/5/10… */
export function niceAxis(top: number) {
  if (top <= 0) return { ticks: [0, 1], max: 1 }
  const rough = top / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= rough) ?? rough
  const ticks: number[] = []
  for (let tick = 0; ; tick += step) {
    ticks.push(Math.round(tick * 1e6) / 1e6)
    if (tick >= top) break
  }
  return { ticks, max: ticks[ticks.length - 1] }
}

/** ETA hiển thị: ngày / đã đạt / không có (kèm lý do) / không áp dụng. Chỉ phản chiếu `GET /goals/progress`, FE không tự tính ngày. */
export type EtaView =
  | { readonly kind: 'date'; readonly date: string }
  | { readonly kind: 'achieved' }
  | { readonly kind: 'unavailable'; readonly reason: string }
  | { readonly kind: 'none' }

const ETA_REASON_TEXT: Readonly<Record<string, string>> = {
  INSUFFICIENT_WEIGHT_DATA: 'Waiting for more weigh-ins to estimate a date.',
  STALE_WEIGHT_DATA: 'No recent weigh-in, so no date can be estimated yet.',
  NO_TARGET_WEIGHT: 'Set a target weight to see an estimated date.',
  RATE_NOT_TOWARD_GOAL: 'Your recent trend is not moving toward your goal, so there is no date.',
  ETA_IN_PAST: 'The estimate is not available right now.',
  ETA_TOO_FAR: 'At your current rate the goal is too far away to estimate a date.',
}

/**
 * Trạng thái ETA do BE quyết (`estimatedCompletionStatus`): Estimated → ngày của BE (chỉ khi có ngày); GoalAchieved → trạng thái đạt, KHÔNG có ngày;
 * Unavailable → câu lý do từ mã của BE (mã lạ = câu chung), không có ngày. Thiếu status (BE cũ) hoặc NotApplicable thì không hiện gì: không suy ngày.
 * Trang chi tiết và Dashboard cùng đọc từ một response `GET /goals/progress`.
 */
export function etaViewOf(
  goal: Pick<
    GoalProgress,
    'estimatedCompletionDate' | 'estimatedCompletionStatus' | 'estimatedCompletionReasonCode'
  >
): EtaView {
  switch (goal.estimatedCompletionStatus) {
    case 'Estimated':
      return goal.estimatedCompletionDate
        ? { kind: 'date', date: goal.estimatedCompletionDate }
        : { kind: 'none' }
    case 'GoalAchieved':
      return { kind: 'achieved' }
    case 'Unavailable':
      return {
        kind: 'unavailable',
        reason:
          ETA_REASON_TEXT[goal.estimatedCompletionReasonCode ?? ''] ??
          'No estimated date is available right now.',
      }
    default:
      return { kind: 'none' }
  }
}

/**
 * Số ngày theo đuổi goal, TÍNH CẢ ngày bắt đầu và hôm nay (như "Last 7 Days" của các ô khác là 7 ngày lịch kết thúc hôm nay, và một tuần
 * "Wk 1" của thác nước là 7 ngày): bắt đầu hôm nay = 1. Goal chưa bắt đầu (ngày bắt đầu sau hôm nay) = 0. MỘT hàm cho ô Dashboard và trang
 * Goal Progress (BE chưa trả số ngày).
 */
export const goalDuration = (startDate: string, today: string) => {
  const elapsed = daysBetween(startDate, today)
  return elapsed < 0 ? 0 : elapsed + 1
}
