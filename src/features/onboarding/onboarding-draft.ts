import type { DayOfWeek, DietStyle, ProteinLevel } from '@/config/enums'
import {
  initialAnswers,
  initialStepOf,
  suggestedTargetKg,
  SUGGESTED_RATE_PERCENT,
  targetFitsGoal,
} from './onboarding.utils'
import {
  STEP_ORDER,
  type CalorieFloorChoice,
  type CalorieShiftMode,
  type GoalConfirmed,
  type OnboardingState,
  type StepId,
  type TrainingType,
  type WizardAnswers,
} from './types/onboarding.types'

/**
 * Bản nháp các lựa chọn Goal / Program đang dở (sessionStorage, theo từng tài khoản) để tải lại trang giữa wizard không mất. CHỈ chứa lựa chọn của người dùng cho
 * Goal / Program (+ TDEE nhập tay): KHÔNG token / mật khẩu / email, KHÔNG giá trị Basics (hồ sơ và Basics luôn lấy từ BE, một nguồn duy nhất). `weightKg` chỉ để phát hiện
 * bản nháp cũ (cân nặng đã đổi), không bao giờ được khôi phục. Khôi phục không bao giờ tự gọi API; giá trị chỉ là gợi ý thì vẫn chưa xác nhận (cờ `goalConfirmed` giữ như đã lưu).
 */
export const DRAFT_VERSION = 1
const PREFIX = 'macroos.onboarding-draft.'
export const draftKey = (userId: string) => `${PREFIX}v${DRAFT_VERSION}.${userId}`

type GoalKind = 'WeightLoss' | 'Maintenance' | 'WeightGain'

const GOALS: readonly GoalKind[] = ['WeightLoss', 'Maintenance', 'WeightGain']
const DIETS: readonly DietStyle[] = ['Balanced', 'LowFat', 'LowCarb', 'Keto']
const FLOORS: readonly Exclude<CalorieFloorChoice, 'Off'>[] = ['Standard', 'Low']
const TRAININGS: readonly TrainingType[] = ['None', 'Lifting', 'Cardio', 'Both']
const PROTEINS: readonly ProteinLevel[] = ['Low', 'Moderate', 'High', 'ExtraHigh']
const SHIFT_MODES: readonly CalorieShiftMode[] = ['Even', 'Custom']
const DAYS: readonly DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export interface DraftGoal {
  goalType: GoalKind | null
  targetWeightKg: number | null
  weeklyRatePercent: number
  goalConfirmed: GoalConfirmed
  dietStyle: DietStyle | null
  calorieFloor: Exclude<CalorieFloorChoice, 'Off'> | null
  trainingType: TrainingType | null
  shiftMode: CalorieShiftMode
  shiftDays: DayOfWeek[]
  shiftPercent: number
  proteinLevel: ProteinLevel | null
  manualTdeeKcal: number | null
}

export interface OnboardingDraft {
  version: typeof DRAFT_VERSION
  userId: string
  stepId: StepId
  weightKg: number
  goal: DraftGoal
}

const at = (id: StepId) => STEP_ORDER.indexOf(id)

/** Bước nào đáng lưu nháp: từ màn TDEE (có thể đã nhập tay) tới Review; trước đó chỉ là Basics (BE giữ), sau Review là phần kết thúc (nháp đã xoá). */
export const isDraftStep = (stepId: StepId) =>
  at(stepId) >= at('estimate') && at(stepId) <= at('ready')

const oneOf = <T extends string>(list: readonly T[], value: unknown): T | null =>
  list.includes(value as T) ? (value as T) : null

const inRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

export const draftOf = (
  answers: WizardAnswers,
  stepId: StepId,
  userId: string
): OnboardingDraft => ({
  version: DRAFT_VERSION,
  userId,
  stepId,
  weightKg: answers.weightKg,
  goal: {
    goalType: answers.goalType,
    targetWeightKg: answers.targetWeightKg,
    weeklyRatePercent: answers.weeklyRatePercent,
    goalConfirmed: { ...answers.goalConfirmed },
    dietStyle: answers.dietStyle,
    calorieFloor: answers.calorieFloor === 'Off' ? null : answers.calorieFloor,
    trainingType: answers.trainingType,
    shiftMode: answers.shiftMode,
    shiftDays: [...answers.shiftDays],
    shiftPercent: answers.shiftPercent,
    proteinLevel: answers.proteinLevel,
    manualTdeeKcal: answers.manualTdeeKcal,
  },
})

