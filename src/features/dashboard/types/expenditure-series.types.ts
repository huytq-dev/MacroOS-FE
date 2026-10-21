// Khớp BE GET /api/expenditure/series và GET /api/expenditure/insights (Docs/Design/Expenditure.md)

/** Calibrating và Holding đều vẽ ô vuông; chỉ Updating là vòng tròn. */
export type ExpenditureDayStatus = 'Calibrating' | 'Updating' | 'Holding'

export interface ExpenditureSeriesDay {
  /** yyyy-MM-dd; LIÊN TỤC từ ngày có dữ liệu đầu tới hôm nay (BE đã fill-forward). */
  date: string
  expenditureKcal: number
  fluxLowKcal: number
  fluxHighKcal: number
  status: ExpenditureDayStatus
  /** TDEE hôm nay − hôm qua (làm tròn); null ở ngày đầu. */
  changeKcal: number | null
}

export interface ExpenditureSeriesSummary {
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

export interface ExpenditureSeriesResponse {
  from: string
  to: string
  /** Tăng dần theo ngày; rỗng khi chưa có snapshot. */
  days: ExpenditureSeriesDay[]
  summary: ExpenditureSeriesSummary
  buckets?: { start: string; end: string; count: number; average: number }[] | null
}

export type ExpenditureChangeStatus = 'Decrease' | 'Increase' | 'NoChange' | 'Waiting'

export interface ExpenditureInsightsResponse {
  today: string
  firstDate: string | null
  currentKcal: number | null
  strategy: 'Calibrating' | 'Updating' | 'Holding' | null
  /** Câu giải thích khi Holding. */
  holdingReason: string | null
  holdingReasonCodes: ('MissingLogs' | 'NoRecentWeighIn')[]
  calibratingDaysLeft: number | null
  loggedDaysLast7: number
  weighInDaysLast7: number
  changes: {
    days: 3 | 7 | 14 | 30 | 90
    changeKcal: number | null
    status: ExpenditureChangeStatus
  }[]
}
