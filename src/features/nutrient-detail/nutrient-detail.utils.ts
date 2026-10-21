import { weekStart, type Averaging } from '@/features/dashboard/expenditure.utils'
import { NUTRIENT_GROUPS } from '@/features/dashboard/nutrient-catalog'
import { NUTRIENT_CODE } from '@/features/dashboard/nutrient-codes'
import type { NutrientDef, NutrientGroup } from '@/features/dashboard/types/dashboard.types'
import { nutrientTone } from '@/features/nutrition/nutrient-display'
import type { NutrientSeriesDay } from './types/nutrient-detail.types'

/** Một chất đã ghép: định nghĩa trong danh mục, nhóm, mã BE và màu (biến CSS cho SVG, lớp nền cho thanh). */
export interface NutrientInfo {
  readonly nutrient: NutrientDef
  readonly group: NutrientGroup
  /** Mã của BE (`GET /nutrients/{code}/...`). */
  readonly code: string
  /** Biến CSS của màu chất, dùng cho cột / dải trong SVG. */
  readonly color: string
  /** Lớp nền literal cho thanh `NutrientGoalBar`. */
  readonly tone: string
}

const MACRO_COLOR: Readonly<Record<string, string>> = {
  calories: 'var(--mf-tile-calories)',
  protein: 'var(--mf-tile-protein)',
  fat: 'var(--mf-tile-fat)',
  carbs: 'var(--mf-tile-carbs)',
}
const GROUP_COLOR: Readonly<Record<string, string>> = {
  carb: 'var(--mf-tile-carbs)',
  fat: 'var(--mf-tile-fat)',
  protein: 'var(--mf-tile-protein)',
  vitamins: 'var(--mf-vitamins)',
  minerals: 'var(--mf-minerals)',
  other: 'var(--mf-tile-calories)',
}

/** Tìm chất theo khoá danh mục (calories, protein, vitaminC…); "macros" (ô tổng hợp) và khoá lạ trả null. */
export function findNutrient(key: string): NutrientInfo | null {
  const code = NUTRIENT_CODE[key]
  if (!code) return null
  for (const group of NUTRIENT_GROUPS) {
    const nutrient = group.nutrients.find((item) => item.key === key)
    if (nutrient)
      return {
        nutrient,
        group,
        code,
        color: MACRO_COLOR[key] ?? GROUP_COLOR[group.key] ?? 'var(--mf-tile-calories)',
        tone: nutrientTone(key, group.tone),
      }
  }
  return null
}

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/**
 * Gộp theo tuần (thứ Hai) / tháng: lượng = trung bình các ngày ĐÃ LOG của nhóm (null khi nhóm không có ngày nào), mốc = của ngày cuối
 * nhóm; điểm đặt ở ngày đầu nhóm. Đầu vào tăng dần theo ngày.
 */
export function averageNutrientDays(
  days: readonly NutrientSeriesDay[],
  averaging: Averaging
): NutrientSeriesDay[] {
  if (averaging === 'daily') return [...days]
  const groups = new Map<string, NutrientSeriesDay[]>()
  for (const day of days) {
    const key = averaging === 'weekly' ? weekStart(day.date) : `${day.date.slice(0, 7)}-01`
    groups.set(key, [...(groups.get(key) ?? []), day])
  }
  return [...groups.entries()].map(([date, group]) => {
    const logged = group.flatMap((day) =>
      day.amount === null || day.isIncomplete ? [] : [day.amount]
    )
    const last = group[group.length - 1]
    return {
      date,
      amount: logged.length === 0 ? null : mean(logged),
      floor: last.floor,
      target: last.target,
      ceiling: last.ceiling,
    }
  })
}

/** Trung bình các ngày đã log trong khung (số lớn đầu trang; ngày chưa đủ không tính, như BE); null khi chưa có ngày nào. */
export function averageLogged(days: readonly NutrientSeriesDay[]): number | null {
  const logged = days.flatMap((day) =>
    day.amount === null || day.isIncomplete ? [] : [day.amount]
  )
  return logged.length === 0 ? null : mean(logged)
}
