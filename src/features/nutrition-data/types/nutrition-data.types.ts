// Khớp BE /api/nutrition-data, Contract v2 (BE/Docs/Design/Ops/NDM_Contract_V2_Examples.md, Docs/Design/Nutrition_Data_Manager.md)

/** Nguồn của số HIỆU LỰC của ngày do BE quyết (FE không suy ra từ số): Manual > FoodLog > Fasting. */
export type NutritionSource = 'Manual' | 'FoodLog' | 'Fasting'

/** Xung đột BE chỉ báo, không tự giải quyết: manual 0 kcal (không nhịn ăn) mà Food Log có món; nhịn ăn mà có số nhập tay > 0. */
export type NutritionConflict = 'MANUAL_ZERO_WITH_FOOD_LOG' | 'FASTING_WITH_MANUAL_NUTRITION'

export interface NutritionDay {
  /** yyyy-MM-dd (ngày địa phương đã lưu, không đổi múi giờ). */
  date: string
  /** Số HIỆU LỰC (override thắng Food Log). null = chưa biết (hiện "—"), KHÔNG phải 0; 0 là số user chủ động nhập hoặc ngày nhịn ăn. */
  calories: number | null
  proteinG: number | null
  fatG: number | null
  carbsG: number | null
  source: NutritionSource
  /** Ngày nhịn ăn: 0 kcal hợp lệ cho expenditure, không làm đứt streak. */
  isFasting: boolean
  /** Ngày chưa log đủ: bị loại khỏi tính expenditure / xu hướng. */
  isIncomplete: boolean
  /** Số món đang có trong ngày (Food Log). */
  entryCount: number
  /** Có tổng nhập tay (ít nhất một trong bốn trường khác null). */
  hasOverride: boolean
  /** Số user đã nhập (null = chưa nhập, 0 = nhập 0): điền sẵn cho Edit Day. */
  manualCaloriesKcal: number | null
  manualProteinG: number | null
  manualFatG: number | null
  manualCarbsG: number | null
  /** Tổng THÔ của các món Food Log (không đổi khi có override). */
  foodLogCalories: number
  foodLogProteinG: number
  foodLogFatG: number
  foodLogCarbsG: number
  /** BE quyết ngày này có được thuật toán (Expenditure / Energy Balance / check-in) dùng không: FE hiện đúng giá trị này, không tự suy ra từ calories = 0. */
  isValidForAlgorithms: boolean
  conflict: NutritionConflict | null
}

export interface NutritionDaysResponse {
  /** Mới nhất trước, mỗi ngày một dòng. */
  items: NutritionDay[]
  /** Còn ngày cũ hơn trang này. `limit` là kích thước TRANG, không phải giới hạn lịch sử. */
  hasMore: boolean
  /** Con trỏ cho trang kế (`before`, loại trừ); null khi hết. */
  nextBefore: string | null
}

/** Body `PUT /nutrition-data`: có ít nhất một trong bốn số → đặt override đúng các số gửi (bỏ trống = null); cờ không gửi (null) = giữ nguyên. */
export interface SaveNutritionDayRequest {
  date: string
  calories: number | null
  proteinG: number | null
  fatG: number | null
  carbsG: number | null
  isFasting: boolean | null
  isIncomplete: boolean | null
}
