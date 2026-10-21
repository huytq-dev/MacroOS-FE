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
  /** kg / tuần (hồi quy tuyến tính trend 21 ngày); null khi < 7 ngày dữ liệu. */
  weeklyChangeKg: number | null
  /** kcal / ngày, âm khi đang giảm; null khi < 7 ngày dữ liệu. */
  energyDeficitKcalPerDay: number | null
  projected30DaysKg: number | null
  trendDays: number
  kcalPerKg: number
}

export type WeightTrendGranularity = 'Day' | 'Week' | 'Month'
