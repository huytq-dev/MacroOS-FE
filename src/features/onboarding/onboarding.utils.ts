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
import { roundTo } from '@/lib/units'

/** Giá trị GỢI Ý để bánh xe có chỗ bắt đầu (UX). Không phải đáp án: chỉ thành đáp án khi người dùng chạm / xác nhận (`confirmed`). */
const SUGGESTED_DATE_OF_BIRTH = '1995-06-15'
const SUGGESTED_HEIGHT_CM = 170
const SUGGESTED_WEIGHT_KG = 70

/** Tốc độ gợi ý ban đầu (%BW/tuần): chỉ là gợi ý cho tới khi người dùng xác nhận (`goalConfirmed`). */
export const SUGGESTED_RATE_PERCENT = 0.5

/** Cân mục tiêu GỢI Ý: ±10 % cân hiện tại (làm tròn 0.1 kg); Maintenance không có cân mục tiêu. */
export const suggestedTargetKg = (
  goal: 'WeightLoss' | 'Maintenance' | 'WeightGain',
  weightKg: number
): number | null =>
  goal === 'Maintenance'
    ? null
    : Math.round(weightKg * (goal === 'WeightLoss' ? 0.9 : 1.1) * 10) / 10

/** Cân mục tiêu đúng hướng so với cân hiện tại (giảm: thấp hơn, tăng: cao hơn). */
export const targetFitsGoal = (
  goal: 'WeightLoss' | 'Maintenance' | 'WeightGain',
  targetKg: number | null,
  weightKg: number
): boolean =>
  goal === 'Maintenance' ||
  (targetKg !== null && (goal === 'WeightLoss' ? targetKg < weightKg : targetKg > weightKg))

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
  dateOfBirth: state.dateOfBirth ?? SUGGESTED_DATE_OF_BIRTH,
  heightCm: state.heightCm ?? SUGGESTED_HEIGHT_CM,
  weightKg: state.weightKg ?? SUGGESTED_WEIGHT_KG,
  // Đã lưu ở BE = đã trả lời; chưa có thì chỉ là gợi ý cho tới khi người dùng chạm / xác nhận
  confirmed: {
    dateOfBirth: state.dateOfBirth !== null,
    heightCm: state.heightCm !== null,
    weightKg: state.weightKg !== null,
  },
  unit: state.unitPreference,
  weighedMoreThanBefore: state.weighedMoreThanBefore,
  priorWeightThresholdShown: null,
  priorWeightThresholdUnit: null,
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
  weeklyRatePercent: SUGGESTED_RATE_PERCENT,
  goalConfirmed: { targetWeightKg: false, weeklyRatePercent: false },
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

/**
 * Cập nhật đáp án: ghi giá trị mới và đánh dấu ĐÃ TRẢ LỜI cho ngày sinh / chiều cao / cân nặng (và cân mục tiêu / tốc độ) khi chính trường đó được đặt (kể cả
 * đặt lại đúng số gợi ý = xác nhận). Đổi đơn vị không phải là trả lời. Cân nặng hiện tại đổi khi đã chọn mục tiêu (quay lại sửa) thì xem lại mục tiêu:
 * cân mục tiêu + tốc độ về chưa xác nhận, và cân mục tiêu sai hướng với cân mới được thay bằng gợi ý mới.
 */
export const applyAnswers = (
  current: WizardAnswers,
  partial: Partial<WizardAnswers>
): WizardAnswers => {
  const next: WizardAnswers = {
    ...current,
    ...partial,
    confirmed: {
      dateOfBirth: current.confirmed.dateOfBirth || 'dateOfBirth' in partial,
      heightCm: current.confirmed.heightCm || 'heightCm' in partial,
      weightKg: current.confirmed.weightKg || 'weightKg' in partial,
    },
    goalConfirmed: {
      targetWeightKg: current.goalConfirmed.targetWeightKg || 'targetWeightKg' in partial,
      weeklyRatePercent: current.goalConfirmed.weeklyRatePercent || 'weeklyRatePercent' in partial,
    },
  }
  const weightChanged = 'weightKg' in partial && partial.weightKg !== current.weightKg
  // Câu Prior Weight của BE v2 đã hiện một ngưỡng theo cân nặng + đơn vị lúc đó: cân nặng hoặc đơn vị đổi thì số đã hiện không còn đúng → phải trả lời lại
  const unitChanged = 'unit' in partial && partial.unit !== current.unit
  if ((weightChanged || unitChanged) && current.priorWeightThresholdShown !== null) {
    next.weighedMoreThanBefore = null
    next.priorWeightThresholdShown = null
    next.priorWeightThresholdUnit = null
  }
  if (!weightChanged || next.goalType === null || next.goalType === 'Maintenance') return next
  return {
    ...next,
    targetWeightKg: targetFitsGoal(next.goalType, next.targetWeightKg, next.weightKg)
      ? next.targetWeightKg
      : suggestedTargetKg(next.goalType, next.weightKg),
    goalConfirmed: { targetWeightKg: false, weeklyRatePercent: false },
  }
}

/**
 * Chọn loại mục tiêu: loại mới thì cân mục tiêu + tốc độ quay về GỢI Ý và chưa xác nhận (cùng loại thì giữ nguyên, kể cả phần đã xác nhận). Maintenance không có cân mục tiêu.
 */
export const chooseGoalType = (
  current: WizardAnswers,
  goal: 'WeightLoss' | 'Maintenance' | 'WeightGain'
): WizardAnswers =>
  current.goalType === goal
    ? current
    : {
        ...current,
        goalType: goal,
        targetWeightKg: suggestedTargetKg(goal, current.weightKg),
        weeklyRatePercent: SUGGESTED_RATE_PERCENT,
        goalConfirmed: { targetWeightKg: false, weeklyRatePercent: false },
      }

/** Dữ liệu lưu BE sau mỗi bước Basics; null = bước đó không lưu (giới thiệu, trò chuyện, giá trị). */
export const basicsPayload = (stepId: StepId, answers: WizardAnswers): SaveBasicsRequest | null => {
  const step = STEP_ORDER.indexOf(stepId)
  switch (stepId) {
    case 'sex':
      return answers.gender ? { step, gender: answers.gender } : null
    case 'birth':
      return answers.confirmed.dateOfBirth && answers.dateOfBirth
        ? { step, dateOfBirth: answers.dateOfBirth }
        : null
    case 'height':
      return answers.confirmed.heightCm
        ? { step, heightCm: answers.heightCm, unitPreference: answers.unit }
        : null
    case 'weight':
      return answers.confirmed.weightKg
        ? { step, weightKg: roundTo(answers.weightKg, 2), unitPreference: answers.unit }
        : null
    case 'weightHistory':
      return answers.weighedMoreThanBefore
        ? {
            step,
            weighedMoreThanBefore: answers.weighedMoreThanBefore,
            // Nhánh BE v2: gửi KÈM đúng số + đơn vị đã hiện; nhánh cũ không có hai trường này
            ...(answers.priorWeightThresholdShown !== null &&
              answers.priorWeightThresholdUnit !== null && {
                priorWeightThresholdShown: answers.priorWeightThresholdShown,
                priorWeightThresholdUnit: answers.priorWeightThresholdUnit,
              }),
          }
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
    targetWeightKg:
      maintain || answers.targetWeightKg === null ? null : roundTo(answers.targetWeightKg, 2),
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
