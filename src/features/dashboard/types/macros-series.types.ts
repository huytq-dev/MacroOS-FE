// Khớp BE GET /api/nutrients/macros/series (Contract/Models/Nutrients/MacroSeries*.cs, MacroAverages.cs)

/**
 * Một ngày của biểu đồ Macros. Ngày CHƯA log: `isLogged` false và mọi giá trị null (không cột). Ngày nhịn ăn: đã log, mọi giá trị 0. `otherKcal` là giá trị
 * THÔ CÓ DẤU (calo − P×4 − F×9 − C×4): có thể ÂM khi macro nhiều hơn calo (quick-add); FE quyết định cách vẽ.
 */
export interface MacroSeriesDay {
  date: string
  isLogged: boolean
  isFasting: boolean
  /** User đánh dấu log chưa đủ: vẫn có số nhưng BE không đưa vào summary / bucket. */
  isIncomplete: boolean
  caloriesKcal: number | null
  proteinG: number | null
  fatG: number | null
  carbsG: number | null
  proteinKcal: number | null
  fatKcal: number | null
  carbsKcal: number | null
  otherKcal: number | null
}

/** Trung bình MỖI NGÀY ĐÃ LOG (không chia cho số ngày lịch); `*Percent` = trung bình kcal phần đó ÷ trung bình kcal tổng × 100 (1 số lẻ), null khi không có ngày log hoặc kcal ≤ 0. */
export interface MacroAverages {
  caloriesKcal: number | null
  proteinG: number | null
  fatG: number | null
  carbsG: number | null
  proteinKcal: number | null
  fatKcal: number | null
  carbsKcal: number | null
  otherKcal: number | null
  proteinPercent: number | null
  fatPercent: number | null
  carbsPercent: number | null
  otherPercent: number | null
}

export interface MacroSeriesSummary {
  from: string
  to: string
  loggedDays: number
  calendarDays: number
  averages: MacroAverages
}

/** Chỉ có khi gửi `granularity`, và chỉ bucket chứa ít nhất một ngày đã log hợp lệ. */
export interface MacroSeriesBucket {
  start: string
  end: string
  loggedDays: number
  averages: MacroAverages
}

export interface MacroSeriesResponse {
  from: string
  to: string
  /** Liên tục, tăng dần theo ngày. */
  days: MacroSeriesDay[]
  summary: MacroSeriesSummary
  buckets: MacroSeriesBucket[]
}

export type MacroGranularity = 'Day' | 'Week' | 'Month'
