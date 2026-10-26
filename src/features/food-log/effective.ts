import type { EffectiveNutrition, MacroTotals, ShownTotals } from './types/food-log.types'

/**
 * Số của ngày để HIỆN: lấy NGUYÊN các trường hiệu lực của BE (`effective`), không tự cộng / trừ / điền (FE không có resolver thứ hai). Null của BE giữ null: macro chưa nhập
 * không thành 0, calories chưa biết không suy từ macro. BE chưa gửi `effective` (bản cũ) thì dùng tổng thô `totals` như trước. `fiber` là vi chất nên luôn từ các món.
 */
export function shownTotals(day: {
  readonly totals: MacroTotals
  readonly effective?: EffectiveNutrition | null
}): ShownTotals {
  const effective = day.effective
  if (!effective) return day.totals
  return {
    calories: effective.calories,
    protein: effective.proteinG,
    carbs: effective.carbsG,
    fat: effective.fatG,
    fiber: day.totals.fiber,
  }
}

export type MacroKey = 'calories' | 'protein' | 'fat' | 'carbs'

/**
 * Thẻ macro của Plate | Day (D1): lấy NGUYÊN `effective` của BE trong `plate/nutrients` (ngày hiệu lực sau khi log plate: override thắng, null giữ null, không có override
 * thì là món + plate). `foodLog` = tổng Food Log thô của BE (đã gồm plate); `overridden` = hiện thêm dòng "Food Log … incl. Plate". `plate` là số của riêng plate (xem trước). Không
 * có `effective` (BE cũ, hoặc ngày chưa có dữ liệu và plate trống) thì null: màn dùng hàng `day` thô như trước. FE không tự cộng / trừ gì.
 */
export function dayBreakdown(
  effective: EffectiveNutrition | null | undefined,
  key: MacroKey,
  plate: number
): {
  readonly main: number | null
  readonly foodLog: number
  readonly plate: number
  readonly overridden: boolean
} | null {
  if (!effective) return null
  const pair: Record<MacroKey, readonly [number | null, number]> = {
    calories: [effective.calories, effective.foodLogCalories],
    protein: [effective.proteinG, effective.foodLogProteinG],
    fat: [effective.fatG, effective.foodLogFatG],
    carbs: [effective.carbsG, effective.foodLogCarbsG],
  }
  const [main, foodLog] = pair[key]
  return { main, foodLog, plate, overridden: effective.hasOverride }
}

/**
 * Dòng chú thích nhỏ cho ngày CÓ override (BE `hasOverride`): số đang hiện là số nhập tay (thắng Food Log), kèm tổng các món đã log nếu có. null khi không có override
 * (số hiện là của các món hoặc ngày nhịn ăn). `kcalText` đã theo đơn vị của user; FE không tự tính tổng nào.
 */
export function overrideCaption(
  effective: EffectiveNutrition | null | undefined,
  entryCount: number,
  kcalText: (kcal: number) => string
): string | null {
  if (!effective?.hasOverride) return null
  return entryCount > 0
    ? `Manual entry · Food Log ${kcalText(effective.foodLogCalories)}`
    : 'Manual entry'
}
