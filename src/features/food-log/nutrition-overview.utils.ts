import { NUTRIENT_GROUPS } from '@/features/dashboard/nutrient-catalog'
import type { NutrientDef, NutrientValue } from '@/features/dashboard/types/dashboard.types'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { FoodLogEntry, MacroTotals } from './types/food-log.types'

export const OVERVIEW_RANGES = ['today', 'week', 'month', 'quarter', 'year'] as const
export type OverviewRange = (typeof OVERVIEW_RANGES)[number]

export const OVERVIEW_RANGE_LABEL: Record<OverviewRange, string> = {
  today: 'Today',
  week: '1 Week',
  month: '1 Month',
  quarter: '3 Months',
  year: '1 Year',
}

/**
 * Mục tiêu mặc định theo ngày cho các chất BE chưa có (MacroFactor, người dùng mẫu); null = "No Target". Dùng tạm cho tới khi
 * BE trả `GET /nutrition/overview` (xem Docs/.../Food_Log/README.md). Calo và macro luôn lấy từ chương trình thật.
 */
const MOCK_TARGETS: Readonly<Record<string, number | null>> = {
  fiber: 40.3,
  netCarbs: null,
  starch: null,
  sugars: null,
  sugarsAdded: null,
  monounsaturated: null,
  polyunsaturated: null,
  omega3: 1.4,
  omega3Ala: 1.1,
  omega3Dha: 0.1,
  omega3Epa: 0.1,
  omega6: 12,
  saturated: 0,
  transFat: 0,
  cysteine: 0.7,
  histidine: 1.4,
  isoleucine: 2,
  leucine: 4.4,
  lysine: 4,
  methionine: 1.3,
  phenylalanine: 1.9,
  threonine: 2.1,
  tryptophan: 0.6,
  tyrosine: 1.6,
  valine: 2.5,
  b1: 1.1,
  b2: 1.6,
  b3: 14,
  b5: 5,
  b6: 1.6,
  b12: 4,
  folate: 400,
  vitaminA: 700,
  vitaminC: 95,
  vitaminD: 15,
  vitaminE: 15,
  vitaminK: 90,
  calcium: 1000,
  copper: 1.3,
  iron: 18,
  magnesium: 320,
  manganese: 3,
  phosphorus: 700,
  potassium: 3500,
  selenium: 70,
  sodium: 2000,
  zinc: 8,
  alcohol: null,
  caffeine: null,
  cholesterol: null,
  choline: 425,
  water: 2700,
}

/** Tên hiển thị khác với danh mục của trang Dinh dưỡng (theo MacroFactor Nutrition Overview). */
const NAME_OVERRIDE: Readonly<Record<string, string>> = {
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

/** Màu thanh của calo và bốn macro (bộ `--mf-tile-*`); các chất còn lại lấy màu nhóm. */
export const MACRO_BAR: Readonly<Record<string, string>> = {
  calories: 'bg-mf-tile-calories',
  protein: 'bg-mf-tile-protein',
  fat: 'bg-mf-tile-fat',
  carbs: 'bg-mf-tile-carbs',
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

/** Giá trị + mục tiêu của mọi chất: calo, macro, chất xơ từ log thật; chất còn lại 0 với mục tiêu mẫu. */
export function buildOverviewValues(
  totals: MacroTotals | null,
  target: ProgramWeek | null
): Record<string, NutrientValue> {
  const values: Record<string, NutrientValue> = {}
  for (const group of NUTRIENT_GROUPS)
    for (const nutrient of group.nutrients)
      values[nutrient.key] = { value: 0, target: MOCK_TARGETS[nutrient.key] ?? null }
  values.calories = { value: totals?.calories ?? 0, target: target?.caloriesTarget ?? null }
  values.protein = { value: totals?.protein ?? 0, target: target?.proteinTarget ?? null }
  values.fat = { value: totals?.fat ?? 0, target: target?.fatTarget ?? null }
  values.carbs = { value: totals?.carbs ?? 0, target: target?.carbsTarget ?? null }
  values.fiber = { value: totals?.fiber ?? 0, target: MOCK_TARGETS.fiber ?? null }
  return values
}

/** Ghép kết quả API lên bảng nền: giá trị lấy từ API; mục tiêu null thì giữ mục tiêu mẫu của nền (chất BE chưa đặt mục tiêu). */
export function mergeOverview(
  base: Record<string, NutrientValue>,
  items: readonly { key: string; value: number; target: number | null }[]
): Record<string, NutrientValue> {
  const merged = { ...base }
  for (const item of items)
    merged[item.key] = { value: item.value, target: item.target ?? base[item.key]?.target ?? null }
  return merged
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

export const formatAmount = (value: number, unit: NutrientDef['unit']) =>
  unit === 'kcal' || value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10)