/**
 * Đọc + kiểm tra bản nháp: sai cấu trúc / phiên bản / tài khoản khác → null (bỏ cả bản). Từng trường sai thì về mặc định và KHÔNG được coi là đã xác nhận
 * (cờ xác nhận chỉ true khi cả giá trị hợp lệ lẫn cờ đã lưu đều true).
 */
export function parseDraft(raw: string | null, userId: string): OnboardingDraft | null {
  if (raw === null) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const draft = data as Record<string, unknown>
  const goal = draft.goal as Record<string, unknown> | null
  if (
    draft.version !== DRAFT_VERSION ||
    draft.userId !== userId ||
    typeof draft.stepId !== 'string' ||
    !STEP_ORDER.includes(draft.stepId as StepId) ||
    !isDraftStep(draft.stepId as StepId) ||
    !inRange(draft.weightKg, 1, 1000) ||
    typeof goal !== 'object' ||
    goal === null
  )
    return null

  const confirmed = (goal.goalConfirmed ?? {}) as Record<string, unknown>
  const targetValid = inRange(goal.targetWeightKg, 30, 300)
  const rateValid = inRange(goal.weeklyRatePercent, 0.1, 1.5)
  const days = Array.isArray(goal.shiftDays) ? goal.shiftDays : []
  const daysValid =
    days.length <= 6 &&
    new Set(days).size === days.length &&
    days.every((day) => DAYS.includes(day as DayOfWeek))
  return {
    version: DRAFT_VERSION,
    userId,
    stepId: draft.stepId as StepId,
    weightKg: draft.weightKg,
    goal: {
      goalType: oneOf(GOALS, goal.goalType),
      targetWeightKg: targetValid ? (goal.targetWeightKg as number) : null,
      weeklyRatePercent: rateValid ? (goal.weeklyRatePercent as number) : SUGGESTED_RATE_PERCENT,
      goalConfirmed: {
        targetWeightKg: targetValid && confirmed.targetWeightKg === true,
        weeklyRatePercent: rateValid && confirmed.weeklyRatePercent === true,
      },
      dietStyle: oneOf(DIETS, goal.dietStyle),
      calorieFloor: oneOf(FLOORS, goal.calorieFloor),
      trainingType: oneOf(TRAININGS, goal.trainingType),
      shiftMode: oneOf(SHIFT_MODES, goal.shiftMode) ?? 'Even',
      shiftDays: daysValid ? (days as DayOfWeek[]) : [],
      shiftPercent:
        inRange(goal.shiftPercent, 5, 30) && Number.isInteger(goal.shiftPercent)
          ? goal.shiftPercent
          : 10,
      proteinLevel: oneOf(PROTEINS, goal.proteinLevel),
      manualTdeeKcal:
        inRange(goal.manualTdeeKcal, 1000, 6000) && Number.isInteger(goal.manualTdeeKcal)
          ? goal.manualTdeeKcal
          : null,
    },
  }
}

/**
 * Đặt bản nháp lên đáp án hiện tại (Basics và hồ sơ lấy từ BE, không đụng tới). Xem lại các giá trị phụ thuộc cân nặng / loại mục tiêu: cân nặng BE khác lúc lưu
 * thì cân mục tiêu + tốc độ phải xác nhận lại; cân mục tiêu sai hướng với cân nặng hiện tại thì thay bằng gợi ý mới (chưa xác nhận); Maintenance không có cân mục tiêu.
 */
export function applyDraft(answers: WizardAnswers, draft: OnboardingDraft): WizardAnswers {
  const goal = draft.goal
  let target = goal.targetWeightKg
  let confirmed: GoalConfirmed = { ...goal.goalConfirmed }
  if (goal.goalType === null) {
    target = null
    confirmed = { targetWeightKg: false, weeklyRatePercent: false }
  } else if (goal.goalType === 'Maintenance') {
    target = null
    confirmed = { targetWeightKg: false, weeklyRatePercent: false }
  } else {
    if (Math.abs(draft.weightKg - answers.weightKg) > 1e-6)
      confirmed = { targetWeightKg: false, weeklyRatePercent: false }
    if (!targetFitsGoal(goal.goalType, target, answers.weightKg)) {
      target = suggestedTargetKg(goal.goalType, answers.weightKg)
      confirmed = { ...confirmed, targetWeightKg: false }
    }
  }
  return {
    ...answers,
    goalType: goal.goalType,
    targetWeightKg: target,
    weeklyRatePercent: goal.weeklyRatePercent,
    goalConfirmed: confirmed,
    dietStyle: goal.dietStyle,
    calorieFloor: goal.calorieFloor,
    trainingType: goal.trainingType,
    shiftMode: goal.shiftMode,
    shiftDays: goal.shiftDays,
    shiftPercent: goal.shiftPercent,
    proteinLevel: goal.proteinLevel,
    manualTdeeKcal: goal.manualTdeeKcal,
  }
}

