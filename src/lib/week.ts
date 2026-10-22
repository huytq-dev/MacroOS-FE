import type { DayOfWeek } from '@/config/enums'
import { MONTH_NAMES, addDaysIso, formatMonthDay, parseIso } from './date'

/**
 * Ngày đầu tuần theo cài đặt của user (`weekStartDay` trong hồ sơ, mặc định Monday): MỘT nơi cho mọi dải tuần, mốc đầu tuần và cột đầu
 * của lưới tuần. Các thống kê theo bucket tuần do BE tính (`granularity=Week`) đã dùng cùng cài đặt này; FE chỉ dùng các hàm này cho
 * dải ngày hiển thị (thanh tuần của nhật ký, lưới Weekly Nutrition...).
 */

/** Số ngày của một tuần: MỘT hằng số cho dải tuần, cửa sổ "7 ngày gần nhất" và đổi tốc độ kg/tuần ra ngày. */
export const DAYS_PER_WEEK = 7

/** Thứ tự JS `Date#getDay()` (0 = Chủ nhật) của từng ngày. */
const JS_DAY: Readonly<Record<DayOfWeek, number>> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

const ORDER: readonly DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/** Thứ tự cột (0–6) của ngày `iso` trong tuần bắt đầu từ `start`. */
export const weekdayIndex = (iso: string, start: DayOfWeek = 'Monday'): number =>
  (parseIso(iso).getDay() - JS_DAY[start] + DAYS_PER_WEEK) % DAYS_PER_WEEK

/** Ngày đầu tuần (yyyy-MM-dd) của tuần chứa `iso`. */
export const weekStartOf = (iso: string, start: DayOfWeek = 'Monday'): string =>
  addDaysIso(iso, -weekdayIndex(iso, start))

/** Thứ trong tuần của `iso` theo tên `DayOfWeek` của BE (nhãn ngắn: `.slice(0, 3)` = "Mon", `[0]` = "M"). */
export const dayOfWeekOf = (iso: string): DayOfWeek => ORDER[parseIso(iso).getDay()]

/** Chữ cái đầu của một thứ ("M", "T", "W", "T", "F", "S", "S"): MỘT nguồn cho mọi nhãn một chữ cái (lưới Weekly Nutrition, biểu đồ program, check-in, bảng chọn ngày). */
export const dayLetter = (day: DayOfWeek): string => day[0]

/** `dayLetter` của một ngày yyyy-MM-dd. */
export const dayLetterOfDate = (iso: string): string => dayLetter(dayOfWeekOf(iso))

/** yyyy-MM-dd → "Tue, Oct 20": thứ rút gọn + tháng ngày, tiếng Anh, theo ngày lịch: MỘT hàm cho dòng lịch sử, nhãn điểm đang chạm và danh sách ngày. */
export const formatWeekdayMonthDay = (iso: string): string =>
  `${dayOfWeekOf(iso).slice(0, 3)}, ${formatMonthDay(iso)}`

/** yyyy-MM-dd → "Tuesday, October 20, 2026": nhãn đầy đủ cho trình đọc màn hình (ô ngày của các bảng chọn ngày). */
export const formatLongDate = (iso: string): string => {
  const [year, month, day] = iso.split('-')
  return `${dayOfWeekOf(iso)}, ${MONTH_NAMES[Number(month) - 1]} ${Number(day)}, ${year}`
}

/** "Today" / "Yesterday" / "Tomorrow" quanh `today`, ngày khác là "Thu, Oct 15": MỘT hàm cho tiêu đề Food Log và bánh xe chọn ngày. */
export const relativeDayLabel = (iso: string, today: string | null): string => {
  if (iso === today) return 'Today'
  if (today && iso === addDaysIso(today, -1)) return 'Yesterday'
  if (today && iso === addDaysIso(today, 1)) return 'Tomorrow'
  return formatWeekdayMonthDay(iso)
}

/** Bảy ngày (yyyy-MM-dd) của tuần bắt đầu từ `start`. */
export const weekDates = (start: string): string[] =>
  Array.from({ length: DAYS_PER_WEEK }, (_, index) => addDaysIso(start, index))

/**
 * `GET /food-logs/week` luôn trả khối Thứ Hai → Chủ Nhật chứa ngày gửi lên (không theo `weekStartDay` của user). Các Thứ Hai (khoá khối)
 * cần gọi để phủ đủ các tuần bắt đầu từ `weekStarts`: tuần bắt đầu Thứ Hai nằm trọn một khối, tuần bắt đầu ngày khác nằm trên hai khối.
 */
export const weekBlocksOf = (weekStarts: readonly string[]): string[] => [
  ...new Set(
    weekStarts.flatMap((start) => [
      weekStartOf(start),
      weekStartOf(addDaysIso(start, DAYS_PER_WEEK - 1)),
    ])
  ),
]
