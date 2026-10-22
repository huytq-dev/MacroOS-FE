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
  /** null khi `rateReasonCode` khác null (chưa đủ cân thật / lâu không cân): hiện "Waiting", không bao giờ 0. */
  rateKgPerWeek: number | null
  /** null = đã tính; INSUFFICIENT_WEIGHT_DATA | STALE_WEIGHT_DATA (cùng cổng dữ liệu với Weight Trend Insights). */
  rateReasonCode?: 'INSUFFICIENT_WEIGHT_DATA' | 'STALE_WEIGHT_DATA' | null
}

/** Một ngày có cân và / hoặc % mỡ trong trang Habits (BE `WeighInDayModel`); `weightKg` null = ngày chỉ có % mỡ, không phải lần cân. */
export interface WeighInDay {
  date: string
  weightId: string | null
  weightKg: number | null
  trendWeightKg: number | null
  bodyFatId: string | null
  bodyFatPercent: number | null
  bodyFatMethod: string | null
}

// Khớp BE GET /api/weights/habit (WeighInHabitResponse): `days` chỉ có ngày có dữ liệu của năm / tháng đã chọn, các số còn lại là toàn thời gian
export interface WeighInHabit {
  year: number
  /** null = cả năm. */
  month: number | null
  days: WeighInDay[]
  weighInDaysInPeriod: number
  totalWeighIns: number
  /** Số ngày cân liên tiếp kết thúc hôm nay (hôm nay chưa cân thì tính tới hôm qua), toàn thời gian. */
  currentStreak: number
  longestStreak: number
  streakIncludesToday: boolean
  firstWeighInDate: string | null
  lastWeighInDate: string | null
  /** Hôm nay theo múi giờ của user. */
  today: string
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

// Khớp BE GET/POST/DELETE /api/body-metrics/measurements/{key} (MeasurementSeriesResponse, MeasurementEntryModel)
export interface MeasurementEntry {
  date: string
  valueCm: number
}

export interface MeasurementSeries {
  key: string
  group: string
  items: MeasurementEntry[]
  latestCm: number | null
}

export interface UpsertMeasurementRequest {
  date: string
  valueCm: number
}
