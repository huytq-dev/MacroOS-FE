import { servingAmountLabel } from '@/features/foods/types/food.types'
import { roundTo } from '@/lib/units'
import { normalizeDecimal } from '@/lib/utils'
import type { PlateItem } from '../../../types/food-log.types'
import {
  gramsOf,
  parseQuantity,
  quantityOf,
  type QuantityUnit,
} from '../FoodDetail/food-detail.utils'

/** Lượng đang gõ cho một dòng plate: số (có thể là phân số "1 1/2"), đơn vị và khẩu phần đang chọn (chỉ khi unit = 'serving'). */
export interface PlateEdit {
  readonly text: string
  readonly unit: QuantityUnit
  readonly servingId: string | null
}

/** Chỉ sửa được lượng khi biết khối lượng của dòng (Quick Add / ước lượng AI không có thì bỏ qua). */
export const canEditItem = (item: PlateItem) => item.grams !== undefined && item.grams > 0

/** Lượng ban đầu của ô sửa: khẩu phần đã chọn khi thêm, hoặc gram. */
export function initialEdit(item: PlateItem): PlateEdit {
  const serving = item.foodServingId
    ? item.servings?.find((candidate) => candidate.id === item.foodServingId)
    : undefined
  return serving
    ? { text: String(item.quantity), unit: 'serving', servingId: serving.id }
    : { text: String(roundTo(item.grams ?? item.quantity, 1)), unit: 'g', servingId: null }
}

const servingOf = (item: PlateItem, edit: PlateEdit) =>
  edit.unit === 'serving'
    ? item.servings?.find((candidate) => candidate.id === edit.servingId)
    : undefined

/** Khối lượng (g) của lượng đang gõ; NaN khi chưa hợp lệ. */
export const editGrams = (item: PlateItem, edit: PlateEdit) =>
  gramsOf(parseQuantity(edit.text), edit.unit, servingOf(item, edit)?.weightInGrams ?? 0)

/**
 * Đổi đơn vị / khẩu phần giữ nguyên khối lượng (100 g ↔ 3.53 oz); gõ dở thì lấy khối lượng hiện tại của dòng.
 * Hai khẩu phần thật với nhau thì giữ số lượng (cỡ khác nên khối lượng đổi theo).
 */
export function switchUnit(
  item: PlateItem,
  edit: PlateEdit,
  unit: QuantityUnit,
  servingId: string | null = null
): PlateEdit {
  if (unit === 'serving' && edit.unit === 'serving') return { ...edit, servingId }
  const current = editGrams(item, edit)
  const mass = Number.isFinite(current) && current > 0 ? current : (item.grams ?? 0)
  const next = item.servings?.find((candidate) => candidate.id === servingId)
  return {
    text: String(roundTo(quantityOf(mass, unit, next?.weightInGrams ?? 0), 2)),
    unit,
    servingId: unit === 'serving' ? servingId : null,
  }
}

/** Dòng plate sau khi sửa (macro và mọi chất tỉ lệ theo khối lượng mới); null khi lượng chưa hợp lệ. */
export function applyEdit(item: PlateItem, edit: PlateEdit): PlateItem | null {
  const quantity = parseQuantity(edit.text)
  const serving = servingOf(item, edit)
  if (!item.grams || !Number.isFinite(quantity) || quantity <= 0) return null
  if (edit.unit === 'serving' && !serving) return null
  const grams = gramsOf(quantity, edit.unit, serving?.weightInGrams ?? 0)
  const logQuantity = roundTo(serving ? quantity : grams, 2) // BE lưu 2 số lẻ: "1/3" khẩu phần không gửi 0.3333…
  if (logQuantity < 0.01 || logQuantity > 10000) return null
  const ratio = grams / item.grams
  return {
    ...item,
    foodServingId: serving?.id ?? null,
    quantity: logQuantity,
    servingLabel: serving ? servingAmountLabel(quantity, serving.name) : `${roundTo(grams, 1)} g`,
    // Khối lượng thật, không làm tròn: lần sửa sau lấy tỉ lệ từ số này nên làm tròn 1 số lẻ sẽ lệch macro
    grams,
    calories: item.calories * ratio,
    protein: item.protein * ratio,
    carbs: item.carbs * ratio,
    fat: item.fat * ratio,
    nutrients: item.nutrients
      ? Object.fromEntries(
          Object.entries(item.nutrients).map(([key, value]) => [key, value * ratio])
        )
      : undefined,
  }
}

/** Chỉ nhận chữ số, "." và (khi đơn vị là khẩu phần) "/" và khoảng trắng cho phân số "1 1/2"; không cho hai khoảng trắng liền nhau. */
export const sanitizeQuantity = (raw: string, allowFraction: boolean) =>
  sanitizeText(normalizeDecimal(raw), allowFraction)

const sanitizeText = (text: string, allowFraction: boolean) =>
  (allowFraction ? text.replace(/[^0-9./ ]/g, '') : text.replace(/[^0-9.]/g, '')).replace(
    / {2,}/g,
    ' '
  )
