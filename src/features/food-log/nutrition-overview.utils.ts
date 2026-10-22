import { NUTRIENT_GROUPS } from '@/features/dashboard/nutrient-catalog'
import type { NutrientDef } from '@/features/dashboard/types/dashboard.types'
import { NO_GOAL, goalOfModel, type NutrientGoal } from '@/features/nutrition/goal-progress'
import { isUnverifiedTarget } from '@/features/nutrition/target-provenance'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { NutritionOverviewItem } from './types/food-log.types'

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
  /** BE: target hôm nay LEGACY_UNVERIFIED, hoặc kỳ dài có ngày bị loại khỏi trung bình target vì chưa xác minh → hiện "Historical target not verified". */
  readonly targetUnverified?: boolean
}

export const UNKNOWN_OVERVIEW: OverviewValue = { value: null, goal: NO_GOAL }

/** Mục tiêu calo và macro của chương trình (chỉ có target; floor / ceiling không áp dụng): loại Target khi có target, None khi chưa có, như BE. */
export function programGoals(target: ProgramWeek | null | undefined) {
  const only = (value: number | null | undefined): NutrientGoal => ({
    floor: null,
    target: value ?? null,
    ceiling: null,
    goalKind: value == null ? 'None' : 'Target',
  })
  return {
    calories: only(target?.caloriesTarget),
    protein: only(target?.proteinTarget),
    fat: only(target?.fatTarget),
    carbs: only(target?.carbsTarget),
  }
}

/** Kết quả API → bảng giá trị: lượng (null = chưa có dữ liệu chất đó) và mục tiêu (floor / target / ceiling / goalKind) đúng như BE trả, không trộn với số liệu khác. */
export function overviewFromItems(
  items: readonly NutritionOverviewItem[]
): Record<string, OverviewValue> {
  const values: Record<string, OverviewValue> = {}
  for (const item of items) {
    // Target hôm nay LEGACY_UNVERIFIED chỉ để tham khảo: không vẽ mốc / đạt – không đạt (goal trống); kỳ dài đã được BE loại ngày chưa xác minh khỏi trung bình target
    const unverifiedToday = isUnverifiedTarget(item.targetProvenance)
    values[item.key] = {
      value: item.value,
      goal: unverifiedToday ? NO_GOAL : goalOfModel(item),
      targetUnverified: unverifiedToday || (item.unverifiedTargetDays ?? 0) > 0,
    }
  }
  return values
}

export interface Contributor {
  readonly name: string
  readonly value: number
}

export type ContributorKey = 'calories' | 'protein' | 'fat' | 'carbs'
