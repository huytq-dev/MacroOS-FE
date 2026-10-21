import { addDaysIso } from '@/lib/date'
import type { PeriodHistory } from './types/period.types'

interface PeriodSpan {
  readonly startDate: string
  readonly endDate: string | null
  readonly periodLengthDays: number | null
}

/** Mọi ngày hành kinh: từ `startDate` tới `endDate` (chưa có thì theo độ dài kỳ, tối thiểu 1 ngày). */
export function periodDaySet(items: readonly PeriodSpan[] | undefined) {
  const days = new Set<string>()
  for (const item of items ?? []) {
    const end =
      item.endDate ?? addDaysIso(item.startDate, Math.max(1, item.periodLengthDays ?? 1) - 1)
    for (let day = item.startDate; day <= end; day = addDaysIso(day, 1)) days.add(day)
  }
  return days
}

/** Các ngày hành kinh theo thứ tự mới → cũ (cho danh sách lịch sử). */
export const trackedDaysDesc = (days: ReadonlySet<string>) =>
  [...days].sort((a, b) => b.localeCompare(a))

/** Độ dài kỳ gần nhất: số BE trả, thiếu thì `periodLengthDays` của kỳ bắt đầu muộn nhất, thiếu nữa thì số ngày đã đánh dấu; null khi chưa có kỳ nào. */
export function lastPeriodLength(history: PeriodHistory | undefined): number | null {
  if (!history || history.items.length === 0) return null
  if (history.lastPeriodLengthDays != null) return history.lastPeriodLengthDays
  const latest = history.items.reduce((top, item) => (item.startDate > top.startDate ? item : top))
  return latest.periodLengthDays ?? periodDaySet([latest]).size
}

/** "1 day" / "5 days". */
export const dayCount = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`
