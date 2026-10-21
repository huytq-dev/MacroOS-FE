import type { GoalKind } from '@/features/nutrition/goal-progress'
import type { FoodCategory, FoodScope } from '@/config/enums'

// Khớp BE Contract/Models/Foods/FoodModels.cs
export interface FoodNutrition {
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g?: number | null
  sugarPer100g?: number | null
  sodiumPer100g?: number | null
}

export interface FoodServing {
  id: string
  servingName: string
  /** Nhãn chip khẩu phần = `servingName` bỏ "1 " đầu (vd `large - 3 1/4" diameter`); BE cũ chưa có thì suy từ `servingName`. */
  label?: string
  weightInGrams: number
  isDefault: boolean
}

export interface FoodSummary {
  id: string
  name: string
  brand: string | null
  category: FoodCategory
  source: string
  isVerified: boolean
  isMine: boolean
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  /** Khẩu phần mặc định (BE luôn trả; không có thì "100 g"); defaultServingId null khi món chưa có khẩu phần. */
  defaultServingId: string | null
  defaultServingName: string
  defaultServingGrams: number
  /** Lần log gần nhất của người dùng hiện tại; null nếu chưa từng log món này. */
  lastLoggedAt: string | null
  /** Emoji đại diện món (BE suy từ nhóm món); null hoặc thiếu thì hiện 🍽️. */
  emoji?: string | null
  /** Khoá icon trong bộ icon món ăn (BE sẽ trả); có thì thay emoji bằng ảnh (xem `FoodIcon`). */
  iconKey?: string | null
}

export interface FoodDetail {
  id: string
  name: string
  brand: string | null
  barcode: string | null
  category: FoodCategory
  source: string
  isVerified: boolean
  isMine: boolean
  imageUrl: string | null
  /** Emoji đại diện món (BE sẽ thêm vào chi tiết món); thiếu thì hiện 🍽️. */
  emoji?: string | null
  /** Khoá icon trong bộ icon món ăn (BE sẽ trả). */
  iconKey?: string | null
  nutrition: FoodNutrition
  /** Mọi chất trên 100 g theo khoá danh mục dinh dưỡng của FE (đơn vị theo danh mục); null = chưa có dữ liệu, 0 = biết bằng 0. */
  nutrientsPer100g?: Record<string, number | null>
  servings: FoodServing[]
  /** Gram trên mỗi ml (món lỏng hoặc suy từ khẩu phần cup / tbsp…): có thì bật chip ml, cup, tbsp, tsp, fl oz; null / thiếu = chưa biết. */
  gramsPerMl?: number | null
}

// Khớp BE NutrientAmountModel / FoodNutrientsResponse (GET /foods/{id}/nutrients): target hiệu lực của ngày hỏi
export interface NutrientAmount {
  code: string
  name: string
  unit: string
  group: string
  displayOrder: number
  displayPrecision: number
  /** null = chưa có dữ liệu (khác 0). */
  amount: number | null
  floor: number | null
  target: number | null
  ceiling: number | null
  /** Loại mục tiêu BE phân loại; quyết định mốc nào được vẽ. */
  goalKind?: GoalKind | null
  percentOfTarget: number | null
  isCore: boolean
  /** Khoá của danh mục dinh dưỡng FE; null với chất không thuộc danh mục. */
  key: string | null
}

export interface FoodNutrientsResponse {
  foodItemId: string
  foodName: string
  servingId: string | null
  servingName: string
  quantity: number
  grams: number
  date: string
  items: NutrientAmount[]
}

// Khớp BE SearchFoodsQuery
export interface FoodSearchParams {
  search?: string
  category?: FoodCategory
  scope?: FoodScope
  top?: number
  skip?: number
}

// Khớp BE CreateCustomFoodCommand / UpdateCustomFoodCommand
export interface FoodServingInput {
  servingName: string
  weightInGrams: number
  isDefault: boolean
}

export interface CustomFoodRequest {
  name: string
  brand: string | null
  category: FoodCategory
  barcode: string | null
  /** Khoá icon trong bộ icon món ăn (tuỳ chọn); null/thiếu = BE tự gán theo tên món. */
  iconKey?: string | null
  nutrition: FoodNutrition
  /** Các chất ngoài 4 macro (trên 100 g, theo mã chất của BE); thiếu = chỉ dùng `nutrition`. */
  nutrients?: { code: string; amountPer100g: number }[] | null
  servings: FoodServingInput[] | null
}

/** Nhãn lượng ăn: tên khẩu phần đã có số ("1 lát") nên 1 khẩu phần chỉ hiện tên, nhiều hơn thì "2 × 1 lát". */
export const servingAmountLabel = (quantity: number, servingName: string): string =>
  quantity === 1 ? servingName : `${quantity} × ${servingName}`

/** Dinh dưỡng của một lượng gram (hiển thị trước khi log). */
export const scaleNutrition = (per100g: number, grams: number): number =>
  Math.round((per100g * grams) / 100)
