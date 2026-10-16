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
  nutrition: FoodNutrition
  servings: FoodServing[]
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
  nutrition: FoodNutrition
  servings: FoodServingInput[] | null
}

/** Dinh dưỡng của một lượng gram (hiển thị trước khi log). */
export const scaleNutrition = (per100g: number, grams: number): number =>
  Math.round((per100g * grams) / 100)
