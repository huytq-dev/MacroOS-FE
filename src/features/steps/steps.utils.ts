import { z } from 'zod'
import { bucketEnd, bucketKey, type Averaging } from '@/features/dashboard/expenditure.utils'
import type { DayOfWeek } from '@/config/enums'

/** Một ngày có số bước (đã gộp D/W/M nếu có): `date` là ngày của bản ghi hoặc ngày đầu nhóm. */
export interface StepsDay {
  readonly date: string
  readonly steps: number
  /** Nhóm W / M: ngày cuối của nhóm và số ngày có dữ liệu trong nhóm (chỉ để nhãn điểm đang chạm). */
  readonly end?: string
  readonly days?: number
  /** Nguồn bản ghi của BE (nhập tay hay đồng bộ); chỉ có ở dòng lịch sử, không có ở điểm đã gộp D/W/M. */
  readonly source?: string
}

/** Bước chân: số nguyên không âm (BE lưu int theo ngày); chặn trên 100.000 cho nhập nhầm. */
export const stepsValueSchema = z
  .number()
  .int('Enter whole steps')
  .min(0, 'At least 0 steps')
  .max(100000, 'Max 100,000 steps')

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/** Gộp theo tuần (bắt đầu từ `weekStartDay` của user) / tháng bằng trung bình các ngày có số; điểm đặt ở ngày đầu nhóm. Đầu vào tăng dần theo ngày. */
export function averageSteps(
  days: readonly StepsDay[],
  averaging: Averaging,
  weekStartDay: DayOfWeek
): StepsDay[] {
  if (averaging === 'daily') return [...days]
  const groups = new Map<string, number[]>()
  for (const day of days) {
    const key = bucketKey(day.date, averaging, weekStartDay)
    groups.set(key, [...(groups.get(key) ?? []), day.steps])
  }
  return [...groups.entries()].map(([date, values]) => ({
    date,
    end: bucketEnd(date, averaging),
    days: values.length,
    steps: Math.round(mean(values)),
  }))
}

/** Trung bình và tổng của các ngày đã ghi trong khung; null khi chưa có ngày nào. */
export function summarizeSteps(days: readonly StepsDay[]) {
  if (days.length === 0) return { average: null, total: null }
  const total = days.reduce((sum, day) => sum + day.steps, 0)
  return { average: Math.round(total / days.length), total }
}

/** "2587" (không dấu phân cách, như MacroFactor). */
export const formatSteps = (value: number) => String(Math.round(value))
