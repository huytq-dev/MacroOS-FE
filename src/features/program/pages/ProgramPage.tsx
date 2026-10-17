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
import { PageHeader } from '@/components/shared/PageHeader'
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
      <Link href={routePath.programNew}>Create program</Link>
    </Button>
  )

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <PageHeader title="Program" action={program.data === null ? createButton : undefined} />

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
            title="No program yet"
            description="Create a program to get weekly calorie and macro targets."
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
          <WeeksTable weeks={program.data.weeks} />
        </>
      )}
    </div>
  )
}
