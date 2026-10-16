import type {
  ExperienceLevel,
  OnboardingState,
  PreviewRequest,
  SaveBasicsRequest,
  StepId,
  TrainingType,
  WizardAnswers,
} from './types/onboarding.types'
import { STEP_ORDER } from './types/onboarding.types'

export const DEFAULT_DATE_OF_BIRTH = '1995-06-15'
const DEFAULT_HEIGHT_CM = 170
const DEFAULT_WEIGHT_KG = 70

/** Loại tập suy ra từ kinh nghiệm tạ/cardio (khớp OnboardingCalculator.TrainingFrom ở BE). */
export const trainingFromExperience = (
  lifting: ExperienceLevel | null,
  cardio: ExperienceLevel | null
): TrainingType => {
  const lifts = lifting !== null && lifting !== 'None'
  const runs = cardio !== null && cardio !== 'None'
  if (lifts && runs) return 'Both'
  if (lifts) return 'Lifting'
  if (runs) return 'Cardio'
  return 'None'
}

/** Đáp án khởi tạo của wizard: lấy lại những gì đã lưu ở BE để người dùng không phải trả lời lại. */
export const initialAnswers = (state: OnboardingState): WizardAnswers => ({
  gender: state.gender,
  dateOfBirth: state.dateOfBirth ?? DEFAULT_DATE_OF_BIRTH,
  heightCm: state.heightCm ?? DEFAULT_HEIGHT_CM,
  weightKg: state.weightKg ?? DEFAULT_WEIGHT_KG,
  unit: state.unitPreference,
  weighedMoreThanBefore: state.weighedMoreThanBefore,
  recentWeightTrend: state.recentWeightTrend,
  bodyFat: state.bodyFat,
  exerciseSessions: state.exerciseSessions,
  dailyActivity: state.dailyActivity,
  liftingExperience: state.liftingExperience,
  cardioExperience: state.cardioExperience,
  referralSource: null,
  affiliateCode: '',
  manualTdeeKcal: null,
  goalType: null,
  targetWeightKg: null,
  weeklyRatePercent: 0.5,
  dietStyle: null,
  calorieFloor: null,
  trainingType: null,
  shiftMode: 'Even',
  shiftDays: [],
  shiftPercent: 10,
  proteinLevel: null,
})

/**
 * Bước mở đầu: đã có program thì chỉ còn đồng ý điều khoản; đang dở Basics thì vào bước kế tiếp
 * (BE nhớ số thứ tự bước đã lưu); chưa bắt đầu thì màn giới thiệu.
 */
export const initialStepOf = (state: OnboardingState): StepId => {
  if (state.hasProgram) return 'consent'
  if (state.state !== 'InProgress') return 'intro'
  const resume = Math.min(state.step + 1, STEP_ORDER.indexOf('goalType'))
  return STEP_ORDER[Math.max(resume, 1)]
}

/** Dữ liệu lưu BE sau mỗi bước Basics; null = bước đó không lưu (giới thiệu, trò chuyện, giá trị). */
export const basicsPayload = (stepId: StepId, answers: WizardAnswers): SaveBasicsRequest | null => {
  const step = STEP_ORDER.indexOf(stepId)
  switch (stepId) {
    case 'sex':
      return answers.gender ? { step, gender: answers.gender } : null
    case 'birth':
      return answers.dateOfBirth ? { step, dateOfBirth: answers.dateOfBirth } : null
    case 'height':
      return { step, heightCm: answers.heightCm, unitPreference: answers.unit }
    case 'weight':
      return { step, weightKg: answers.weightKg, unitPreference: answers.unit }
    case 'weightHistory':
      return answers.weighedMoreThanBefore
        ? { step, weighedMoreThanBefore: answers.weighedMoreThanBefore }
        : null
    case 'weightTrend':
      return answers.recentWeightTrend
        ? { step, recentWeightTrend: answers.recentWeightTrend }
        : null
    case 'bodyFat':
      return answers.bodyFat ? { step, bodyFat: answers.bodyFat } : null
    case 'exercise':
      return answers.exerciseSessions ? { step, exerciseSessions: answers.exerciseSessions } : null
    case 'activity':
      return answers.dailyActivity ? { step, dailyActivity: answers.dailyActivity } : null
    case 'lifting':
      return answers.liftingExperience
        ? { step, liftingExperience: answers.liftingExperience }
        : null
    case 'cardio':
      return answers.cardioExperience ? { step, cardioExperience: answers.cardioExperience } : null
    case 'referral':
      return {
        step,
        ...(answers.referralSource ? { referralSource: answers.referralSource } : {}),
        ...(answers.referralSource === 'Affiliate' && answers.affiliateCode.trim()
          ? { affiliateCode: answers.affiliateCode.trim() }
          : {}),
      }
    default:
      return null
  }
}

/** Yêu cầu xem trước từ đáp án hiện có; các lựa chọn Program chưa trả lời dùng giá trị mặc định để màn Goal đã có số. */
export const previewRequestOf = (answers: WizardAnswers): PreviewRequest | null => {
  if (!answers.goalType) return null
  const maintain = answers.goalType === 'Maintenance'
  const custom = answers.shiftMode === 'Custom'
  return {
    goalType: answers.goalType,
    targetWeightKg: maintain ? null : answers.targetWeightKg,
    weeklyRatePercent: maintain ? 0 : answers.weeklyRatePercent,
    dietStyle: answers.dietStyle ?? 'Balanced',
    proteinLevel: answers.proteinLevel ?? 'Moderate',
    calorieFloor: answers.calorieFloor ?? 'Standard',
    trainingType:
      answers.trainingType ??
      trainingFromExperience(answers.liftingExperience, answers.cardioExperience),
    shiftMode: answers.shiftMode,
    shiftDays: custom ? answers.shiftDays : null,
    shiftPercent: custom ? answers.shiftPercent : null,
    manualTdeeKcal: answers.manualTdeeKcal,
  }
}

/** Tuổi tại ngày `todayIso` (cả hai dạng yyyy-MM-dd). */
export const ageOn = (birthIso: string, todayIso: string): number => {
  const [birthYear, birthMonth, birthDay] = birthIso.split('-').map(Number)
  const [year, month, day] = todayIso.split('-').map(Number)
  return year - birthYear - (month < birthMonth || (month === birthMonth && day < birthDay) ? 1 : 0)
}
