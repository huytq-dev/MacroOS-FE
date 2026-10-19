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
  /** Mục tiêu từng ngày trong tuần (BE trả khi các ngày khác nhau); thiếu thì mọi ngày = currentWeek. */
  days?: DayTarget[]
  /** BE: đã tới ngày check-in và chưa check-in hôm nay → Strategy hiện nút Check In thay vòng đếm ngược. */
  checkInDue?: boolean
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

export type TrainingType = 'None' | 'Lifting' | 'Cardio' | 'Both'

/** Mục tiêu một ngày (calo + macro gram). `isLocked`: ngày khoá không bị check-in / Reset All Days đụng tới. */
export interface DayTarget {
  dayOfWeek: DayOfWeek
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  isLocked?: boolean
  /** Ngày nhịn ăn (BE hỗ trợ, wizard chưa dùng): calo hiệu lực = 0. */
  isFastingDay?: boolean
}

// Khớp BE GET /programs/setup: mọi số wizard New Program cần để vẽ và chặn nhập (FE không tự tính)
export interface ProgramSetup {
  weightKg: number
  estimatedTdeeKcal: number
  floors: { standardKcal: number; lowKcal: number }
  kcalMax: number
  proteinPerKgMax: number
  /** Bảy ngày giữ cân (Balanced, protein vừa) ở TDEE hiện tại: điểm xuất phát của Manual. */
  defaults: DayTarget[]
  /** Goal của program đang chạy (hoặc đã kết thúc gần nhất); null = chưa từng có program. */
  goal: { goalType: string; weeklyRatePercent: number; targetWeightKg: number | null } | null
  /** Ngày check-in của program (chưa có program = thứ của hôm nay). */
  checkInWeekday: DayOfWeek
}

// Khớp BE POST /programs/preview (không ghi DB): bảy ngày + số cho màn Review
export interface ProgramPreview {
  days: DayTarget[]
  averageCalories: number
  weeklyBudgetKcal: number
  averageProteinG: number
  averageCarbsG: number
  averageFatG: number
  macroKcalAverage: number
  estimatedTdeeKcal: number
  /** Suy ra từ calo trung bình so với TDEE: dương = tăng cân, âm = giảm. */
  weeklyChangeKg: number
  weeklyChangePercent: number
  projectedEndDate: string | null
  warnings: ProgramDraftWarning[]
}

/** MACRO_KCAL_MISMATCH (calo từ macro lệch quá 15% calo đã nhập) | BELOW_FLOOR (calo ngày thấp hơn sàn đã chọn). */
export interface ProgramDraftWarning {
  code: string
  dayOfWeek: DayOfWeek | null
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
  /** Collaborative / Manual: mục tiêu theo ngày (7 phần tử); bỏ trống = đồng nhất cả tuần. */
  dayTargets?: DayTarget[] | null
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
