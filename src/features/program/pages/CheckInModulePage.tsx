'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { WizardShell } from '@/features/onboarding/components/OnboardingPage'
import { useCheckInProgressStore } from '@/stores/check-in-progress.store'
import { useFlowStore } from '@/stores/flow.store'
import { IntroModule, PartialLoggingModule, ProgramUpdateModule } from '../components/CheckInPage'
import {
  useAcceptCheckIn,
  useCheckInSession,
  useRejectCheckIn,
  useSetCheckInModules,
  useSetIncompleteDays,
} from '../hooks/use-check-in'

/**
 * `/program/check-in/[module]`: một module (Introduction, Partial Logging, Program Update). Trang giữ mọi hook (session dùng chung,
 * lưu ngày chưa đủ, cờ module, accept / reject); xong module thì đánh dấu ✓ và về hub, riêng Program Update xong thì về Strategy.
 * Chưa tới hạn (vào thẳng URL) thì về hub.
 */
export function CheckInModulePage({ module }: { readonly module: string }) {
  const router = useRouter()
  const session = useCheckInSession()
  const markDone = useCheckInProgressStore((state) => state.markDone)
  const direction = useFlowStore((state) => state.direction)
  const setDirection = useFlowStore((state) => state.setDirection)
  const setIncompleteDays = useSetIncompleteDays()
  const setModules = useSetCheckInModules()
  const accept = useAcceptCheckIn()
  const reject = useRejectCheckIn()
  const data = session.data
  const notDue = Boolean(data) && (!data?.isDue || data?.alreadyCheckedInToday)

  useEffect(() => {
    if (notDue) router.replace(routePath.programCheckIn)
  }, [notDue, router])

  const backToHub = () => {
    setDirection('back')
    router.push(routePath.programCheckIn)
  }

  if (!data || notDue)
    return (
      <WizardShell
        sectionTitle="Check-in"
        progress={null}
        canGoBack
        onBack={backToHub}
        stepKey="loading"
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
        ) : (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        )}
      </WizardShell>
    )

  const doneToHub = () => {
    markDone(data.nextCheckInDate, module)
    backToHub()
  }
  const finishCheckIn = () => {
    markDone(data.nextCheckInDate, module)
    setDirection('back')
    router.push(routePath.program)
  }

  switch (module) {
    case 'intro':
      return (
        <IntroModule
          direction={direction}
          isSaving={setModules.isPending}
          onExit={backToHub}
          onFinish={() => {
            setModules.mutate({ introSeen: true })
            doneToHub()
          }}
        />
      )
    case 'partial-logging':
      return (
        <PartialLoggingModule
          direction={direction}
          onDirectionChange={setDirection}
          days={data.days}
          isSaving={setIncompleteDays.isPending}
          error={setIncompleteDays.error ? getFormErrorMessage(setIncompleteDays.error) : null}
          onExit={backToHub}
          onSaveDays={(dates, onDone) => setIncompleteDays.mutate(dates, { onSuccess: onDone })}
          onFinish={(hide) => {
            if (hide) setModules.mutate({ partialLoggingHidden: true })
            doneToHub()
          }}
        />
      )
    case 'program-update':
      return (
        <ProgramUpdateModule
          direction={direction}
          preview={data.preview}
          isDeciding={accept.isPending || reject.isPending}
          error={
            accept.error || reject.error ? getFormErrorMessage(accept.error ?? reject.error) : null
          }
          onExit={backToHub}
          onAccept={() => accept.mutate(undefined, { onSuccess: finishCheckIn })}
          onDecline={() => reject.mutate(undefined, { onSuccess: finishCheckIn })}
        />
      )
    default:
      return null
  }
}
