// Khớp BE Contract/Models/Expenditure/ExpenditureModels.cs
export interface ExpenditurePoint {
  snapshotDate: string
  estimatedTdeeKcal: number
  status: string
  avgCaloriesConsumed: number
  weightChangeRateKgPerWeek: number | null
  windowDays: number
}

export interface ExpenditureSeries {
  current: ExpenditurePoint | null
  holdingReason: string | null
  expenditureStartDate: string | null
  points: ExpenditurePoint[]
}
