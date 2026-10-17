import type { WeightEntry } from '@/features/weight/types/weight.types'
import { addDaysIso } from '@/lib/date'

/** Hai cách nhìn của trang: số cân thô (xanh lá) hoặc xu hướng (tím). */
export type GoalTab = 'scale' | 'trend'

export type WaterfallKind = 'start' | 'toward' | 'away' | 'status'

/** Một cột thác nước, tính bằng khoảng cách còn lại tới cân mục tiêu (kg): cột trải từ `low` đến `high`. */
export interface WaterfallBar {
  readonly key: string
  readonly label: string
  readonly kind: WaterfallKind
  readonly low: number
  readonly high: number
  /** Nội dung chú thích khi chạm cột, vd. "Day 0: 3.7 kg to gain". */
  readonly tip: string
}

const WEEK_DAYS = 7
const MAX_ETA_DAYS = 3650
const round1 = (value: number) => Math.round(value * 10) / 10
const parse = (iso: string) => new Date(`${iso}T00:00:00`)

const weightOf = (entry: WeightEntry, tab: GoalTab) =>
  tab === 'scale' ? entry.weightKg : (entry.trendWeightKg ?? entry.weightKg)

interface WaterfallInput {
  readonly startKg: number
  readonly targetKg: number
  readonly startDate: string
  readonly today: string
  readonly entries: readonly WeightEntry[]
  readonly tab: GoalTab
}

/**
 * Thác nước tiến độ: "Day 0" = khoảng cách ban đầu tới mục tiêu, mỗi tuần (7 ngày kể từ ngày bắt đầu, lấy lần cân cuối tuần)
 * là một cột nổi — nhạt khi đi xa mục tiêu, đậm khi lại gần — và "Status" = khoảng cách hiện tại. Tuần không cân thì bỏ qua.
 */
export function buildWaterfall({
  startKg,
  targetKg,
  startDate,
  today,
  entries,
  tab,
}: WaterfallInput): { bars: WaterfallBar[]; distance: number } {
  const gain = targetKg > startKg
  const goalWord = gain ? 'gain' : 'lose'
  const sorted = [...entries].sort((a, b) => a.logDate.localeCompare(b.logDate))
  const initial = Math.abs(targetKg - startKg)
  const bars: WaterfallBar[] = [
    {
      key: 'start',
      label: 'Day 0',
      kind: 'start',
      low: 0,
      high: initial,
      tip: `Day 0: ${round1(initial)} kg to ${goalWord}`,
    },
  ]

  let previous = initial
  for (let weekStart = startDate, week = 1; weekStart <= today; week += 1) {
    const weekEnd = addDaysIso(weekStart, WEEK_DAYS - 1)
    const inWeek = sorted.filter((entry) => entry.logDate >= weekStart && entry.logDate <= weekEnd)
    const last = inWeek[inWeek.length - 1]
    if (last) {
      const distance = Math.abs(targetKg - weightOf(last, tab))
      const change = distance - previous
      if (Math.abs(change) >= 0.05) {
        const toward = change < 0
        bars.push({
          key: weekStart,
          label: `Wk ${week}`,
          kind: toward ? 'toward' : 'away',
          low: Math.min(previous, distance),
          high: Math.max(previous, distance),
          tip: `Wk ${week}: ${round1(Math.abs(change))} kg ${toward ? 'towards' : 'away'}`,
        })
      }
      previous = distance
    }
    weekStart = addDaysIso(weekStart, WEEK_DAYS)
  }

  bars.push({
    key: 'status',
    label: 'Status',
    kind: 'status',
    low: 0,
    high: previous,
    tip: `Status: ${round1(previous)} kg to ${goalWord}`,
  })
  return { bars, distance: previous }
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

/** Ngày dự kiến nếu giữ đúng tốc độ mong muốn (kg/tuần); null khi không có tốc độ hoặc quá xa (> 10 năm). */
export function optimisticEta(today: string, remainingKg: number, intendedKgPerWeek: number) {
  const rate = Math.abs(intendedKgPerWeek)
  if (rate === 0) return null
  const days = Math.ceil((remainingKg / rate) * WEEK_DAYS)
  return days > MAX_ETA_DAYS ? null : addDaysIso(today, days)
}

/** Số ngày từ lúc bắt đầu goal tới hôm nay. */
export const goalDuration = (startDate: string, today: string) =>
  Math.max(0, Math.round((parse(today).getTime() - parse(startDate).getTime()) / 864e5))
