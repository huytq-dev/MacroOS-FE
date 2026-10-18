// Ngày dạng yyyy-MM-dd theo giờ máy (BE nhận DateOnly). Chỉ gọi trong event/useEffect, không trong render (hydration).
export const toIsoDate = (date: Date): string => date.toLocaleDateString('sv')

export const todayIso = (): string => toIsoDate(new Date())

export const addDaysIso = (iso: string, days: number): string => {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** yyyy-MM-dd → MM/dd/yyyy (kiểu Mỹ, giao diện tiếng Anh). Tên hàm giữ nguyên vì còn nhiều nơi gọi. */
export const formatDateVi = (iso: string): string => {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** yyyy-MM-dd → "Oct 16" (không đi qua Intl để khỏi lệch múi giờ / locale giữa server và client). */
export const formatMonthDay = (iso: string): string => {
  const [, month, day] = iso.split('-')
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`
}

/** yyyy-MM-dd → "Oct 16, 2026". */
export const formatMonthDayYear = (iso: string): string =>
  `${formatMonthDay(iso)}, ${iso.split('-')[0]}`
