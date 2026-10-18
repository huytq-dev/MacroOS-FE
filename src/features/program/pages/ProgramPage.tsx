'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EllipsisVertical, Target } from 'lucide-react'
import { toast } from 'sonner'
import {
  useChangeProgramStyle,
  useCurrentProgram,
  useEndProgram,
  useGoalHistory,
  useSetManualExpenditure,
  useUpdateGoalTarget,
  useUpdateProgramGoal,
} from '../hooks/use-program'
import {
  CheckInDial,
  GoalCard,
  GoalHistory,
  ProgramActions,
  ProgramCard,
  type ActionKind,
  type GoalValues,
} from '../components/ProgramPage'
import { useGoalProgress } from '@/features/dashboard/hooks/use-dashboard'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'

const ENTER =
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300'

/**
 * Tab Strategy (như MacroFactor): vòng đếm ngược check-in kèm tiến độ goal, mục In Progress với thẻ Program (biểu đồ bảy ngày) và
 * thẻ Goal, rồi Goal History. Nút ba chấm mở menu đổi kiểu program / TDEE thủ công / kết thúc program; Edit Goal và Edit Program
 * mở bảng trượt từ đáy.
 */
export function ProgramPage() {
  const program = useCurrentProgram()
  const goalProgress = useGoalProgress()
  const history = useGoalHistory(Boolean(program.data))
  const updateGoal = useUpdateProgramGoal()
  const updateProgram = useUpdateProgramGoal()
  const updateTarget = useUpdateGoalTarget()
  const changeStyle = useChangeProgramStyle()
  const setManualTdee = useSetManualExpenditure()
  const endProgram = useEndProgram()
  const [open, setOpen] = useState<ActionKind | null>(null)

  if (program.isError)
    return <ErrorState error={program.error} onRetry={() => void program.refetch()} />

  const stateOf = (mutation: { isPending: boolean; error: Error | null }) => ({
    isPending: mutation.isPending,
    error: mutation.error ? getFormErrorMessage(mutation.error) : null,
  })
  const resetFor = (kind: ActionKind) => {
    if (kind === 'goal') {
      updateGoal.reset()
      updateTarget.reset()
    }
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
  const saveGoal = async (values: GoalValues, onDone: () => void) => {
    if (!current) return
    const rateChanged =
      values.ratePercent !== null &&
      values.ratePercent !== Math.abs(current.weeklyWeightChangeTargetPercent)
    try {
      if (values.targetWeightKg !== current.targetWeightKg)
        await updateTarget.mutateAsync(values.targetWeightKg)
      if (rateChanged)
        await updateGoal.mutateAsync({ weeklyWeightChangeTargetPercent: values.ratePercent })
      else toast.success('Goal updated')
      onDone()
    } catch {
      // lỗi hiện inline trong bảng (state của updateGoal / updateTarget)
    }
  }
  const goalError = updateGoal.error ?? updateTarget.error

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
          {current.checkInDueInDays !== null && (
            <div className={ENTER}>
              <CheckInDial
                days={current.checkInDueInDays}
                goalPercent={goalProgress.data?.progressPercent ?? null}
              />
            </div>
          )}

          <section aria-labelledby="in-progress" className={`${ENTER} space-y-3`}>
            <h2 id="in-progress" className="text-xl font-bold">
              In Progress
            </h2>
            <ProgramCard program={current} onEdit={() => openSheet('program')} />
            <GoalCard program={current} onEdit={() => openSheet('goal')} />
          </section>

          <div className={ENTER}>
            <GoalHistory items={history.data ?? []} />
          </div>

          <ProgramActions
            open={open}
            onOpenChange={openSheet}
            program={current}
            goal={{
              isPending: updateGoal.isPending || updateTarget.isPending,
              error: goalError ? getFormErrorMessage(goalError) : null,
            }}
            programEdit={stateOf(updateProgram)}
            style={stateOf(changeStyle)}
            tdee={stateOf(setManualTdee)}
            end={stateOf(endProgram)}
            onSaveGoal={(values, onDone) => void saveGoal(values, onDone)}
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
