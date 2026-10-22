import type { FoodDetail, FoodServing } from '@/features/foods/types/food.types'
import { GRAMS_PER_OUNCE, GRAMS_PER_POUND, roundTo } from '@/lib/units'
import { parseQuantity } from './components/FoodLogPage/FoodDetail/food-detail.utils'

/** Gram của một đơn vị khối lượng / thể tích chuẩn (thể tích cần `gramsPerMl` của món). */
const GRAMS = { g: 1, oz: GRAMS_PER_OUNCE, lb: GRAMS_PER_POUND } as const
const ML = { ml: 1, tsp: 4.92892, tbsp: 14.7868, floz: 29.5735, cup: 236.588 } as const

export interface IngredientUnit {
  /** g | oz | lb | ml | tsp | tbsp | floz | cup hoặc `serving:<id>`. */
  readonly id: string
  readonly label: string
  readonly gramsPerUnit: number
  /** Có = khẩu phần của món (gửi BE kèm foodServingId); không = đơn vị khối lượng / thể tích (BE nhận số gram, foodServingId null). */
  readonly servingId: string | null
}

/** Nhãn chip khẩu phần: BE trả `label`, thiếu thì bỏ "1 " đầu của `servingName` ("1 large - 3 1/4\" diameter" → "large - 3 1/4\" diameter"). */
export const servingLabel = (serving: FoodServing) =>
  serving.label ?? serving.servingName.replace(/^1\s+/, '')

/**
 * Mọi đơn vị nhập được của một nguyên liệu, theo thứ tự chip MacroFactor: g, oz | các khẩu phần của món | tbsp, tsp, fl oz, cup, ml
 * (chỉ khi biết gram mỗi ml) | lb.
 */
export function unitsOf(food: Pick<FoodDetail, 'servings' | 'gramsPerMl'>): IngredientUnit[] {
  const mass = (id: keyof typeof GRAMS): IngredientUnit => ({
    id,
    label: id,
    gramsPerUnit: GRAMS[id],
    servingId: null,
  })
  const density = food.gramsPerMl && food.gramsPerMl > 0 ? food.gramsPerMl : null
  const volume = (id: keyof typeof ML, label: string): IngredientUnit => ({
    id,
    label,
    gramsPerUnit: ML[id] * (density ?? 0),
    servingId: null,
  })
  return [
    mass('g'),
    mass('oz'),
    ...food.servings
      // "g" (1 g) đã có chip khối lượng ở đầu hàng
      .filter((serving) => serving.weightInGrams > 0 && servingLabel(serving) !== 'g')
      .map((serving): IngredientUnit => ({
        id: `serving:${serving.id}`,
        label: servingLabel(serving),
        gramsPerUnit: serving.weightInGrams,
        servingId: serving.id,
      })),
    ...(density
      ? [
          volume('tbsp', 'tbsp'),
          volume('tsp', 'tsp'),
          volume('floz', 'fl oz'),
          volume('cup', 'cup'),
          volume('ml', 'ml'),
        ]
      : []),
    mass('lb'),
  ]
}

/** Khối lượng (g) của lượng đang gõ ("1 1/2" hợp lệ); NaN khi chưa hợp lệ. */
export const gramsOfText = (text: string, unit: IngredientUnit) =>
  parseQuantity(text) * unit.gramsPerUnit

/** Đổi đơn vị giữ nguyên khối lượng (100 g ↔ 3.53 oz); lượng đang gõ dở / rỗng thì lấy khối lượng gần nhất `fallbackGrams`. */
export function switchIngredientUnit(
  text: string,
  from: IngredientUnit,
  to: IngredientUnit,
  fallbackGrams: number
): string {
  const current = gramsOfText(text, from)
  const grams = Number.isFinite(current) && current > 0 ? current : fallbackGrams
  return String(roundTo(grams / to.gramsPerUnit, 2))
}

/** Dòng gửi BE: khẩu phần thì (foodServingId + số khẩu phần), đơn vị khối lượng / thể tích thì (null + số gram). */
export function requestLineOf(text: string, unit: IngredientUnit) {
  const quantity = parseQuantity(text)
  if (unit.servingId) return { foodServingId: unit.servingId, quantity: roundTo(quantity, 4) }
  return { foodServingId: null, quantity: roundTo(quantity * unit.gramsPerUnit, 2) }
}
