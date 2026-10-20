import type { PhotoAngle, PhotoItem, PhotoSession } from './types/progress-photos.types'

export const ANGLES: readonly PhotoAngle[] = ['Front', 'Side', 'Back']

const MONTHS = [
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
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** yyyy-MM-dd → "October 2026" (không qua Intl để khỏi lệch locale giữa máy chủ và máy người dùng). */
export const monthLabel = (iso: string) => {
  const [year, month] = iso.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}

/** yyyy-MM-dd → "Tue, Oct 20" (thứ tính theo ngày lịch, không phụ thuộc múi giờ). */
export const weekdayLabel = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return `${WEEKDAYS[weekday]}, ${SHORT_MONTHS[month - 1]} ${day}`
}

export const photoOf = (
  session: PhotoSession | undefined,
  angle: PhotoAngle
): PhotoItem | undefined => session?.photos.find((photo) => photo.angle === angle)

export interface MonthGroup {
  readonly key: string
  readonly label: string
  readonly sessions: readonly PhotoSession[]
}

/** Nhóm các ngày (mới nhất trước) theo tháng, giữ thứ tự. */
export function groupByMonth(sessions: readonly PhotoSession[]): MonthGroup[] {
  const groups: { key: string; label: string; sessions: PhotoSession[] }[] = []
  for (const session of sessions) {
    const key = session.date.slice(0, 7)
    const last = groups.at(-1)
    if (last?.key === key) last.sessions.push(session)
    else groups.push({ key, label: monthLabel(session.date), sessions: [session] })
  }
  return groups
}

/** "79.3 kg" hoặc "—" khi chưa có. */
export const kgLabel = (value: number | null) => (value === null ? '—' : `${value.toFixed(1)} kg`)
