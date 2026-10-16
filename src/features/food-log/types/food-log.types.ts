import type { MealType } from '@/config/enums'
import type { ProgramWeek } from '@/features/program/types/program.types'

// Khớp BE Contract/Models/FoodLogs/FoodLogModels.cs
export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

/** quantity = số khẩu phần nếu có foodServingId, ngược lại là gram. */
export interface FoodLogEntry {
  id: string
  mealType: MealType
  eatenAt: string | null
  foodItemId: string | null
  recipeId: string | null
  foodName: string
  foodServingId: string | null
  servingName: string | null
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number | null
}

export interface DayLog {
  logDate: string
  notes: string | null
  totals: MacroTotals
  target: ProgramWeek | null
  entries: FoodLogEntry[]
}

// Khớp BE AddFoodLogEntryCommand
export interface AddEntryRequest {
  logDate: string
  mealType: MealType
  eatenAt: string | null
  foodItemId: string
  foodServingId: string | null
  quantity: number
}

// Khớp BE UpdateFoodLogEntryCommand
export interface UpdateEntryRequest {
  mealType: MealType
  eatenAt: string | null
  foodServingId: string | null
  quantity: number
}

// Khớp BE QuickAddCommand
export interface QuickAddRequest {
  logDate: string
  mealType: MealType
  eatenAt: string | null
  name: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
}

// Khớp BE CopyFoodLogCommand (mealType null = cả ngày)
export interface CopyRequest {
  fromDate: string
  toDate: string
  mealType: MealType | null
  toMealType: MealType | null
}

/** Món chờ trong plate trước khi log. */
export interface PlateItem {
  key: string
  foodItemId: string
  name: string
  foodServingId: string | null
  servingLabel: string
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
}
