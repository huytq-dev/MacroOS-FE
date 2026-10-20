import { NUTRIENT_GROUPS } from '@/features/dashboard/nutrient-catalog'
import type { NutrientGroup } from '@/features/dashboard/types/dashboard.types'
import type { FoodDetail, NutrientAmount } from '@/features/foods/types/food.types'

export const OUNCE_GRAMS = 28.3495

export type QuantityUnit = 'serving' | 'g' | 'oz'

/** Nhập theo lượng (khẩu phần / g / oz) hoặc theo calo-macro muốn ăn (gõ 200 kcal thì lượng tự suy ra). */
export type EntryMode = 'amount' | 'macro'
export type MacroKey = 'calories' | 'protein' | 'fat' | 'carbs'
export const MACRO_KEYS: readonly MacroKey[] = ['calories', 'protein', 'fat', 'carbs']

/** Số gram của món cho đúng `amount` của một chất; null khi món không có chất đó (không suy ngược được). */
export const gramsForNutrient = (amount: number, per100g: number): number | null =>
  per100g > 0 ? (amount / per100g) * 100 : null

/** Số lượng người dùng gõ: "2", "0.5", ".5", "1/2", "1 1/2" → số; rỗng, gõ dở ("1/") hoặc mẫu số 0 thì NaN (không hợp lệ). */
export function parseQuantity(text: string): number {
  const value = text.trim()
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(value)
  if (mixed)
    return Number(mixed[3]) > 0 ? Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]) : NaN
  const fraction = /^(\d+)\/(\d+)$/.exec(value)
  if (fraction) return Number(fraction[2]) > 0 ? Number(fraction[1]) / Number(fraction[2]) : NaN
  return /^(\d+\.?\d*|\.\d+)$/.test(value) ? Number(value) : NaN
}

export const roundTo = (value: number, digits: number) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

const gramsPerUnit = (unit: QuantityUnit, servingGrams: number) =>
  unit === 'g' ? 1 : unit === 'oz' ? OUNCE_GRAMS : servingGrams

export const gramsOf = (quantity: number, unit: QuantityUnit, servingGrams: number) =>
  quantity * gramsPerUnit(unit, servingGrams)

export const quantityOf = (grams: number, unit: QuantityUnit, servingGrams: number) =>
  grams / gramsPerUnit(unit, servingGrams)

/** % calo đến từ mỗi macro (P×4, C×4, F×9 trên tổng); tổng bằng 0 thì cả ba là 0. */
export function macroShares(protein: number, carbs: number, fat: number) {
  const total = protein * 4 + carbs * 4 + fat * 9
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 }
  return {
    protein: Math.round(((protein * 4) / total) * 100),
    carbs: Math.round(((carbs * 4) / total) * 100),
    fat: Math.round(((fat * 9) / total) * 100),
  }
}

/** Lượng một chất trên 100 g theo khoá danh mục: bốn macro luôn lấy từ `nutrition`, còn lại từ `nutrientsPer100g` (null = chưa có dữ liệu). */
export function nutrientPer100g(food: FoodDetail, key: string): number | null {
  const macros: Record<string, number> = {
    calories: food.nutrition.caloriesPer100g,
    protein: food.nutrition.proteinPer100g,
    carbs: food.nutrition.carbsPer100g,
    fat: food.nutrition.fatPer100g,
  }
  return macros[key] ?? food.nutrientsPer100g?.[key] ?? null
}

/** Lượng mọi chất có dữ liệu của `grams` gam món (bỏ chất null): đi kèm dòng plate để bảng Your Plate cộng đủ chất. */
export function scaledNutrients(food: FoodDetail, grams: number): Record<string, number> {
  const result: Record<string, number> = {}
  for (const key of Object.keys(food.nutrientsPer100g ?? {})) {
    const per100g = nutrientPer100g(food, key)
    if (per100g !== null) result[key] = (per100g * grams) / 100
  }
  return result
}

/** Mục tiêu hiệu lực theo khoá danh mục: target, thiếu thì mức trần (sodium…) rồi mức sàn; không có gì thì null = "No Target". */
export function targetsByKey(items: readonly NutrientAmount[] | undefined) {
  const result: Record<string, number | null> = {}
  for (const item of items ?? [])
    if (item.key) result[item.key] = item.target ?? item.ceiling ?? item.floor ?? null
  return result
}

const MACRO_DEFS = NUTRIENT_GROUPS.find((group) => group.key === 'macros')?.nutrients ?? []
/** Dòng đứng đầu mỗi nhóm: tổng của chính nhóm đó (Carbs, Fat, Protein), nhóm Other mở đầu bằng Calories. */
const LEAD_KEY: Readonly<Record<string, string>> = {
  carb: 'carbs',
  fat: 'fat',
  protein: 'protein',
  other: 'calories',
}

/** Sáu nhóm của màn Food Detail theo danh mục dinh dưỡng, mỗi nhóm có thêm dòng tổng ở đầu. */
export const SECTION_GROUPS: readonly NutrientGroup[] = NUTRIENT_GROUPS.filter(
  (group) => group.key !== 'macros'
).map((group) => {
  const lead = MACRO_DEFS.find((nutrient) => nutrient.key === LEAD_KEY[group.key])
  return lead ? { ...group, nutrients: [lead, ...group.nutrients] } : group
})
