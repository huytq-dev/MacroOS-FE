import type { DayOfWeek } from '@/config/enums'
import { addDaysIso, formatDate, formatMonthDay, lastDayOfMonth } from '@/lib/date'
import { DAYS_PER_WEEK, formatWeekdayMonthDay, weekStartOf } from '@/lib/week'

export const RANGES = ['1W', '1M', '3M', '6M', '1Y', 'All'] as const
export type RangeKey = (typeof RANGES)[number]
export const AVERAGINGS = ['daily', 'weekly', 'monthly'] as const
export type Averaging = (typeof AVERAGINGS)[number]
export const AVERAGING_LABEL: Record<Averaging, string> = {
  daily: 'D - Daily',
  weekly: 'W - Weekly',
  monthly: 'M - Monthly',
}

/**
 * Khoá nhóm của ngày `iso` khi gộp W / M: tuần bắt đầu từ ngày đầu tuần của user (cùng quy tắc `MetricSeries.BucketStart` của BE nên
 * bucket FE trùng bucket BE), tháng = mùng 1. Mọi biểu đồ có D / W / M dùng hàm này thay vì tự chọn ngày đầu tuần.
 */
export const bucketKey = (iso: string, averaging: Averaging, weekStartDay: DayOfWeek) =>
  averaging === 'weekly' ? weekStartOf(iso, weekStartDay) : `${iso.slice(0, 7)}-01`

/** Ngày cuối của nhóm bắt đầu ở `start` (D = chính ngày đó, W = +6 ngày, M = cuối tháng). */
export const bucketEnd = (start: string, averaging: Averaging) =>
  averaging === 'weekly'
    ? addDaysIso(start, DAYS_PER_WEEK - 1)
    : averaging === 'monthly'
      ? lastDayOfMonth(start)
      : start

/**
 * Nhãn điểm đang chạm: ngày (D) hoặc CẢ khoảng của nhóm kèm số ngày CÓ dữ liệu ("Oct 19 – 25, 2026 · 6 days with data"); điểm gộp đặt ở ngày
 * đầu nhóm của BE (đầu tuần theo cài đặt của user / mùng 1), không phải ngày đầu có dữ liệu.
 */
export const bucketLabel = (start: string, end: string, days: number) =>
  start === end
    ? formatWeekdayMonthDay(start)
    : `${rangeLabel(start, end)} · ${days} ${days === 1 ? 'day' : 'days'} with data`

/** Các mốc N ngày của bảng "Changes" (3 / 7 / 14 / 30 / 90). */
export const CHANGE_DAYS = [3, 7, 14, 30, 90] as const

/** Dòng khoảng dưới tiêu đề biểu đồ: "Oct 14 – 20, 2026" khi cùng tháng, ngược lại "Oct 28, 2026 – Nov 3, 2026". */
export const rangeLabel = (from: string, to: string) =>
  from.slice(0, 7) === to.slice(0, 7)
    ? `${formatMonthDay(from)} – ${Number(to.slice(8))}, ${to.slice(0, 4)}`
    : `${formatDate(from)} – ${formatDate(to)}`
