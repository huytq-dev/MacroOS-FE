// Khớp BE Contract/Models/Weights/WeightModels.cs
export interface WeightEntry {
  id: string
  logDate: string
  weightKg: number
  trendWeightKg: number | null
  notes: string | null
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
}
