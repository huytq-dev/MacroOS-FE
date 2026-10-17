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

// Khớp BE Contract/Models/Expenditure/ExpenditureModels.cs (DailyProgressModel).
// isLogged và estimatedTdeeKcal: BE sẽ bổ sung; chưa có thì FE suy ra (đã ăn > 0 = đã log, TDEE hiện tại).
export interface DailyProgress {
  snapshotDate: string
  caloriesConsumed: number
  caloriesTarget: number
  proteinConsumed: number
  carbsConsumed: number
  fatConsumed: number
  trendWeightKg: number | null
  macroProgramWeekId: string | null
  isLogged?: boolean
  estimatedTdeeKcal?: number | null
}

/** Cách vẽ thanh trên ô dinh dưỡng: target (đạt dần), floor (tối thiểu), ceiling (tối đa), none (không có thanh). */
export type TargetKind = 'target' | 'floor' | 'ceiling' | 'none'

export interface NutrientDef {
  key: string
  name: string
  unit: 'kcal' | 'g' | 'mg' | 'mcg'
  kind: TargetKind
  /** Kỳ hiển thị trên ô; mặc định "Hôm nay". */
  period?: string
}

export interface NutrientGroup {
  key: string
  title: string
  /** Lớp màu nền cho vùng thanh (vd. `bg-emerald-500`). */
  tone: string
  nutrients: NutrientDef[]
}

/** Dữ liệu một ô thanh tiến độ: giá trị hôm nay và target (null = chưa có). */
export interface NutrientValue {
  value: number
  target: number | null
}
