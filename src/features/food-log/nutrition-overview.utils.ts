import { NUTRIENT_GROUPS } from '@/features/dashboard/nutrient-catalog'
import type { NutrientDef } from '@/features/dashboard/types/dashboard.types'
import { NO_GOAL, type NutrientGoal } from '@/features/nutrition/goal-progress'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { FoodLogEntry, MacroTotals, NutritionOverviewItem } from './types/food-log.types'

export const OVERVIEW_RANGES = ['today', 'week', 'month', 'quarter', 'year'] as const
export type OverviewRange = (typeof OVERVIEW_RANGES)[number]

export const OVERVIEW_RANGE_LABEL: Record<OverviewRange, string> = {
  today: 'Today',
  week: '1 Week',
  month: '1 Month',
  quarter: '3 Months',
  year: '1 Year',
}

/** Tên hiển thị khác với danh mục của trang Dinh dưỡng (theo MacroFactor Nutrition Overview). */
const NAME_OVERRIDE: Readonly<Record<string, string>> = {
  netCarbs: 'Net Carbs',
  monounsaturated: 'Monounsaturated',
  polyunsaturated: 'Polyunsaturated',
  saturated: 'Saturated',
  b1: 'B1, Thiamine',
  b2: 'B2, Riboflavin',
  b3: 'B3, Niacin',
  b5: 'B5, Pantothenic Acid',
  b6: 'B6, Pyridoxine',
  b12: 'B12, Cobalamin',
}

export const displayName = (nutrient: NutrientDef) => NAME_OVERRIDE[nutrient.key] ?? nutrient.name

/** Nhóm hiển thị của trang: bỏ ô "Macros" (tuần) của danh mục và tách Calories khỏi Macros như ảnh. */
export const OVERVIEW_GROUPS = NUTRIENT_GROUPS.flatMap((group) => {
  if (group.key !== 'macros') return [group]
  const find = (key: string) => group.nutrients.filter((nutrient) => nutrient.key === key)
  return [
    { ...group, key: 'calories', title: 'Calories', nutrients: find('calories') },
    {
      ...group,
      key: 'macros',
      title: 'Macros',
      nutrients: ['protein', 'fat', 'carbs'].flatMap(find),
    },
  ]
})

/** Lượng (null = chưa có dữ liệu chất đó, khác 0) và mục tiêu hiệu lực của một chất. */
export interface OverviewValue {
  readonly value: number | null
  readonly goal: NutrientGoal
}

export const UNKNOWN_OVERVIEW: OverviewValue = { value: null, goal: NO_GOAL }

/** Mục tiêu calo và macro của chương trình (chỉ có target; floor / ceiling không áp dụng). */
export function programGoals(target: ProgramWeek | null | undefined) {
  const only = (value: number | null | undefined): NutrientGoal => ({
    floor: null,
    target: value ?? null,
    ceiling: null,
  })
  return {
    calories: only(target?.caloriesTarget),
    protein: only(target?.proteinTarget),
    fat: only(target?.fatTarget),
    carbs: only(target?.carbsTarget),
  }
}

/**
 * Dự phòng khi BE chưa trả `GET /nutrition/overview`: chỉ những gì thật sự biết — calo, macro (và chất xơ) từ log hôm nay cùng mục tiêu của
 * chương trình. Mọi chất khác là chưa biết (không bịa mục tiêu mẫu, không điền 0).
 */
export function overviewFallback(
  totals: MacroTotals | null,
  target: ProgramWeek | null | undefined
): Record<string, OverviewValue> {
  const goals = programGoals(target)
  return {
    calories: { value: totals?.calories ?? null, goal: goals.calories },
    protein: { value: totals?.protein ?? null, goal: goals.protein },
    fat: { value: totals?.fat ?? null, goal: goals.fat },
    carbs: { value: totals?.carbs ?? null, goal: goals.carbs },
    fiber: { value: totals?.fiber ?? null, goal: NO_GOAL },
  }
}

/** Kết quả API → bảng giá trị: lượng và mục tiêu (floor / target / ceiling) đúng như BE trả, không trộn với số liệu khác. */
export function overviewFromItems(
  items: readonly NutritionOverviewItem[],
  fallback: Record<string, OverviewValue>
): Record<string, OverviewValue> {
  const values = { ...fallback }
  for (const item of items)
    values[item.key] = {
      value: item.value,
      goal: {
        floor: item.floor ?? null,
        target: item.target,
        ceiling: item.ceiling ?? null,
        goalKind: item.goalKind,
      },
    }
  return values
}

export interface Contributor {
  readonly name: string
  readonly value: number
}

const CONTRIBUTOR_KEYS = ['calories', 'protein', 'fat', 'carbs'] as const
export type ContributorKey = (typeof CONTRIBUTOR_KEYS)[number]

/** Ba món đóng góp nhiều nhất cho calo/macro trong ngày (gộp các dòng log cùng tên món). */
export function topContributors(entries: readonly FoodLogEntry[]) {
  const result = {} as Record<ContributorKey, Contributor[]>
  for (const key of CONTRIBUTOR_KEYS) {
    const sums = new Map<string, number>()
    for (const entry of entries)
      sums.set(entry.foodName, (sums.get(entry.foodName) ?? 0) + entry[key])
    result[key] = [...sums.entries()]
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
  }
  return result
}
