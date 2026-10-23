import type { GoalKind } from '@/features/nutrition/goal-progress'
import type { TargetProvenance } from '@/features/nutrition/target-provenance'

// Khớp BE Contract/Models/Expenditure/ExpenditureModels.cs
export interface ExpenditurePoint {
  snapshotDate: string
  estimatedTdeeKcal: number
  status: string
  avgCaloriesConsumed: number
  weightChangeRateKgPerWeek: number | null
  windowDays: number
  /** Dải flux (khoảng bất định của ước lượng); BE luôn gửi khoá, null khi chưa tính được. */
  fluxLowKcal: number | null
  fluxHighKcal: number | null
}

export interface ExpenditureSeries {
  current: ExpenditurePoint | null
  holdingReason: string | null
  expenditureStartDate: string | null
  points: ExpenditurePoint[]
}

// Khớp BE Contract/Models/Expenditure/DailyProgressModel.cs.
export interface DailyProgress {
  snapshotDate: string
  /** Ngày có FoodLog; false = chưa log (hiện "–" / N/A), khác với log 0 kcal. */
  isLogged: boolean
  caloriesConsumed: number
  caloriesTarget: number
  /** VERIFIED | LEGACY_UNVERIFIED | null (chưa có program phủ ngày): LEGACY_UNVERIFIED chỉ để tham khảo, KHÔNG dùng tính tỉ lệ đạt / streak / huy hiệu. */
  targetProvenance?: TargetProvenance | null
  proteinConsumed: number
  carbsConsumed: number
  fatConsumed: number
  trendWeightKg: number | null
  macroProgramWeekId: string | null
  /** TDEE ước lượng cùng ngày (Energy Balance chế độ Expenditure); null khi chưa có snapshot. */
  estimatedTdeeKcal: number | null
}

export interface NutrientDef {
  key: string
  name: string
  /** Danh mục luôn ghi calo là 'kcal' (đơn vị của BE); 'kJ' chỉ xuất hiện ở bản đã đổi sang đơn vị hiển thị của user (`displayAmount`). */
  unit: 'kcal' | 'kJ' | 'g' | 'mg' | 'mcg'
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
  goalKind: GoalKind
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
  lastPeriodDay?: string | null
  /** Ngày lịch từ ngày hành kinh đã đánh dấu gần nhất tới hôm nay; thiếu (BE cũ) hoặc null → "---". */
  daysSinceLastPeriodDay?: number | null
  /** Mọi ngày hành kinh trong khoảng (tăng dần, gồm kỳ bắt đầu trước from hoặc đang diễn ra). */
  days: string[]
  lastPeriodLengthDays: number | null
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
  goalKind: GoalKind
}

export interface NutrientsResponse {
  date: string
  items: NutrientModel[]
}

/** Một tuần của thác nước Goal Progress do BE tính (tuần = 7 ngày kể từ `startDate`, theo TREND): `trendKg` null = tuần không có cân. */
export interface GoalWeek {
  weekStart: string
  trendKg: number | null
  /** Chênh so với tuần trước có dữ liệu (tuần đầu so với cân lúc bắt đầu); âm = giảm. */
  deltaKg: number | null
}

// Khớp BE Contract/Models/Metrics/GoalProgressResponse.cs; trục cân nặng của BE là xu hướng (trend).
export interface GoalProgress {
  goalType: string
  startDate: string
  startWeightKg: number | null
  targetWeightKg: number | null
  currentTrendKg: number | null
  /** % quãng đường 0–100 (1 chữ số thập phân) do BE tính; null khi thiếu số hoặc không có cân mục tiêu (Maintenance): hiện "---", FE không tự tính. */
  progressPercent: number | null
  deviationKg: number | null
  /** Ngày BE ngoại suy từ tốc độ 14 ngày gần nhất; CHỈ có khi `estimatedCompletionStatus` = Estimated. FE không tự tính ETA. */
  estimatedCompletionDate: string | null
  /** Estimated | GoalAchieved (không có ngày) | Unavailable (xem `estimatedCompletionReasonCode`) | NotApplicable (Maintenance); thiếu = BE cũ. */
  estimatedCompletionStatus?: EstimatedCompletionStatus | null
  /** Khi Unavailable: lý do BE; còn lại null. */
  estimatedCompletionReasonCode?: string | null
  weeks: GoalWeek[]
}

export type EstimatedCompletionStatus =
  'Estimated' | 'GoalAchieved' | 'Unavailable' | 'NotApplicable'
