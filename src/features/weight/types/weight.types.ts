// Khớp BE Contract/Models/Weights/WeightModels.cs
export interface WeightEntry {
  id: string
  logDate: string
  weightKg: number
  trendWeightKg: number | null
  notes: string | null
  /** % mỡ đo bằng cân của đúng ngày đó (null nếu chưa có). */
  bodyFatPercent: number | null
}

export interface WeightEntries {
  items: WeightEntry[]
  latestWeightKg: number | null
  latestTrendKg: number | null
  rateKgPerWeek: number | null
}

// Khớp BE UpsertWeightEntryCommand
export interface UpsertWeightRequest {
  logDate: string | null
  weightKg: number
  notes: string | null
  /** Ghi/ghi đè % mỡ cân cùng ngày; bỏ trống = giữ nguyên. */
  bodyFatPercent?: number
  /** true (không kèm bodyFatPercent) = xoá % mỡ cân của ngày. */
  clearBodyFat?: boolean
}

// Khớp BE GET/POST/DELETE /api/body-metrics/visual-body-fat (tách khỏi % mỡ cân)
export interface VisualBodyFatEntry {
  id: string
  date: string
  percent: number
}

export interface VisualBodyFatEntries {
  items: VisualBodyFatEntry[]
  latestPercent: number | null
}

export interface UpsertVisualBodyFatRequest {
  date: string
  percent: number
}
