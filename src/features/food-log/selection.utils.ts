import { servingAmountLabel } from '@/features/foods/types/food.types'
import type { FoodLogEntry, MacroTotals, PlateItem } from './types/food-log.types'
import { nowClockIso } from '@/lib/date'

/** Dòng nhật ký → dòng plate (để dùng lại thẻ Nutrition / Create Recipe của plate): khoá là id entry, lượng và khẩu phần giữ nguyên. */
export const entryToPlateItem = (entry: FoodLogEntry): PlateItem => ({
  key: entry.id,
  foodItemId: entry.foodItemId,
  recipeId: entry.recipeId ?? undefined,
  name: entry.foodName,
  foodServingId: entry.foodServingId,
  servingLabel: entry.servingName
    ? servingAmountLabel(entry.quantity, entry.servingName)
    : `${entry.quantity} g`,
  quantity: entry.quantity,
  calories: entry.calories,
  protein: entry.protein,
  carbs: entry.carbs,
  fat: entry.fat,
  emoji: entry.emoji ?? null,
  iconKey: entry.iconKey ?? null,
  grams: entry.weightGrams ?? (entry.servingName ? undefined : entry.quantity),
})

/** Tổng calo / macro / chất xơ của các entry. */
export const totalsOfEntries = (entries: readonly FoodLogEntry[]): MacroTotals => ({
  calories: entries.reduce((sum, entry) => sum + entry.calories, 0),
  protein: entries.reduce((sum, entry) => sum + entry.protein, 0),
  carbs: entries.reduce((sum, entry) => sum + entry.carbs, 0),
  fat: entries.reduce((sum, entry) => sum + entry.fat, 0),
  fiber: entries.reduce((sum, entry) => sum + (entry.fiber ?? 0), 0),
})

/** "3 Foods" / "1 Food". */
export const foodsLabel = (count: number) => `${count} ${count === 1 ? 'Food' : 'Foods'}`

/** HH:mm:ss theo múi giờ hồ sơ lúc gọi (To Now); chỉ gọi trong sự kiện bấm. */
export const nowClock = nowClockIso
