import { addDaysIso } from '@/lib/date'

/** Hai trang Habits dùng chung một bộ thành phần: cân nặng (Weigh-In) và ghi món (Food Logging). */
export type HabitKind = 'weigh-in' | 'food-logging'

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** Tuần bắt đầu từ thứ Hai (như MacroFactor). */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const pad = (value: number) => String(value).padStart(2, '0')

/** yyyy-MM-dd từ năm, tháng (0–11) và ngày. */
export const isoOf = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`

/** Thứ trong tuần, Mon = 0 … Sun = 6. */
export const weekdayIndex = (iso: string) => (new Date(`${iso}T00:00:00`).getDay() + 6) % 7

export interface CalendarDay {
  readonly iso: string
  readonly day: number
  readonly inMonth: boolean
}

/** Lưới lịch tháng 6 hàng × 7 cột (Mon → Sun), có ngày của tháng trước và tháng sau ở hai đầu. */
export function monthGrid(year: number, month: number): CalendarDay[] {
  const first = isoOf(year, month, 1)
  const start = addDaysIso(first, -weekdayIndex(first))
  return Array.from({ length: 42 }, (_, index) => {
    const iso = addDaysIso(start, index)
    const [, isoMonth, isoDay] = iso.split('-')
    return { iso, day: Number(isoDay), inMonth: Number(isoMonth) === month + 1 }
  })
}

/** Số ngày liên tiếp có dữ liệu tính tới hôm nay; hôm nay chưa có thì tính tới hôm qua (streak chưa đứt). */
export function streakOf(tracked: ReadonlySet<string>, today: string) {
  let cursor = tracked.has(today) ? today : addDaysIso(today, -1)
  let count = 0
  while (tracked.has(cursor)) {
    count += 1
    cursor = addDaysIso(cursor, -1)
  }
  return count
}

/** "1 day" / "5 days". */
export const dayCount = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`

export interface HeatmapWeek {
  /** Bảy ngày Mon → Sun; `null` = ngoài năm đang xem (ô trống không vẽ). */
  readonly days: readonly (string | null)[]
}

export interface YearHeatmap {
  readonly weeks: readonly HeatmapWeek[]
  /** Nhãn tháng nằm ở cột tuần chứa ngày mùng 1 của tháng đó. */
  readonly monthLabels: readonly { readonly month: number; readonly column: number }[]
}

/** Heatmap cả năm: mỗi cột là một tuần (Mon → Sun), từ tuần chứa 1/1 tới tuần chứa 31/12. */
export function yearHeatmap(year: number): YearHeatmap {
  const first = isoOf(year, 0, 1)
  const last = isoOf(year, 11, 31)
  const start = addDaysIso(first, -weekdayIndex(first))
  const weeks: HeatmapWeek[] = []
  for (let cursor = start; cursor <= last; cursor = addDaysIso(cursor, 7)) {
    weeks.push({
      days: Array.from({ length: 7 }, (_, index) => {
        const iso = addDaysIso(cursor, index)
        return iso >= first && iso <= last ? iso : null
      }),
    })
  }
  const monthLabels = Array.from({ length: 12 }, (_, month) => {
    const iso = isoOf(year, month, 1)
    return { month, column: weeks.findIndex((week) => week.days.includes(iso)) }
  })
  return { weeks, monthLabels }
}

/** Khoảng ngày cần tải cho một năm (thêm 7 ngày mỗi đầu cho các ô của tháng kề), không vượt hôm nay. */
export function yearRange(year: number, today: string) {
  const from = addDaysIso(isoOf(year, 0, 1), -7)
  const end = addDaysIso(isoOf(year, 11, 31), 7)
  return { from, to: end < today ? end : today }
}
