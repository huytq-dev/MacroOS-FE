import type {
  AdjustmentReason,
  DayOfWeek,
  DietStyle,
  GoalType,
  ProgramType,
  ProteinLevel,
} from '@/config/enums'

// Khớp BE Contract/Models/Programs/ProgramModels.cs
export interface ProgramWeek {
  id: string
  effectiveFrom: string
  caloriesTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
  adjustmentReason: AdjustmentReason
  previousCaloriesTarget: number | null
}

export interface Program {
  id: string
  programType: ProgramType
  goalType: GoalType
  dietStyle: DietStyle
  weeklyWeightChangeTargetPercent: number
  weeklyWeightChangeTargetKg: number
  proteinLevel: ProteinLevel
  proteinGPerKgBodyweight: number
  fixedProteinGrams: number | null
  calorieFloorKcal: number | null
  checkInWeekday: DayOfWeek
  startDate: string
  expenditureStartDate: string
  manualInitialTdeeKcal: number | null
  /** Cân mục tiêu của goal đang chạy; null = chưa đặt. */
  targetWeightKg: number | null
  /** Số ngày tới check-in kế tiếp (0 = hôm nay hoặc quá hạn); null = program Manual không có check-in. */
  checkInDueInDays: number | null
  isActive: boolean
  currentWeek: ProgramWeek | null
  weeks: ProgramWeek[]
}

/** active = đang chạy; Achieved = đạt mục tiêu; Superseded = bị goal mới thay; Cancelled = huỷ. */
export type GoalStatus = 'Active' | 'Achieved' | 'Superseded' | 'Cancelled'

/** Một goal trong lịch sử, `GET /goals/history` (mới nhất trước). `endDate` null = đang chạy; `ratePerWeekKg` âm = giảm. */
export interface GoalHistoryItem {
  id: string
  goalType: GoalType
  targetWeightKg: number | null
  startWeightKg: number | null
  ratePerWeekKg: number | null
  startDate: string
  endDate: string | null
  status: GoalStatus
}

// Khớp BE CreateProgramCommand
export interface CreateProgramRequest {
  goalType: GoalType
  weeklyWeightChangeTargetPercent: number
  programType: ProgramType
  dietStyle: DietStyle
  proteinLevel: ProteinLevel
  calorieFloorKcal: number | null
  checkInWeekday: DayOfWeek | null
  manualInitialTdeeKcal: number | null
  // Wizard thiết lập: cân mục tiêu, loại tập, kiểu phân bổ kcal trong tuần (Custom = dồn vào các ngày chọn)
  targetWeightKg?: number | null
  trainingType?: 'None' | 'Lifting' | 'Cardio' | 'Both' | null
  calorieShiftMode?: 'Even' | 'Custom' | null
  calorieShiftDays?: DayOfWeek[] | null
  calorieShiftPercent?: number | null
}

// Khớp BE UpdateProgramGoalCommand (null = giữ nguyên)
export interface UpdateProgramGoalRequest {
  goalType?: GoalType | null
  weeklyWeightChangeTargetPercent?: number | null
  dietStyle?: DietStyle | null
  proteinLevel?: ProteinLevel | null
  fixedProteinGrams?: number | null
  calorieFloorKcal?: number | null
  checkInWeekday?: DayOfWeek | null
}
