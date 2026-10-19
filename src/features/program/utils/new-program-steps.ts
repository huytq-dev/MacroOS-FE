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

export const stepHref = (step: WizardStep) => `${routePath.programNew}/${step}`

export const isWizardStep = (value: string): value is WizardStep =>
  (WIZARD_STEPS as readonly string[]).includes(value)
