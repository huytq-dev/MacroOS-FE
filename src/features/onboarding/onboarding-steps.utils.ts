import { ageOn, trainingFromExperience } from './onboarding.utils'
import type { ProgramPreview, StepId, WizardAnswers } from './types/onboarding.types'
import type { CreateProgramRequest } from '@/features/program/types/program.types'

/** Các bước cần bản xem trước chương trình từ BE. */
export const PREVIEW_STEPS: readonly StepId[] = [
  'goalTarget',
  'goalSummary',
  'diet',
  'floor',
  'training',
  'distribution',
  'protein',
  'ready',
]

export const NEXT_LABEL: Partial<Record<StepId, string>> = {
  intro: 'Go to Basics',
  ready: 'Done',
  carousel: 'Continue',
  whatYouGet: 'Continue',
  plan: 'Start trial',
  first30: 'Continue',
}

interface ProceedContext {
  readonly stepId: StepId
  readonly answers: WizardAnswers
  readonly today: string
  readonly preview: ProgramPreview | undefined
  readonly readyReached: boolean
}

/** Bước hiện tại đã đủ điều kiện để bấm "Tiếp theo" chưa. */
export function canProceed({ stepId, answers, today, preview, readyReached }: ProceedContext) {
  switch (stepId) {
    case 'sex':
      return answers.gender !== null
    case 'birth':
      return answers.dateOfBirth !== null && ageOn(answers.dateOfBirth, today) >= 18
    case 'weightHistory':
      return answers.weighedMoreThanBefore !== null
    case 'weightTrend':
      return answers.recentWeightTrend !== null
    case 'exercise':
      return answers.exerciseSessions !== null
    case 'activity':
      return answers.dailyActivity !== null
    case 'lifting':
      return answers.liftingExperience !== null
    case 'cardio':
      return answers.cardioExperience !== null
    case 'goalType':
      return answers.goalType !== null
    case 'goalTarget':
      return (
        answers.targetWeightKg !== null &&
        (answers.goalType === 'WeightLoss'
          ? answers.targetWeightKg < answers.weightKg
          : answers.targetWeightKg > answers.weightKg)
      )
    case 'goalSummary':
      return preview !== undefined
    case 'diet':
      return answers.dietStyle !== null
    case 'floor':
      return answers.calorieFloor !== null && preview !== undefined
    case 'training':
      return answers.trainingType !== null
    case 'distribution':
      return (
        answers.shiftMode === 'Even' ||
        (answers.shiftDays.length >= 1 && answers.shiftDays.length <= 6)
      )
    case 'protein':
      return answers.proteinLevel !== null
    case 'ready':
      return readyReached && preview !== undefined
    default:
      return true
  }
}

/** Gom đáp án Goal/Program thành yêu cầu tạo program gửi BE. */
export function programRequestOf(
  answers: WizardAnswers,
  preview: ProgramPreview | undefined
): CreateProgramRequest {
  if (!preview || !answers.goalType) throw new Error('No program preview yet')
  const maintain = answers.goalType === 'Maintenance'
  const custom = answers.shiftMode === 'Custom'
  const floor = answers.calorieFloor
  return {
    goalType: answers.goalType,
    weeklyWeightChangeTargetPercent: maintain ? 0 : answers.weeklyRatePercent,
    programType: 'Coached',
    dietStyle: answers.dietStyle ?? 'Balanced',
    proteinLevel: answers.proteinLevel ?? 'Moderate',
    calorieFloorKcal:
      floor === 'Standard'
        ? preview.floorStandardKcal
        : floor === 'Low'
          ? preview.floorLowKcal
          : null,
    checkInWeekday: null,
    manualInitialTdeeKcal: answers.manualTdeeKcal,
    targetWeightKg: maintain ? null : answers.targetWeightKg,
    trainingType:
      answers.trainingType ??
      trainingFromExperience(answers.liftingExperience, answers.cardioExperience),
    calorieShiftMode: answers.shiftMode,
    calorieShiftDays: custom ? answers.shiftDays : null,
    calorieShiftPercent: custom ? answers.shiftPercent : null,
  }
}
