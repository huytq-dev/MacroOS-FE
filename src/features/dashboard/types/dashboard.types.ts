import type { GoalKind } from '@/features/nutrition/goal-progress'

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

export interface NutrientDef {
  key: string
  name: string
  unit: 'kcal' | 'g' | 'mg' | 'mcg'
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
  /** Mục tiêu hiệu lực (xem `features/nutrition/goal-progress`): calo / macro chỉ có target, vi chất có thể có cả floor / ceiling. */
  floor: number | null
  target: number | null
  ceiling: number | null
  /** Loại mục tiêu BE phân loại (quyết định mốc nào được vẽ). */
  goalKind?: GoalKind | null
  /** false = BE chưa có dữ liệu chất này hôm nay (`amount` null): ô hiện "---" thay vì 0. Mặc định có. */
  known?: boolean
}

/** Một ngày của ô Macros: kcal của từng phần xếp chồng (carb dưới cùng, rồi fat, protein, phần còn lại của calo trên cùng). */
export interface MacroStackDay {
  readonly date: string
  readonly carbs: number
  readonly fat: number
  readonly protein: number
  readonly other: number
}

// Khớp BE GET /api/steps, GET /api/periods, GET /api/nutrients?date= (Docs/MacroFactor_UI/UI/Dashboard/README.md mục 5)
export interface StepsResponse {
  items: { id: string; logDate: string; steps: number; source: string }[]
  /** Trung bình 7 ngày gần nhất; null = chưa có bước chân nào. */
  last7DayAverage: number | null
}

export interface PeriodsResponse {
  items: {
    id: string
    startDate: string
    endDate: string | null
    cycleLengthDays: number | null
    periodLengthDays: number | null
    symptoms: string | null
    notes: string | null
  }[]
  lastStartDate: string | null
  daysSinceLastStart: number | null
}

export interface NutrientModel {
  code: string
  name: string
  unit: string
  group: string
  /** null = chưa có dữ liệu nutrient (hiện "---"), khác 0. */
  amount: number | null
  floor: number | null
  target: number | null
  ceiling: number | null
  goalKind?: GoalKind | null
}

export interface NutrientsResponse {
  date: string
  items: NutrientModel[]
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
