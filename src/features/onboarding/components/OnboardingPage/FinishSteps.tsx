'use client'

import { ConsentStep } from './ConsentStep'
import { FeatureCarouselStep } from './FeatureCarouselStep'
import { First30DaysStep } from './First30DaysStep'
import { PlanStep } from './PlanStep'
import { WhatYouGetStep } from './WhatYouGetStep'
import type { OnboardingWizard } from '../../hooks/use-onboarding-wizard'

/** Các bước kết thúc sau khi tạo program: giới thiệu tính năng → chọn gói → 30 ngày đầu → điều khoản. */
export function FinishSteps({ wizard }: { readonly wizard: OnboardingWizard }) {
  switch (wizard.stepId) {
    case 'carousel':
      return <FeatureCarouselStep />
    case 'whatYouGet':
      return <WhatYouGetStep />
    case 'plan':
      return <PlanStep plan={wizard.plan} onChange={wizard.setPlan} />
    case 'first30':
      return <First30DaysStep />
    case 'consent':
      return (
        <ConsentStep
          healthAccepted={wizard.consent.health}
          privacyAccepted={wizard.consent.privacy}
          onHealthChange={(health) => wizard.setConsent({ ...wizard.consent, health })}
          onPrivacyChange={(privacy) => wizard.setConsent({ ...wizard.consent, privacy })}
          isPending={wizard.isPending}
          onAccept={wizard.acceptConsent}
        />
      )
    default:
      return null
  }
}
