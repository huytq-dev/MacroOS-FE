'use client'

import { BasicsSteps } from './BasicsSteps'
import { FinishSteps } from './FinishSteps'
import { ProgramSteps } from './ProgramSteps'
import type { OnboardingWizard } from '../../hooks/use-onboarding-wizard'
import { SECTION_OF } from '../../types/onboarding.types'

/** Chọn nhóm bước theo phần hiện tại; mọi trạng thái nằm ở wizard (components chỉ nhận props). */
export function StepRenderer({ wizard }: { readonly wizard: OnboardingWizard }) {
  switch (SECTION_OF[wizard.stepId]) {
    case 'intro':
    case 'basics':
      return <BasicsSteps wizard={wizard} />
    case 'goal':
    case 'program':
      return <ProgramSteps wizard={wizard} />
    case 'finish':
      return <FinishSteps wizard={wizard} />
  }
}
