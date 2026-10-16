'use client'

import Link from 'next/link'
import { Target } from 'lucide-react'
import {
  useChangeProgramStyle,
  useCurrentProgram,
  useEndProgram,
  useSetManualExpenditure,
  useUpdateProgramGoal,
} from '../hooks/use-program'
import {
  CurrentWeekCard,
  ProgramActions,
  WeeksTable,
  type ActionKind,
} from '../components/ProgramPage'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'

export function ProgramPage() {
  const program = useCurrentProgram()
  const updateGoal = useUpdateProgramGoal()
  const changeStyle = useChangeProgramStyle()
  const setManualTdee = useSetManualExpenditure()
  const endProgram = useEndProgram()

  if (program.isError)
    return <ErrorState error={program.error} onRetry={() => void program.refetch()} />

  const stateOf = (mutation: { isPending: boolean; error: Error | null }) => ({
    isPending: mutation.isPending,
    error: mutation.error ? getFormErrorMessage(mutation.error) : null,
  })
  const reset: Record<ActionKind, () => void> = {
    goal: updateGoal.reset,
    style: changeStyle.reset,
    tdee: setManualTdee.reset,
    end: endProgram.reset,
  }
  const createButton = (
    <Button asChild size="sm">
      <Link href={routePath.programNew}>Tạo program</Link>
    </Button>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold">Program</h1>
        {program.data === null && createButton}
      </div>

      {program.isLoading && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      )}

      {program.data === null && (
        <Card className="rounded-2xl">
          <EmptyState
            icon={Target}
            title="Chưa có program"
            description="Tạo program để nhận target kcal và macro hằng tuần."
            action={createButton}
          />
        </Card>
      )}

      {program.data && (
        <>
          <CurrentWeekCard program={program.data} />
          <ProgramActions
            program={program.data}
            goal={stateOf(updateGoal)}
            style={stateOf(changeStyle)}
            tdee={stateOf(setManualTdee)}
            end={stateOf(endProgram)}
            onOpen={(kind) => reset[kind]()}
            onUpdateGoal={(payload, onDone) => updateGoal.mutate(payload, { onSuccess: onDone })}
            onChangeStyle={(programType, onDone) =>
              changeStyle.mutate(programType, { onSuccess: onDone })
            }
            onSetManualTdee={(tdeeKcal, onDone) =>
              setManualTdee.mutate(tdeeKcal, { onSuccess: onDone })
            }
            onEnd={(onDone) => endProgram.mutate(undefined, { onSuccess: onDone })}
          />
          <h2 className="text-sm font-semibold">Lịch sử tuần</h2>
          <WeeksTable weeks={program.data.weeks} />
        </>
      )}
    </div>
  )
}
