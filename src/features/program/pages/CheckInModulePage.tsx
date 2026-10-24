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
  useCheckInAcceptGate,
  useCheckInSession,
  useRejectCheckIn,
  useSetCheckInModules,
  useSetIncompleteDays,
} from '../hooks/use-check-in'
import { acceptBlockOfError } from '../utils/check-in-gate'
import { feasibilityOfError } from '../utils/feasibility'

/**
 * `/program/check-in/[module]`: một module (Introduction, Partial Logging, Program Update). Trang giữ mọi hook (session dùng chung,
 * lưu ngày chưa đủ, cờ module, accept / reject); xong module thì đánh dấu ✓ và về hub, riêng Program Update xong thì về Strategy.
 * Chưa tới hạn (vào thẳng URL) thì về hub.
 */
export function CheckInModulePage({ module }: { readonly module: string }) {
  const router = useRouter()
  // Chỉ module có nút Accept (Program Update): preview bị chặn mà trạng thái sống không tự lo được thì hỏi lại (hub, Intro, Partial Logging không bật)
  const acceptModule = module === 'program-update'
  const session = useCheckInSession({ pollBlockedPreview: acceptModule })
  const markDone = useCheckInProgressStore((state) => state.markDone)
  const direction = useFlowStore((state) => state.direction)
  const setDirection = useFlowStore((state) => state.setDirection)
  const setIncompleteDays = useSetIncompleteDays()
  const setModules = useSetCheckInModules()
  const accept = useAcceptCheckIn()
  const reject = useRejectCheckIn()
  // G6: Accept khoá khi dữ liệu dẫn xuất chưa Ready; 409 `DERIVED_DATA_*` của BE không hiện thành câu lỗi (nút tự khoá, có Retry khi Failed)
  const acceptGate = useCheckInAcceptGate(session, acceptModule)
  const blockedByServer = acceptBlockOfError(accept.error) !== null
  const acceptError = blockedByServer ? null : accept.error
  // Accept bị 400 `FeasibilityResponse` (nothing persisted): nêu vi phạm + cách chỉnh thay cho câu lỗi chung
  const refused = feasibilityOfError(acceptError)
  const data = session.data
  const notDue = Boolean(data) && (!data?.isDue || data?.alreadyCheckedInToday)
  const { reset: resetAccept } = accept

  useEffect(() => {
    if (notDue) router.replace(routePath.programCheckIn)
  }, [notDue, router])

  // Dữ liệu đã Ready lại: bỏ lỗi 409 cũ để nút mở bình thường (user tự bấm Accept, không tự gửi)
  useEffect(() => {
    if (acceptGate.gate === 'open' && blockedByServer) resetAccept()
  }, [acceptGate.gate, blockedByServer, resetAccept])

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
              // Đang tải lại: khoá nút (bấm lại sẽ huỷ request đang chạy và gửi request khác) và nói rõ đang thử lại
              disabled={session.isFetching}
              aria-busy={session.isFetching}
              onClick={() => void session.refetch()}
              className="bg-secondary active:bg-muted h-11 rounded-full px-4 text-base transition-transform active:scale-95 disabled:opacity-60"
            >
              {session.isFetching ? 'Retrying…' : 'Try again'}
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
            (acceptError && !refused) || reject.error
              ? getFormErrorMessage(refused ? reject.error : (acceptError ?? reject.error))
              : null
          }
          refused={refused}
          acceptGate={acceptGate.gate}
          onRetryDerived={acceptGate.retry}
          isRetryingDerived={acceptGate.isRetrying}
          // Tải lại session lỗi: đề xuất đang hiện (TanStack giữ) có thể là số trước khi BE dựng lại → khoá Accept, báo lỗi + Try again ngay trong module
          loadError={
            session.isError
              ? {
                  message: getFormErrorMessage(session.error),
                  onRetry: () => void session.refetch(),
                  isRetrying: session.isFetching,
                }
              : null
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
