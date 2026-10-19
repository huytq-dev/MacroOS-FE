'use client'

import { useRouter } from 'next/navigation'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { WizardShell } from '@/features/onboarding/components/OnboardingPage'
import { useCheckInProgressStore, completedFor } from '@/stores/check-in-progress.store'
import { useFlowStore } from '@/stores/flow.store'
import { CheckInHub } from '../components/CheckInPage'
import { useCheckInSession } from '../hooks/use-check-in'

/** `/program/check-in`: hub check-in. Session (module + 7 ngày + preview) tải một lần và dùng chung với các module; ✓ lấy từ sessionStorage. */
export function CheckInHubPage() {
  const router = useRouter()
  const session = useCheckInSession()
  const progress = useCheckInProgressStore()
  const direction = useFlowStore((state) => state.direction)
  const setDirection = useFlowStore((state) => state.setDirection)
  const data = session.data

  const exit = () => {
    setDirection('back')
    router.push(routePath.program)
  }

  return (
    <WizardShell
      sectionTitle="Check-in"
      progress={null}
      canGoBack
      onBack={exit}
      stepKey="hub"
      direction={direction}
      nextLabel=""
      nextDisabled
      isPending={false}
      pendingLabel=""
      onNext={() => undefined}
      error={null}
      footer={false}
    >
      {session.isError ? (
        <div className="space-y-3">
          <FormErrorAlert
            title="Couldn't load your check-in"
            message={getFormErrorMessage(session.error)}
          />
          <button
            type="button"
            onClick={() => void session.refetch()}
            className="bg-secondary active:bg-muted h-11 rounded-full px-4 text-base transition-transform active:scale-95"
          >
            Try again
          </button>
        </div>
      ) : !data ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : (
        <CheckInHub
          session={data}
          completed={completedFor(progress, data.nextCheckInDate)}
          onOpen={(key) => {
            setDirection('forward')
            router.push(`${routePath.programCheckIn}/${key}`)
          }}
          onSkip={(key) => progress.markDone(data.nextCheckInDate, key)}
          onExit={exit}
        />
      )}
    </WizardShell>
  )
}
