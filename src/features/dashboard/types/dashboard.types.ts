// Khớp BE Contract/Models/Expenditure/ExpenditureModels.cs
export interface ExpenditurePoint {
  snapshotDate: string
  estimatedTdeeKcal: number
  status: string
  avgCaloriesConsumed: number
  weightChangeRateKgPerWeek: number | null
  windowDays: number
  /** Dải flux (BE sẽ bổ sung); chưa có thì FE tự ước. */
  fluxLowKcal?: number | null
  fluxHighKcal?: number | null
}

/** Trạng thái điểm: Updating = đang cập nhật (vòng tròn); Holding/Calibrating = số không đang cập nhật (ô vuông). */
export type ExpenditureStatus = 'Calibrating' | 'Updating' | 'Holding'

export interface ExpenditureChange {
  days: number
  /** null khi Waiting (chưa có điểm ở mốc đó hoặc mốc trước ngày bắt đầu theo dõi). */
  deltaKcal: number | null
  status: 'Ready' | 'Waiting'
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

// Khớp BE Contract/Models/Metrics/MetricsModels.cs (GoalProgressResponse); trục cân nặng của BE là xu hướng (trend).
export interface GoalProgress {
  goalType: string
  startDate: string
  startWeightKg: number | null
  targetWeightKg: number | null
  currentTrendKg: number | null
  progressPercent: number | null
  deviationKg: number | null
  estimatedCompletionDate: string | null
}
