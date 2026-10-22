// Ngày dạng yyyy-MM-dd theo giờ máy (BE nhận DateOnly). Chỉ gọi trong event/useEffect, không trong render (hydration).
const toIsoDate = (date: Date): string => date.toLocaleDateString('sv')

/**
 * Múi giờ NGHIỆP VỤ của user (BE `GET /users/me` → `effectiveTimeZone`: múi giờ hồ sơ, hoặc "UTC" khi hồ sơ chưa đặt / không hợp lệ). BE tính "hôm nay" theo múi giờ này
 * và từ chối (400) ngày ở tương lai so với nó, nên FE phải dùng ĐÚNG cùng "hôm nay" thay vì ngày của thiết bị. null = chưa biết (hồ sơ chưa tải) → dùng giờ máy.
 */
let effectiveZone: string | null = null
export const setEffectiveTimeZone = (zone: string | null | undefined): void => {
  effectiveZone = zone && zone.trim() !== '' ? zone : null
}

/** yyyy-MM-dd của thời điểm `now` trong múi giờ IANA `zone` (BE: `TimeZoneInfo.ConvertTime(utcNow, zone)`); id lạ ném RangeError. */
export const isoInZone = (now: Date, zone: string): string =>
  new Intl.DateTimeFormat('sv', { timeZone: zone }).format(now)

export const todayIso = (): string => {
  if (effectiveZone !== null) {
    try {
      return isoInZone(new Date(), effectiveZone)
    } catch {
      // id múi giờ trình duyệt không hiểu: dùng giờ máy thay vì ném lỗi
    }
  }
  return toIsoDate(new Date())
}

/** yyyy-MM-dd → Date lúc 0h giờ máy: MỘT cách đọc ngày cho mọi phép tính và định dạng ngày của app (không nơi nào tự ghép `T00:00:00`). */
export const parseIso = (iso: string): Date => new Date(`${iso}T00:00:00`)

export const addDaysIso = (iso: string, days: number): string => {
  const date = parseIso(iso)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Ngày cuối tháng (yyyy-MM-dd) của tháng chứa `iso`; tính bằng số học lịch (UTC) nên không phụ thuộc múi giờ. */
export const lastDayOfMonth = (iso: string): string => {
  const [year, month] = iso.split('-').map(Number)
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${iso.slice(0, 7)}-${String(day).padStart(2, '0')}`
}

const DAY_MS = 864e5

/** Số ngày LỊCH từ `from` tới `to` (to − from); làm tròn nên giờ mùa hè (ngày 23 / 25 giờ) không làm lệch một ngày. */
export const daysBetween = (from: string, to: string): number =>
  Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / DAY_MS)

/** Tên tháng tiếng Anh (chỉ số 0–11): MỘT bảng cho mọi nhãn tháng của app ("October 2026", "Oct 16", bảng chọn tháng, heatmap). */
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

/** "Jan" … "Dec" (ba chữ đầu của `MONTH_NAMES`): nhãn tháng rút gọn của lịch, bảng chọn tháng và "Oct 16". */
export const MONTH_SHORT: readonly string[] = MONTH_NAMES.map((name) => name.slice(0, 3))

/** yyyy-MM-dd → "Oct 16" (không đi qua Intl để khỏi lệch múi giờ / locale giữa server và client). */
export const formatMonthDay = (iso: string): string => {
  const [, month, day] = iso.split('-')
  return `${MONTH_SHORT[Number(month) - 1]} ${Number(day)}`
}

/** yyyy-MM hoặc yyyy-MM-dd → "October 2026" (cũng không qua Intl). */
export const formatMonthYear = (iso: string): string => {
  const [year, month] = iso.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`
}

/** Ngày hiển thị chung của app (tiếng Anh, như MacroFactor): yyyy-MM-dd → "Oct 20, 2026". */
export const formatDate = (iso: string): string => `${formatMonthDay(iso)}, ${iso.split('-')[0]}`
