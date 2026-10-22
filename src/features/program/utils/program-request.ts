import type { DayOfWeek, GoalType } from '@/config/enums'
import type { PendingGoal } from '@/stores/goal-edit.store'
import type { ManualDay, WizardStore } from '@/stores/program-wizard.store'
import type { CreateProgramRequest, DayTarget, Program, ProgramSetup } from '../types/program.types'
import { toDayTarget, WEEK_DAYS } from './day-macros'

/** Goal đang chạy: wizard chỉ đổi program, giữ nguyên goal (hướng + tốc độ) và ngày check-in. */
export interface WizardGoal {
  readonly goalType: GoalType
  readonly weeklyWeightChangeTargetPercent: number
  readonly checkInWeekday: DayOfWeek
  /** Cân nặng đích của goal mới (chỉ có khi wizard mở từ Edit Goal đổi hướng). */
  readonly targetWeightKg?: number | null
}

/** Goal của wizard: goal mới đã chốt ở Edit Goal (khoá) nếu có, không thì goal của program hiện tại; chưa có gì thì giữ cân. */
export const wizardGoalOf = (
  program:
    | Pick<Program, 'goalType' | 'weeklyWeightChangeTargetPercent' | 'checkInWeekday'>
    | null
    | undefined,
  pending: PendingGoal | null,
  setup?: Pick<ProgramSetup, 'goal' | 'checkInWeekday'> | null
): WizardGoal => ({
  // BE trả goalType dạng chuỗi nhưng chỉ nhận các giá trị của GoalType nên ép kiểu an toàn
  goalType: (pending?.goalType ??
    program?.goalType ??
    setup?.goal?.goalType ??
    'Maintenance') as GoalType,
  weeklyWeightChangeTargetPercent: Math.abs(
    pending?.weeklyWeightChangeTargetPercent ??
      program?.weeklyWeightChangeTargetPercent ??
      setup?.goal?.weeklyRatePercent ??
      0
  ),
  checkInWeekday: program?.checkInWeekday ?? setup?.checkInWeekday ?? 'Monday',
  targetWeightKg: pending?.targetWeightKg ?? setup?.goal?.targetWeightKg ?? null,
})

type WizardChoices = Pick<
  WizardStore,
  | 'programType'
  | 'dietStyle'
  | 'floor'
  | 'trainingType'
  | 'distribution'
  | 'shiftDays'
  | 'shiftPercent'
  | 'proteinLevel'
  | 'days'
  | 'manualDays'
>

/** Mục tiêu theo ngày gửi BE: Collaborative = bảy ngày đã chỉnh; Manual = một bộ nhân bảy hoặc bảy bộ; Coached = BE tự tính. */
export const dayTargetsOf = (choices: WizardChoices, setup: ProgramSetup): DayTarget[] | null => {
  if (choices.programType === 'Collaborative' && choices.days)
    return choices.days.map((day) => toDayTarget(day, setup.weightKg, setup.proteinPerKgMax))
  if (choices.programType === 'Manual' && choices.manualDays?.length)
    return WEEK_DAYS.map((dayOfWeek, index) => {
      const day = choices.manualDays?.[index] ?? choices.manualDays?.[0]
      return {
        dayOfWeek,
        calories: Math.round(day?.kcal ?? 0),
        proteinG: Math.round(day?.proteinG ?? 0),
        carbsG: Math.round(day?.carbsG ?? 0),
        fatG: Math.round(day?.fatG ?? 0),
      }
    })
  return null
}

/**
 * Lựa chọn wizard → body của `POST /programs` và `POST /programs/preview`. `withDays = false` (preview lấy số mặc định cho editor)
 * bỏ mục tiêu theo ngày để BE tự đề xuất.
 */
export const buildProgramRequest = (
  choices: WizardChoices,
  goal: WizardGoal,
  setup: ProgramSetup,
  withDays = true
): CreateProgramRequest => {
  const manual = choices.programType === 'Manual'
  return {
    goalType: goal.goalType,
    weeklyWeightChangeTargetPercent:
      goal.goalType === 'Maintenance' ? 0 : goal.weeklyWeightChangeTargetPercent,
    programType: choices.programType ?? 'Coached',
    dietStyle: choices.dietStyle ?? 'Balanced',
    proteinLevel: choices.proteinLevel ?? 'Moderate',
    calorieFloorKcal: manual
      ? null
      : choices.floor === 'Low'
        ? setup.floors.lowKcal
        : setup.floors.standardKcal,
    checkInWeekday: goal.checkInWeekday,
    manualInitialTdeeKcal: null,
    targetWeightKg: goal.targetWeightKg ?? null,
    trainingType: manual ? null : choices.trainingType,
    calorieShiftMode: manual ? null : (choices.distribution ?? 'Even'),
    calorieShiftDays: choices.distribution === 'Custom' ? choices.shiftDays : null,
    calorieShiftPercent: choices.distribution === 'Custom' ? choices.shiftPercent : null,
    dayTargets: withDays ? dayTargetsOf(choices, setup) : null,
  }
}

/**
 * Bộ mục tiêu nhập tay ban đầu: ngày giữ cân đầu tiên BE trả trong `setup.defaults` (nguồn DUY NHẤT của số liệu; BE chia macro theo
 * quy tắc của nó). Chưa tải được setup hoặc BE không trả ngày nào thì trả null: FE KHÔNG tự dựng macro từ số bịa (TDEE 2000, 75 kg,
 * protein 1.8 g/kg, fat 25%) — nơi gọi phải chờ / thử lại / báo lỗi thay vì đi tiếp.
 */
export const defaultManualDay = (setup?: ProgramSetup | null): ManualDay | null => {
  const first = setup?.defaults?.[0]
  return first
    ? { kcal: first.calories, proteinG: first.proteinG, carbsG: first.carbsG, fatG: first.fatG }
    : null
}
