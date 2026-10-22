import type { ProgramType } from '@/config/enums'
import { routePath } from '@/config/route-path'

export type WizardStep =
  | 'style'
  | 'diet'
  | 'floor'
  | 'training'
  | 'distribute'
  | 'protein'
  | 'editor'
  | 'same-different'
  | 'manual-targets'
  | 'review'

export const WIZARD_STEPS: readonly WizardStep[] = [
  'style',
  'diet',
  'floor',
  'training',
  'distribute',
  'protein',
  'editor',
  'same-different',
  'manual-targets',
  'review',
]

/** Các bước của từng kiểu program (thứ tự hiển thị): Coached kết thúc ở Review, Collaborative thêm editor theo ngày, Manual nhập tay. */
export const stepsFor = (programType: ProgramType | null): WizardStep[] => {
  switch (programType) {
    case 'Collaborative':
      return ['style', 'diet', 'floor', 'training', 'distribute', 'protein', 'editor', 'review']
    case 'Manual':
      return ['style', 'same-different', 'manual-targets', 'review']
    default:
      return ['style', 'diet', 'floor', 'training', 'distribute', 'protein', 'review']
  }
}

/** Các lựa chọn của wizard mà từng bước phải ghi vào store (cùng tên với `useProgramWizardStore`). */
export interface WizardAnswers {
  readonly programType: ProgramType | null
  readonly dietStyle: unknown
  readonly floor: unknown
  readonly trainingType: unknown
  readonly distribution: unknown
  readonly proteinLevel: unknown
  readonly manualMode: unknown
  readonly days: unknown
  readonly manualDays: unknown
}

/**
 * Bước đã được trả lời khi đáp án nằm trong store. `buildProgramRequest` điền mặc định (`?? 'Even'`, `?? 'Balanced'`, `?? 'Moderate'`, sàn Standard…)
 * khi thiếu, nên vào thẳng Review mà bỏ qua bước sẽ gửi mặc định mà user chưa xác nhận: bước chưa trả lời bị coi là chưa qua.
 */
const ANSWERED: Record<WizardStep, (answers: WizardAnswers) => boolean> = {
  style: (a) => a.programType !== null,
  diet: (a) => a.dietStyle !== null,
  floor: (a) => a.floor !== null,
  training: (a) => a.trainingType !== null,
  distribute: (a) => a.distribution !== null,
  protein: (a) => a.proteinLevel !== null,
  // Editor (Collaborative): bảy ngày đã gieo từ preview của BE khi vào bước
  editor: (a) => a.days !== null,
  'same-different': (a) => a.manualMode !== null,
  'manual-targets': (a) => a.manualDays !== null,
  review: () => true,
}

/**
 * Bước ĐẦU TIÊN (theo thứ tự của kiểu program) chưa được trả lời trong các bước đứng TRƯỚC `step`; null = đi tiếp được. Manual không có bước distribute / diet…
 * nên không bao giờ bị đưa tới đó.
 */
export const firstUnansweredBefore = (
  step: WizardStep,
  answers: WizardAnswers
): WizardStep | null => {
  const steps = stepsFor(answers.programType)
  const index = steps.indexOf(step)
  if (index <= 0) return null
  return steps.slice(0, index).find((earlier) => !ANSWERED[earlier](answers)) ?? null
}

export const stepHref = (step: WizardStep) => `${routePath.programNew}/${step}`

export const isWizardStep = (value: string): value is WizardStep =>
  (WIZARD_STEPS as readonly string[]).includes(value)
