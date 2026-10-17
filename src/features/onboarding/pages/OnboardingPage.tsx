'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StepRenderer, WizardShell } from '../components/OnboardingPage'
import { useOnboardingState } from '../hooks/use-onboarding'
import { useOnboardingWizard } from '../hooks/use-onboarding-wizard'
import type { OnboardingState } from '../types/onboarding.types'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'

function OnboardingWizardView({ initial }: { readonly initial: OnboardingState }) {
  const wizard = useOnboardingWizard(initial)
  // Màn trò chuyện và màn điều khoản tự có thanh nút ở đáy
  const ownFooter = wizard.stepId === 'estimate' || wizard.stepId === 'consent'
  return (
    <WizardShell
      sectionTitle={wizard.sectionTitle}
      progress={wizard.progress}
      canGoBack={wizard.canGoBack}
      onBack={wizard.back}
      stepKey={wizard.stepId}
      direction={wizard.direction}
      nextLabel={wizard.nextLabel}
      nextDisabled={!wizard.canNext}
      isPending={wizard.isPending}
      pendingLabel={wizard.pendingLabel}
      onNext={wizard.next}
      error={wizard.error}
      footer={ownFooter ? false : undefined}
    >
      <StepRenderer wizard={wizard} />
    </WizardShell>
  )
}

/** Wizard thiết lập sau đăng nhập (Basics → Goal → Program → điều khoản); xong rồi thì về Tổng quan. */
export function OnboardingPage() {
  const router = useRouter()
  const state = useOnboardingState()
  const finished = state.data ? !state.data.isRequired : false

  useEffect(() => {
    if (finished) router.replace(routePath.dashboard)
  }, [finished, router])

  if (state.isError) return <ErrorState error={state.error} onRetry={() => void state.refetch()} />
  if (state.isLoading || !state.data || finished)
    return (
      <div className="mx-auto w-full max-w-md space-y-4 p-4" aria-busy="true">
        <Skeleton className="h-11 rounded-full" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  return <OnboardingWizardView initial={state.data} />
}
