// Khớp BE GET /api/energy-balance/series và GET /api/energy-balance/insights (Docs/Design/Energy_Balance.md)

export type ExpenditureBalanceStatus = 'Deficit' | 'Surplus' | 'Balanced' | 'Waiting'
export type TargetBalanceStatus = 'BelowTarget' | 'AboveTarget' | 'OnTarget' | 'Waiting'

export interface EnergyBalanceSeriesDay {
  /** yyyy-MM-dd; LIÊN TỤC mọi ngày from..to (<= hôm nay). */
  date: string
  /** null = chưa log; nhịn ăn = 0. */
  caloriesKcal: number | null
  expenditureKcal: number | null
  /** Target CỦA NGÀY ĐÓ (không phải target hiện tại). */
  targetKcal: number | null
  /** calories − expenditure (âm = Deficit). */
  vsExpenditureKcal: number | null
  /** calories − target (âm = Below Target). */
  vsTargetKcal: number | null
  isFasting: boolean
  /** Có số nhưng KHÔNG tính vào trung bình / insights. */
  isIncomplete: boolean
}

export interface EnergyBalanceSeriesResponse {
  from: string
  to: string
  days: EnergyBalanceSeriesDay[]
}

export interface EnergyBalanceInsightRow<Status> {
  days: 3 | 7 | 14 | 30 | 90
  /** Trung bình mỗi ngày ĐÃ LOG trong cửa sổ N ngày kết thúc hôm nay. */
  avgKcal: number | null
  loggedDays: number
  status: Status
}

export interface EnergyBalanceInsightsResponse {
  today: string
  relativeToExpenditure: EnergyBalanceInsightRow<ExpenditureBalanceStatus>[]
  relativeToTargets: EnergyBalanceInsightRow<TargetBalanceStatus>[]
}
