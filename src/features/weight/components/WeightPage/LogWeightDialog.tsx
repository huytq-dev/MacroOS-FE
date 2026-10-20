'use client'

import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { DateField } from '@/components/shared/DateField'
import { FormField } from '@/components/shared/FormField'
import { NumericKeypad } from '@/components/shared/NumericKeypad'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { formatDate } from '@/lib/date'
import { normalizeDecimal } from '@/lib/utils'
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
  /** Các ngày đã có bản ghi cân; nút Delete chỉ hiện khi ngày đang chọn nằm trong danh sách (cần kèm `onDelete`). */
  readonly entryDates?: readonly string[]
  readonly onDelete?: (logDate: string) => void
}

/** Cân nặng tối đa 3 chữ số nguyên và 1 số lẻ ("79", "79.", "79.3"); dấu thập phân luôn là ".". */
const WEIGHT_TEXT = /^\d{0,3}(\.\d?)?$/

/**
 * Ô nhập cân: cảm ứng dùng bàn phím số riêng (giống Food Detail, dấu "." thay vì "," của bàn phím iOS tiếng Việt), máy tính dùng bàn
 * phím thường. Giữ chuỗi đang gõ ("79.") riêng, form nhận số hoặc NaN khi chưa nhập đủ.
 */
function WeightInput({ form }: { readonly form: UseFormReturn<LogWeightFormValues> }) {
  const coarse = useCoarsePointer()
  const [text, setText] = useState(() => {
    const value = form.getValues('weightKg')
    return Number.isFinite(value) ? String(value) : ''
  })
  const error = form.formState.errors.weightKg?.message

  const update = (raw: string) => {
    const next = normalizeDecimal(raw)
    if (!WEIGHT_TEXT.test(next)) return
    setText(next)
    form.setValue('weightKg', next === '' || next === '.' ? Number.NaN : Number(next), {
      shouldValidate: form.formState.isSubmitted,
    })
  }

  return (
    <>
      <FormField label="Weight (kg)" required error={error}>
        {(field) => (
          <Input
            {...field}
            type="text"
            inputMode={coarse ? 'none' : 'decimal'}
            autoComplete="off"
            autoFocus
            value={text}
            onChange={(event) => update(event.target.value)}
          />
        )}
      </FormField>
      {coarse && (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300 sm:col-span-2">
          <NumericKeypad
            allowFraction={false}
            onKey={(key) => update(text + key)}
            onBackspace={() => update(text.slice(0, -1))}
          />
        </div>
      )}
    </>
  )
}

export function LogWeightDialog({
  open,
  onOpenChange,
  form,
  isEditing = false,
  isPending,
  error,
  onSubmit,
  entryDates,
  onDelete,
}: LogWeightDialogProps) {
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form
  const logDate = watch('logDate')
  const canDelete = onDelete !== undefined && (isEditing || entryDates?.includes(logDate) === true)
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
              Scale Weight
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
                  <Input {...field} readOnly value={formatDate(logDate)} />
                ) : (
                  <DateField
                    {...field}
                    value={logDate}
                    onValueChange={(next) => setValue('logDate', next, { shouldValidate: true })}
                  />
                )
              }
            </FormField>
            <WeightInput form={form} />
          </div>

          <DialogFooter className="flex-row gap-3 sm:gap-2">
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive h-12 rounded-full px-4 text-base sm:h-8 sm:rounded-md sm:text-xs"
                onClick={() => onDelete(logDate)}
                disabled={isPending}
              >
                Delete
              </Button>
            )}
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
