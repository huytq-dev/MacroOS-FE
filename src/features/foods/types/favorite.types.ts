import type { FoodCategory } from '@/config/enums'

// Khớp BE Contract/Models/Foods/FavoriteModels.cs
/** Preset yêu thích: món + khẩu phần + số lượng. foodServingId null thì quantity là gram. */
export interface FavoriteFood {
  id: string
  foodItemId: string
  foodName: string
  brand: string | null
  category: FoodCategory
  foodServingId: string | null
  servingName: string
  quantity: number
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  sortOrder: number
}

// Khớp BE AddFavoriteCommand
export interface AddFavoriteRequest {
  foodItemId: string
  foodServingId: string | null
  quantity: number
}
