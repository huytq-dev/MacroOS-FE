'use client'

import { Controller, type UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { ChoiceGroup } from '@/components/shared/ChoiceGroup'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PickerSelect } from '@/components/shared/PickerSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  DAY_OF_WEEK,
  DIET_STYLE,
  GOAL_TYPE,
  PROGRAM_TYPE,
  PROTEIN_LEVEL,
  enumOptions,
} from '@/config/enums'
import { toChoices } from '../../utils/choices'
import type { CreateProgramFormValues } from '../../schemas/create-program.schema'

interface CreateProgramFormProps {
  readonly form: UseFormReturn<CreateProgramFormValues>
  readonly isPending: boolean
  readonly error: string | null
  readonly onSubmit: (values: CreateProgramFormValues) => void
}

const GOAL_CHOICES = toChoices(GOAL_TYPE)
const PROGRAM_CHOICES = toChoices(PROGRAM_TYPE)
const DIET_CHOICES = toChoices(DIET_STYLE)
const PROTEIN_CHOICES = toChoices(PROTEIN_LEVEL)

/** Wizard rút gọn: các bước MacroFactor xếp thành thẻ trên một trang (ponytail: không multi-step). */
export function CreateProgramForm({ form, isPending, error, onSubmit }: CreateProgramFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = form
  const goalType = watch('goalType')
  const programType = watch('programType')
  const floorEnabled = watch('calorieFloorEnabled')
  const manualTdeeEnabled = watch('manualTdeeEnabled')

  const section = (title: string, description: string | undefined, children: React.ReactNode) => (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )

  const switchRow = (
    id: string,
    label: string,
    name: 'calorieFloorEnabled' | 'manualTdeeEnabled'
  ) => (
    <div className="bg-secondary flex min-h-11 items-center justify-between gap-3 rounded-xl px-3.5">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <Switch id={id} checked={value} onCheckedChange={onChange} />
        )}
      />
    </div>
  )

  const submit = (values: CreateProgramFormValues) => {
    if (isPending) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex max-w-3xl flex-col gap-4 pb-4">
      <FormErrorAlert title="Không tạo được program" message={error} />

      {section(
        '1. Mục tiêu',
        undefined,
        <Controller
          control={control}
          name="goalType"
          render={({ field: { value, onChange } }) => (
            <ChoiceGroup
              options={GOAL_CHOICES}
              value={value}
              onValueChange={onChange}
              aria-label="Mục tiêu"
            />
          )}
        />
      )}

      {section(
        '2. Tốc độ',
        'MacroFactor khuyến nghị 0,25 đến 1 % cân nặng mỗi tuần. Giữ cân là 0. BE tự đặt dấu theo mục tiêu.',
        <FormField label="Tốc độ (%/tuần)" error={errors.weeklyWeightChangeTargetPercent?.message}>
          {(field) => (
            <Input
              {...field}
              type="number"
              inputMode="decimal"
              step="0.05"
              min={0}
              max={1.5}
              disabled={goalType === 'Maintenance'}
              {...register('weeklyWeightChangeTargetPercent', { valueAsNumber: true })}
            />
          )}
        </FormField>
      )}

      {section(
        '3. Program style',
        undefined,
        <Controller
          control={control}
          name="programType"
          render={({ field: { value, onChange } }) => (
            <ChoiceGroup
              options={PROGRAM_CHOICES}
              value={value}
              onValueChange={onChange}
              aria-label="Program style"
            />
          )}
        />
      )}

      {section(
        '4. Diet style',
        undefined,
        <Controller
          control={control}
          name="dietStyle"
          render={({ field: { value, onChange } }) => (
            <ChoiceGroup
              options={DIET_CHOICES}
              value={value}
              onValueChange={onChange}
              aria-label="Diet style"
              columns={2}
            />
          )}
        />
      )}

      {section(
        '5. Protein',
        'Có tập tạ (trong hồ sơ) cộng thêm 0,2 g/kg.',
        <Controller
          control={control}
          name="proteinLevel"
          render={({ field: { value, onChange } }) => (
            <ChoiceGroup
              options={PROTEIN_CHOICES}
              value={value}
              onValueChange={onChange}
              aria-label="Mức protein"
              columns={2}
            />
          )}
        />
      )}

      {programType === 'Coached' &&
        section(
          '6. Sàn kcal mỗi ngày',
          undefined,
          <>
            {switchRow('floor-enabled', 'Bật sàn (mặc định 1200 kcal)', 'calorieFloorEnabled')}
            {floorEnabled && (
              <FormField label="Sàn (kcal)" error={errors.calorieFloorKcal?.message}>
                {(field) => (
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    {...register('calorieFloorKcal', { valueAsNumber: true })}
                  />
                )}
              </FormField>
            )}
          </>
        )}

      {section(
        '7. Ngày check-in hằng tuần',
        undefined,
        <FormField label="Ngày check-in" required error={errors.checkInWeekday?.message}>
          {(field) => (
            <Controller
              control={control}
              name="checkInWeekday"
              render={({ field: { value, onChange } }) => (
                <PickerSelect
                  {...field}
                  title="Ngày check-in"
                  options={enumOptions(DAY_OF_WEEK)}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            />
          )}
        </FormField>
      )}

      {section(
        '8. TDEE khởi điểm',
        undefined,
        <>
          {switchRow(
            'manual-tdee',
            'Nhập tay thay vì công thức Mifflin-St Jeor',
            'manualTdeeEnabled'
          )}
          {manualTdeeEnabled && (
            <FormField label="TDEE (kcal/ngày)" error={errors.manualInitialTdeeKcal?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  inputMode="numeric"
                  {...register('manualInitialTdeeKcal', { valueAsNumber: true })}
                />
              )}
            </FormField>
          )}
        </>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {isPending ? 'Đang tạo...' : 'Bắt đầu program'}
        </Button>
      </div>
    </form>
  )
}
