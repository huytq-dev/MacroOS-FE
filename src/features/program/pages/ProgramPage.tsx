'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EllipsisVertical, Target } from 'lucide-react'
import {
  useChangeProgramStyle,
  useCurrentProgram,
  useEndProgram,
  useGoalHistory,
  useSetManualExpenditure,
  useUpdateProgramGoal,
} from '../hooks/use-program'
import { CheckInButton } from '../components/CheckInPage'
import {
  CheckInDial,
  GoalCard,
  GoalHistory,
  ProgramActions,
  ProgramCard,
  type ActionKind,
} from '../components/ProgramPage'
import { useGoalProgress } from '@/features/dashboard/hooks/use-dashboard'
import { useExpenditureInsights } from '@/features/dashboard/hooks/use-expenditure-detail'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { tdeeEstimateOf } from '../utils/tdee.utils'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { feasibilityOfError } from '../utils/feasibility'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { useGoalEditStore } from '@/stores/goal-edit.store'

const ENTER =
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300'

/**
 * Tab Strategy (như MacroFactor): vòng đếm ngược check-in kèm tiến độ goal, mục In Progress với thẻ Program (biểu đồ bảy ngày) và
 * thẻ Goal, rồi Goal History. Nút ba chấm mở menu đổi kiểu program / TDEE thủ công / kết thúc program; Edit Goal và Edit Program
 * mở bảng trượt từ đáy.
 */
export function ProgramPage() {
  const program = useCurrentProgram()
  const goalProgress = useGoalProgress()
  const history = useGoalHistory(Boolean(program.data))
  const updateProgram = useUpdateProgramGoal()
  const changeStyle = useChangeProgramStyle()
  const setManualTdee = useSetManualExpenditure()
  const endProgram = useEndProgram()
  const [open, setOpen] = useState<ActionKind | null>(null)
  // Ước tính TDEE hiện tại chỉ cần cho bảng Set TDEE: chỉ gọi khi bảng đó mở (cùng truy vấn / bộ nhớ đệm với trang Expenditure)
  const expenditure = useExpenditureInsights(open === 'tdee')
  const derived = useDerivedGate()

  // Strategy là điểm vào của cả Edit Goal lẫn New Program, không bao giờ nằm giữa hai luồng đó: vào đây (kể cả bằng Back / Forward của trình duyệt)
  // nghĩa là phiên Edit Goal trước đã kết thúc, nên bỏ goal đã chốt + đích / tốc độ đã sửa. Không xoá ở unmount của Edit Goal vì đó chính là bước chuyển sang New Program.
  useEffect(() => useGoalEditStore.getState().reset(), [])

  if (program.isError)
    return <ErrorState error={program.error} onRetry={() => void program.refetch()} />

  const stateOf = (mutation: { isPending: boolean; error: Error | null }) => ({
    isPending: mutation.isPending,
    error: mutation.error ? getFormErrorMessage(mutation.error) : null,
    // 400 `FeasibilityResponse` (nothing persisted): bảng nêu vi phạm + cách chỉnh thay cho câu lỗi chung
    feasibility: feasibilityOfError(mutation.error),
  })
  const resetFor = (kind: ActionKind) => {
    if (kind === 'program') updateProgram.reset()
    if (kind === 'style') changeStyle.reset()
    if (kind === 'tdee') setManualTdee.reset()
    if (kind === 'end') endProgram.reset()
  }
  const openSheet = (next: ActionKind | null) => {
    if (next) resetFor(next)
    setOpen(next)
  }

  const current = program.data
  const tdeeEstimate = tdeeEstimateOf(expenditure, derived.gate)
  const createButton = (
    <Button asChild size="sm">
      <Link href={routePath.programNew}>Create program</Link>
    </Button>
  )

  return (
    <div className="flex max-w-2xl flex-col gap-6 pb-24 md:pb-0">
      <PageHeader
        title="Strategy"
        action={
          current ? (
            <Button
              aria-label="More"
              onClick={() => openSheet('menu')}
              className="bg-foreground/12 active:bg-foreground/20 focus-visible:ring-ring/50 size-11 rounded-full p-0 transition-colors focus-visible:ring-1"
            >
              <EllipsisVertical aria-hidden="true" className="size-6" />
            </Button>
          ) : undefined
        }
      />

      {program.isLoading && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="mx-auto size-72 rounded-full" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      )}

      {current === null && (
        <Card className="rounded-2xl">
          <EmptyState
            icon={Target}
            title="No program yet"
            description="Create a program to get weekly calorie and macro targets."
            action={createButton}
          />
        </Card>
      )}

      {current && (
        <>
          {derived.gate === 'failed' && (
            <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
          )}
          {current.checkInDue ? (
            <div className={ENTER}>
              <CheckInButton />
            </div>
          ) : (
            current.checkInDueInDays !== null && (
              // % goal là số dẫn xuất: BE đang dựng lại / dựng lỗi thì mờ đi (không phải số cuối); tải lại lỗi thì không hiện số TanStack còn giữ
              <div
                aria-busy={derived.gate === 'updating'}
                className={`${ENTER} ${derived.gate !== 'ready' ? 'opacity-60 transition-opacity' : ''}`}
              >
                <CheckInDial
                  days={current.checkInDueInDays}
                  goalPercent={
                    goalProgress.isError ? null : (goalProgress.data?.progressPercent ?? null)
                  }
                />
              </div>
            )
          )}

          <section aria-labelledby="in-progress" className={`${ENTER} space-y-3`}>
            <h2 id="in-progress" className="text-xl font-bold">
              In Progress
            </h2>
            <ProgramCard program={current} onEdit={() => openSheet('program')} />
            <GoalCard program={current} />
          </section>

          <div className={ENTER}>
            <GoalHistory items={history.data ?? []} />
          </div>

          <ProgramActions
            open={open}
            onOpenChange={openSheet}
            program={current}
            programEdit={stateOf(updateProgram)}
            style={stateOf(changeStyle)}
            tdee={stateOf(setManualTdee)}
            tdeeEstimate={tdeeEstimate}
            end={stateOf(endProgram)}
            onSaveProgram={(payload, onDone) =>
              updateProgram.mutate(payload, { onSuccess: onDone })
            }
            onChangeStyle={(programType, onDone) =>
              changeStyle.mutate(programType, { onSuccess: onDone })
            }
            onSetManualTdee={(tdeeKcal, onDone) =>
              setManualTdee.mutate(tdeeKcal, { onSuccess: onDone })
            }
            onEnd={(onDone) => endProgram.mutate(undefined, { onSuccess: onDone })}
          />
        </>
      )}
    </div>
  )
}
