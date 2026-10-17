'use client'

import type { UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { DateField } from '@/components/shared/DateField'
import { FormField } from '@/components/shared/FormField'
import { formatDateVi } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LogWeightFormValues } from '../../schemas/log-weight.schema'

interface LogWeightDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly form: UseFormReturn<LogWeightFormValues>
  /** Sửa lần cân đã ghi: ngày cố định, chỉ đổi số cân. */
  readonly isEditing?: boolean
  readonly isPending: boolean
  readonly error: string | null
  readonly onSubmit: (values: LogWeightFormValues) => void
}

export function LogWeightDialog({
  open,
  onOpenChange,
  form,
  isEditing = false,
  isPending,
  error,
  onSubmit,
}: LogWeightDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form
  const submit = (values: LogWeightFormValues) => {
    if (isPending) return
    onSubmit(values)
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-sans text-xl font-bold sm:text-sm sm:font-semibold">
              {isEditing ? 'Edit weight' : 'Log weight'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-xs">
              {isEditing
                ? 'Change the weight for this day. Trend weight is recalculated from that day on.'
                : 'One entry per day. Logging again on the same day overwrites it and recalculates your trend.'}
            </DialogDescription>
          </DialogHeader>

          <FormErrorAlert title="Couldn't log weight" message={error} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Date" required error={errors.logDate?.message}>
              {(field) =>
                isEditing ? (
                  <Input {...field} readOnly value={formatDateVi(watch('logDate'))} />
                ) : (
                  <DateField
                    {...field}
                    value={watch('logDate')}
                    onValueChange={(next) => setValue('logDate', next, { shouldValidate: true })}
                  />
                )
              }
            </FormField>
            <FormField label="Weight (kg)" required error={errors.weightKg?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  autoFocus
                  className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  {...register('weightKg', { valueAsNumber: true })}
                />
              )}
            </FormField>
          </div>

          <DialogFooter className="flex-row gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-full text-base sm:h-8 sm:flex-none sm:rounded-md sm:text-xs"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-12 flex-1 rounded-full text-base sm:h-8 sm:flex-none sm:rounded-md sm:text-xs"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
