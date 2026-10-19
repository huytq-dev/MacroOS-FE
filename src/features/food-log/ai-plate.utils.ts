import type {
  AiDish,
  AiIngredient,
  IngredientState,
  MacroTotals,
  PlateItem,
  ResolvedIngredient,
} from './types/food-log.types'

/** Chỉnh sửa của user trên một nguyên liệu AI: đổi gram, xoá khỏi món, hoặc thay bằng món tự chọn (khi AI không tìm được). */
export interface IngredientEdit {
  readonly grams?: number
  readonly removed?: boolean
  readonly replacement?: ResolvedIngredient
}

export interface AiPlateEdits {
  readonly ingredients: Readonly<Record<string, IngredientEdit>>
  /** Hệ số "1 plate" của từng món (nhân gram mọi nguyên liệu của món). */
  readonly dishScales: Readonly<Record<string, number>>
}

export const EMPTY_AI_EDITS: AiPlateEdits = { ingredients: {}, dishScales: {} }

/** Nguyên liệu đã có số liệu (khớp / ước lượng / do user chọn) sau khi áp mọi chỉnh sửa. */
export interface LiveIngredient {
  readonly ingredient: AiIngredient
  readonly dishId: string
  readonly data: ResolvedIngredient
  /** Số liệu đã bị user đổi (gram, số món) so với kết quả resolve. */
  readonly replaced: boolean
}

/** Nhân mọi số đo của một kết quả resolve với `factor` (macro tỉ lệ thuận khối lượng). */
export const scaleResolved = (data: ResolvedIngredient, factor: number): ResolvedIngredient => ({
  ...data,
  quantity: data.quantity * factor,
  weightGrams: data.weightGrams * factor,
  calories: data.calories * factor,
  protein: data.protein * factor,
  fat: data.fat * factor,
  carbs: data.carbs * factor,
})

/** Kết quả resolve gốc của nguyên liệu (món user chọn thay thế ưu tiên hơn kết quả AI). */
export const baseDataOf = (
  state: IngredientState | undefined,
  edit: IngredientEdit | undefined
): ResolvedIngredient | null =>
  edit?.replacement ?? (state?.status === 'matched' ? state.data : null)

/** Các nguyên liệu còn sống (chưa xoá, đã có số liệu) kèm số liệu sau khi áp chỉnh sửa và hệ số của món. */
export function liveIngredients(
  dishes: readonly AiDish[],
  states: Readonly<Record<string, IngredientState>>,
  edits: AiPlateEdits
): LiveIngredient[] {
  return dishes.flatMap((dish) =>
    dish.ingredients.flatMap((ingredient) => {
      const edit = edits.ingredients[ingredient.id]
      const base = baseDataOf(states[ingredient.id], edit)
      if (!base || edit?.removed) return []
      const dishScale = edits.dishScales[dish.id] ?? 1
      const grams = edit?.grams ?? base.weightGrams
      const factor = base.weightGrams > 0 ? (grams * dishScale) / base.weightGrams : dishScale
      return [
        {
          ingredient,
          dishId: dish.id,
          data: factor === 1 ? base : scaleResolved(base, factor),
          replaced: factor !== 1 || Boolean(edit?.replacement),
        },
      ]
    })
  )
}

export const sumLive = (list: readonly LiveIngredient[]) => ({
  calories: list.reduce((sum, item) => sum + item.data.calories, 0),
  protein: list.reduce((sum, item) => sum + item.data.protein, 0),
  fat: list.reduce((sum, item) => sum + item.data.fat, 0),
  carbs: list.reduce((sum, item) => sum + item.data.carbs, 0),
  weightGrams: list.reduce((sum, item) => sum + item.data.weightGrams, 0),
})

export const totalsOf = (list: readonly LiveIngredient[]): MacroTotals => {
  const sum = sumLive(list)
  return { calories: sum.calories, protein: sum.protein, carbs: sum.carbs, fat: sum.fat, fiber: 0 }
}

/** Dòng plate từ một nguyên liệu: dùng cho Log Foods, thẻ Nutrition (POST plate/nutrients) và tổng ở thanh trên cùng. */
export const toPlateItem = ({ ingredient, data }: LiveIngredient, key: string): PlateItem => ({
  key,
  foodItemId: data.foodItemId,
  name: data.foodName ?? ingredient.name,
  foodServingId: data.servingId ?? null,
  servingLabel: data.unitLabel,
  quantity: Number(data.quantity.toFixed(2)),
  calories: data.calories,
  protein: data.protein,
  carbs: data.carbs,
  fat: data.fat,
  emoji: data.emoji,
  iconKey: data.iconKey ?? null,
  grams: data.weightGrams,
})
