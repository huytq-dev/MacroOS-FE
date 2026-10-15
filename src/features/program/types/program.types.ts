import type { AdjustmentReason, DayOfWeek, DietStyle, GoalType, ProgramType, ProteinLevel } from '@/config/enums'

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
  isActive: boolean
  currentWeek: ProgramWeek | null
  weeks: ProgramWeek[]
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
