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
import { CurrentWeekCard, ProgramActions, WeeksTable } from '../components/ProgramPage'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'

export function ProgramPage() {
  const program = useCurrentProgram()
  const updateGoal = useUpdateProgramGoal()
  const changeStyle = useChangeProgramStyle()
  const setManualTdee = useSetManualExpenditure()
  const endProgram = useEndProgram()
  const isPending = updateGoal.isPending || changeStyle.isPending || setManualTdee.isPending || endProgram.isPending

  if (program.isError) return <ErrorState error={program.error} onRetry={() => void program.refetch()} />

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Program</h1>
        {program.data === null && (
          <Button asChild size="sm">
            <Link href={routePath.programNew}>Tạo program</Link>
          </Button>
        )}
      </div>

      {program.isLoading && (
        <>
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </>
      )}

      {program.data === null && (
        <div className="flex flex-col items-center gap-2 rounded-lg border p-8 text-center">
          <Target className="text-muted-foreground size-8" aria-hidden="true" />
          <p className="text-sm font-medium">Chưa có program</p>
          <p className="text-muted-foreground text-xs">Tạo program để nhận target kcal/macro hằng tuần.</p>
        </div>
      )}

      {program.data && (
        <>
          <CurrentWeekCard program={program.data} />
          <ProgramActions
            program={program.data}
            isPending={isPending}
            onUpdateGoal={(payload) => updateGoal.mutate(payload)}
            onChangeStyle={(programType) => changeStyle.mutate(programType)}
            onSetManualTdee={(tdeeKcal) => setManualTdee.mutate(tdeeKcal)}
            onEnd={() => endProgram.mutate(undefined)}
          />
          <h2 className="text-sm font-semibold">Lịch sử tuần</h2>
          <WeeksTable weeks={program.data.weeks} />
        </>
      )}
    </div>
  )
}
