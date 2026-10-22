// Khớp BE GET /api/weights/trend và GET /api/weights/trend/insights (Docs/Design/Weight_Trend.md)

export interface WeightTrendDay {
  /** yyyy-MM-dd; mỗi ngày liên tục từ lần cân đầu tới `to`. */
  date: string
  /** Trend EMA của ngày (có MỖI NGÀY). */
  trendKg: number
  /** Số cân thực; null ở ngày không cân. */
  scaleKg: number | null
  /** Trend hôm nay − trend hôm qua (2 chữ số); null ở ngày đầu tiên. */
  changeKg: number | null
}

export interface WeightTrendBucket {
  start: string
  end: string
  trendKg: number
  scaleKg: number | null
  days: number
  scaleCount: number
}

export interface WeightTrendSummary {
  from: string
  to: string
  count: number
  average: number | null
  difference: number | null
  first: number | null
  last: number | null
  min: number | null
  max: number | null
}

export interface WeightTrendResponse {
  trendDays: number
  alpha: number
  from: string
  to: string
  /** Tăng dần theo ngày. */
  days: WeightTrendDay[]
  /** Average / Difference THEO TREND của các ngày trong khoảng (header của trang). */
  summary: WeightTrendSummary
  /** Cùng dạng nhưng theo số cân thực. */
  scaleSummary: WeightTrendSummary
  /** Có khi `granularity` = Day | Week | Month: trung bình mỗi bucket cho cả hai đường. */
  buckets?: WeightTrendBucket[] | null
}

export type WeightChangeStatus = 'Decrease' | 'Increase' | 'NoChange' | 'Waiting'

export interface WeightTrendInsightsResponse {
  today: string
  firstWeighInDate: string | null
  dataDays: number
  /** Trend hôm nay. */
  currentWeightKg: number | null
  weightChanges: {
    days: 3 | 7 | 14 | 30 | 90
    changeKg: number | null
    status: WeightChangeStatus
  }[]
  /** kg / tuần (hồi quy tuyến tính trend 20 ngày); null khi `rateReasonCode` khác null. */
  weeklyChangeKg: number | null
  /** kcal / ngày, âm khi đang giảm; null khi `rateReasonCode` khác null. */
  energyDeficitKcalPerDay: number | null
  projected30DaysKg: number | null
  trendDays: number
  kcalPerKg: number
  /**
   * null = tốc độ / thâm hụt / dự báo đã tính. INSUFFICIENT_WEIGHT_DATA = chưa đủ ngày cân thật (< `minWeighIns` trong `rateWindowDays` ngày,
   * hoặc các lần cân cách nhau < `minSpanDays` ngày); STALE_WEIGHT_DATA = đủ lần cân nhưng không có lần nào trong `recencyDays` ngày gần nhất.
   * Khi khác null cả ba số trên đều null: FE hiện "Waiting" / "---", không bao giờ 0; trend và biểu đồ vẫn hợp lệ.
   */
  rateReasonCode?: WeightRateReason | null
  /** Số NGÀY cân thật khác nhau trong cửa sổ `rateWindowDays` (ngày nội suy không tính). */
  weighInCount?: number
  weighInsLast7Days?: number
  /** Số ngày từ lần cân cuối tới hôm nay; null = chưa có cân. */
  daysSinceLastWeighIn?: number | null
  /** Khoảng cách (ngày) giữa lần cân đầu và cuối trong cửa sổ. */
  weighInSpanDays?: number
  minWeighIns?: number
  rateWindowDays?: number
  recencyDays?: number
  minSpanDays?: number
}

export type WeightRateReason = 'INSUFFICIENT_WEIGHT_DATA' | 'STALE_WEIGHT_DATA'
