// Khớp BE /api/nutrition-data (Docs/Design/Nutrition_Data_Manager.md)
export type NutritionSource = 'App' | 'Manual'

export interface NutritionDay {
  /** yyyy-MM-dd. */
  date: string
  calories: number
  proteinG: number | null
  fatG: number | null
  carbsG: number | null
  source: NutritionSource
  /** Số món đang có trong ngày (App = có món trong Food Log, khoá kcal / macro / fasting). */
  entryCount: number
  /** Ngày nhịn ăn: kcal trống hoặc 0 vẫn tính là ngày 0 kcal cho expenditure, không làm đứt streak. */
  isFasting: boolean
  /** Ngày chưa log đủ: bị loại khỏi tính expenditure / xu hướng. */
  isIncomplete: boolean
}

export interface NutritionDaysResponse {
  /** Mới nhất trước. */
  items: NutritionDay[]
}

export interface SaveNutritionDayRequest {
  date: string
  calories: number | null
  proteinG: number | null
  fatG: number | null
  carbsG: number | null
  isFasting: boolean
  isIncomplete: boolean
}
