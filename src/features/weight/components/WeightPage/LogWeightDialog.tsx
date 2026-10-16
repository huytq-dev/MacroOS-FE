'use client'

import type { UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { DateField } from '@/components/shared/DateField'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  readonly isPending: boolean
  readonly error: string | null
  readonly onSubmit: (values: LogWeightFormValues) => void
}

export function LogWeightDialog({
  open,
  onOpenChange,
  form,
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
            <DialogTitle className="font-sans text-sm font-semibold">Ghi cân nặng</DialogTitle>
            <DialogDescription className="text-xs">
              Mỗi ngày một giá trị. Nhập lại cùng ngày sẽ ghi đè và tính lại trend.
            </DialogDescription>
          </DialogHeader>

          <FormErrorAlert title="Không ghi được cân nặng" message={error} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Ngày" required error={errors.logDate?.message}>
              {(field) => (
                <DateField
                  {...field}
                  value={watch('logDate')}
                  onValueChange={(next) => setValue('logDate', next, { shouldValidate: true })}
                />
              )}
            </FormField>
            <FormField label="Cân nặng (kg)" required error={errors.weightKg?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  autoFocus
                  {...register('weightKg', { valueAsNumber: true })}
                />
              )}
            </FormField>
          </div>

          <FormField
            label="Ghi chú"
            hint="Không bắt buộc"
            error={errors.notes?.message}
            counter={{ current: watch('notes')?.length ?? 0, max: 500 }}
          >
            {(field) => <Textarea {...field} rows={2} maxLength={500} {...register('notes')} />}
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