/**
 * Bước tiếp tục sau khi khôi phục: bước đã lưu, nhưng không vượt quá bước đầu tiên còn thiếu đáp án (loại mục tiêu, cân + tốc độ đã xác nhận, kiểu ăn, sàn calo,
 * loại tập, protein). Bước "distribution" không cần đáp án riêng (Even có sẵn, bấm Next là chấp nhận).
 */
export function resumeStepOf(answers: WizardAnswers, savedStep: StepId): StepId {
  const missing: StepId[] = []
  if (answers.goalType === null) missing.push('goalType')
  else if (
    answers.goalType !== 'Maintenance' &&
    !(
      answers.targetWeightKg !== null &&
      answers.goalConfirmed.targetWeightKg &&
      answers.goalConfirmed.weeklyRatePercent
    )
  )
    missing.push('goalTarget')
  if (answers.dietStyle === null) missing.push('diet')
  if (answers.calorieFloor === null) missing.push('floor')
  if (answers.trainingType === null) missing.push('training')
  if (answers.proteinLevel === null) missing.push('protein')
  const limit = Math.min(...missing.map(at), at('ready'))
  return STEP_ORDER[Math.min(at(savedStep), limit)]
}

/** BE báo đang dở (InProgress, chưa có program): chỉ khi đó bản nháp mới có nghĩa. */
export const isResumable = (initial: OnboardingState) =>
  initial.state === 'InProgress' && !initial.hasProgram

/**
 * Đáp án + bước lúc mở wizard: Basics / hồ sơ từ BE (`initialAnswers`), rồi đặt bản nháp Goal / Program lên nếu có (đã xem lại với cân nặng BE). Hàm THUẦN (chỉ đọc
 * storage) để gọi lúc khởi tạo state: wizard chỉ dựng sau khi truy vấn onboarding xong (không bao giờ render ở server) nên không lệch hydration. Không tự gọi API.
 */
export function bootOf(initial: OnboardingState, userId: string | null) {
  const base = initialAnswers(initial)
  const firstStep = initialStepOf(initial)
  const draft = userId !== null && isResumable(initial) ? readDraft(userId) : null
  if (!draft) return { answers: base, stepId: firstStep, restored: false }
  const merged = applyDraft(base, draft)
  // Bước đã lưu còn ở Basics (chưa tới Goal) thì giữ bước BE đã chọn; từ Goal trở đi quay lại đúng chỗ nhưng không vượt bước còn thiếu đáp án
  const stepId = at(draft.stepId) >= at('goalType') ? resumeStepOf(merged, draft.stepId) : firstStep
  return { answers: merged, stepId, restored: true }
}

const storage = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

/** Bản nháp hợp lệ của tài khoản này (chỉ ĐỌC, không ghi gì: an toàn khi gọi lúc render). */
export function readDraft(userId: string): OnboardingDraft | null {
  try {
    return parseDraft(storage()?.getItem(draftKey(userId)) ?? null, userId)
  } catch {
    return null
  }
}

/**
 * Dọn bản nháp: luôn xoá bản nháp của tài khoản khác (đổi tài khoản trên cùng tab) và bản của mình không còn hợp lệ; `keep = false` (BE không còn báo đang dở, vd.
 * đã có program) thì xoá luôn bản của mình.
 */
export function pruneDrafts(userId: string, keep: boolean) {
  const store = storage()
  if (!store) return
  try {
    const own = draftKey(userId)
    for (const key of Object.keys(store))
      if (key.startsWith(PREFIX) && key !== own) store.removeItem(key)
    if (!keep || parseDraft(store.getItem(own), userId) === null) store.removeItem(own)
  } catch {
    // bỏ qua
  }
}

export function writeDraft(draft: OnboardingDraft) {
  try {
    storage()?.setItem(draftKey(draft.userId), JSON.stringify(draft))
  } catch {
    // không có storage (chế độ riêng tư / đầy): bỏ qua, wizard vẫn chạy
  }
}

export function clearDraft(userId: string) {
  try {
    storage()?.removeItem(draftKey(userId))
  } catch {
    // bỏ qua
  }
}

/** Đăng xuất / đổi tài khoản: xoá mọi bản nháp (mọi phiên bản, mọi tài khoản). */
export function clearAllDrafts() {
  const store = storage()
  if (!store) return
  try {
    for (const key of Object.keys(store)) if (key.startsWith(PREFIX)) store.removeItem(key)
  } catch {
    // bỏ qua
  }
}
