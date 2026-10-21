import { addDaysIso } from '@/lib/date'
import type { PeriodEntry } from './types/period.types'

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

const monthDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** "Oct 12 – Oct 16"; chưa có ngày kết thúc thì "Oct 12 – ongoing". */
export const periodRangeLabel = (entry: Pick<PeriodEntry, 'startDate' | 'endDate'>) =>
  `${monthDay(entry.startDate)} – ${entry.endDate ? monthDay(entry.endDate) : 'ongoing'}`

const plural = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`

/** Dòng phụ của một kỳ: "5 days · Cycle 28 days"; thiếu số thì bỏ phần đó. */
export function periodDetail(entry: PeriodEntry) {
  const parts = [
    entry.periodLengthDays === null ? null : plural(entry.periodLengthDays),
    entry.cycleLengthDays === null ? null : `Cycle ${plural(entry.cycleLengthDays)}`,
  ].filter((part): part is string => part !== null)
  return parts.length > 0 ? parts.join(' · ') : 'In progress'
}

const average = (values: readonly (number | null)[]) => {
  const present = values.filter((value): value is number => value !== null)
  return present.length === 0
    ? null
    : Math.round(present.reduce((sum, value) => sum + value, 0) / present.length)
}

/** Độ dài chu kỳ / kỳ kinh trung bình trên các kỳ có số; null khi chưa có kỳ nào đủ dữ liệu. */
export const summarizePeriods = (items: readonly PeriodEntry[]) => ({
  cycleDays: average(items.map((item) => item.cycleLengthDays)),
  periodDays: average(items.map((item) => item.periodLengthDays)),
})
