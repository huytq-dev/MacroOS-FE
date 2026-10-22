import { formatMonthYear } from '@/lib/date'
import type { Measure, WeightUnit } from '@/lib/units'
import type { PhotoAngle, PhotoItem, PhotoSession } from './types/progress-photos.types'

export const ANGLES: readonly PhotoAngle[] = ['Front', 'Side', 'Back']

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
    else groups.push({ key, label: formatMonthYear(session.date), sessions: [session] })
  }
  return groups
}

/** "79.3 kg" / "174.8 lb" (BE trả kg, hiện theo đơn vị của user) hoặc "—" khi chưa có. */
export const kgLabel = (value: number | null, weight: Measure<WeightUnit>) => weight.text(value)
