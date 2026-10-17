'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateProgram } from '../hooks/use-program'
import { createProgramSchema, type CreateProgramFormValues } from '../schemas/create-program.schema'
import { CreateProgramForm } from '../components/CreateProgramPage'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { routePath } from '@/config/route-path'

export function CreateProgramPage() {
  const router = useRouter()
  const createProgram = useCreateProgram()

  const form = useForm<CreateProgramFormValues>({
    resolver: zodResolver(createProgramSchema),
    mode: 'onTouched',
    defaultValues: {
      goalType: 'WeightLoss',
      weeklyWeightChangeTargetPercent: 0.5,
      programType: 'Coached',
      dietStyle: 'Balanced',
      proteinLevel: 'Moderate',
      calorieFloorEnabled: true,
      calorieFloorKcal: 1200,
      checkInWeekday: 'Monday',
      manualTdeeEnabled: false,
      manualInitialTdeeKcal: 2000,
    },
  })

  const onSubmit = (values: CreateProgramFormValues) =>
    createProgram.mutate(
      {
        goalType: values.goalType,
        weeklyWeightChangeTargetPercent:
          values.goalType === 'Maintenance' ? 0 : values.weeklyWeightChangeTargetPercent,
        programType: values.programType,
        dietStyle: values.dietStyle,
        proteinLevel: values.proteinLevel,
        calorieFloorKcal:
          values.programType === 'Coached' && values.calorieFloorEnabled
            ? values.calorieFloorKcal
            : null,
        checkInWeekday: values.checkInWeekday,
        manualInitialTdeeKcal: values.manualTdeeEnabled ? values.manualInitialTdeeKcal : null,
      },
      { onSuccess: () => router.push(routePath.program) }
    )

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="space-y-2">
        <PageHeader title="Create program" />
        <p className="text-muted-foreground text-xs">
          You need a date of birth, height (
          <Link href={routePath.profile} className="text-primary hover:underline">
            Profile
          </Link>
          ) and at least one weigh-in (
          <Link href={routePath.weight} className="text-primary hover:underline">
            Weight
          </Link>
          ).
        </p>
      </div>
      <CreateProgramForm
        form={form}
        isPending={createProgram.isPending}
        error={createProgram.error ? getFormErrorMessage(createProgram.error) : null}
        onSubmit={onSubmit}
      />
    </div>
  )
}
