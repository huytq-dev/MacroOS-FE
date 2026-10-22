import type { DayOfWeek } from '@/config/enums'
import { addDaysIso } from '@/lib/date'
import { weekStartOf } from '@/lib/week'

/** Hai trang Habits dùng chung một bộ thành phần: cân nặng (Weigh-In) và ghi món (Food Logging). */
export type HabitKind = 'weigh-in' | 'food-logging'

const pad = (value: number) => String(value).padStart(2, '0')

/** yyyy-MM-dd từ năm, tháng (0–11) và ngày. */
const isoOf = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

export interface CalendarDay {
  readonly iso: string
  readonly day: number
  readonly inMonth: boolean
}

/** Lưới lịch tháng 6 hàng × 7 cột bắt đầu từ `weekStart` (ngày đầu tuần của user), có ngày của tháng trước và tháng sau ở hai đầu. */
export function monthGrid(year: number, month: number, weekStart: DayOfWeek): CalendarDay[] {
  const first = isoOf(year, month, 1)
  const start = weekStartOf(first, weekStart)
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

export interface HeatmapWeek {
  /** Bảy ngày từ ngày đầu tuần của user; `null` = ngoài năm đang xem (ô trống không vẽ). */
  readonly days: readonly (string | null)[]
}

export interface YearHeatmap {
  readonly weeks: readonly HeatmapWeek[]
  /** Nhãn tháng nằm ở cột tuần chứa ngày mùng 1 của tháng đó. */
  readonly monthLabels: readonly { readonly month: number; readonly column: number }[]
}

/** Heatmap cả năm: mỗi cột là một tuần bắt đầu từ `weekStart`, từ tuần chứa 1/1 tới tuần chứa 31/12. */
export function yearHeatmap(year: number, weekStart: DayOfWeek): YearHeatmap {
  const first = isoOf(year, 0, 1)
  const last = isoOf(year, 11, 31)
  const start = weekStartOf(first, weekStart)
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
