'use client'

import type { UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DAY_OF_WEEK, DIET_STYLE, GOAL_TYPE, PROGRAM_TYPE, PROTEIN_LEVEL, enumOptions } from '@/config/enums'
import { cn } from '@/lib/utils'
import type { CreateProgramFormValues } from '../../schemas/create-program.schema'

interface CreateProgramFormProps {
  readonly form: UseFormReturn<CreateProgramFormValues>
  readonly isPending: boolean
  readonly onSubmit: (values: CreateProgramFormValues) => void
}

type EnumField = 'goalType' | 'programType' | 'dietStyle' | 'proteinLevel' | 'checkInWeekday'

function FieldMessage({ message }: { readonly message?: string }) {
  return message ? <p className="text-destructive text-[11px]">{message}</p> : null
}

/** Wizard rút gọn: các bước MacroFactor xếp thành mục trên một trang (ponytail: không multi-step). */
export function CreateProgramForm({ form, isPending, onSubmit }: CreateProgramFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form
  const goalType = watch('goalType')
  const programType = watch('programType')
  const floorEnabled = watch('calorieFloorEnabled')
  const manualTdeeEnabled = watch('manualTdeeEnabled')

  const choice = (name: EnumField, title: string, labels: Record<string, string>, hint?: string) => {
    const current = watch(name)
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {enumOptions(labels).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue(name, option.value as CreateProgramFormValues[typeof name], { shouldDirty: true })}
              aria-pressed={current === option.value}
              className={cn(
                'min-h-10 rounded-md border px-3 py-2 text-left text-xs transition-colors',
                current === option.value ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-3xl flex-col gap-5 pb-4">
      {choice('goalType', '1. Mục tiêu', GOAL_TYPE)}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">2. Tốc độ (% cân nặng / tuần)</h2>
        <p className="text-muted-foreground text-xs">MacroFactor khuyến nghị 0.25–1 %. Giữ cân = 0. BE tự đặt dấu theo mục tiêu.</p>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            inputMode="decimal"
            step="0.05"
            min={0}
            max={1.5}
            className="w-28"
            disabled={goalType === 'Maintenance'}
            {...register('weeklyWeightChangeTargetPercent', { valueAsNumber: true })}
          />
          <span className="text-xs">%/tuần</span>
        </div>
        <FieldMessage message={errors.weeklyWeightChangeTargetPercent?.message} />
      </section>

      {choice('programType', '3. Program style', PROGRAM_TYPE)}
      {choice('dietStyle', '4. Diet style', DIET_STYLE)}
      {choice('proteinLevel', '5. Protein', PROTEIN_LEVEL, 'Có tập tạ (trong hồ sơ) cộng thêm 0.2 g/kg.')}

      {programType === 'Coached' && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">6. Sàn kcal/ngày</h2>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" {...register('calorieFloorEnabled')} /> Bật sàn (mặc định 1200 kcal)
          </label>
          {floorEnabled && (
            <>
              <Input type="number" inputMode="numeric" className="w-28" {...register('calorieFloorKcal', { valueAsNumber: true })} />
              <FieldMessage message={errors.calorieFloorKcal?.message} />
            </>
          )}
        </section>
      )}

      {choice('checkInWeekday', '7. Ngày check-in hằng tuần', DAY_OF_WEEK)}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">8. TDEE khởi điểm</h2>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" {...register('manualTdeeEnabled')} /> Nhập tay thay vì công thức Mifflin-St Jeor
        </label>
        {manualTdeeEnabled && (
          <>
            <div className="flex items-center gap-3">
              <Input type="number" inputMode="numeric" className="w-28" {...register('manualInitialTdeeKcal', { valueAsNumber: true })} />
              <span className="text-xs">kcal/ngày</span>
            </div>
            <FieldMessage message={errors.manualInitialTdeeKcal?.message} />
          </>
        )}
      </section>

      <div className="flex justify-end">
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
          Bắt đầu program
        </Button>
      </div>
    </form>
  )
}
