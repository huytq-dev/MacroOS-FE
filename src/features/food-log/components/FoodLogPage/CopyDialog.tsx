'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { DateField } from '@/components/shared/DateField'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { PickerSelect } from '@/components/shared/PickerSelect'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MEAL_TYPE, enumOptions, type MealType } from '@/config/enums'
import { formatDate } from '@/lib/date'
import type { CopyRequest } from '../../types/food-log.types'

interface CopyDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly fromDate: string
  readonly defaultToDate: string
  readonly isPending: boolean
  readonly error: string | null
  readonly onCopy: (payload: CopyRequest) => void
}

const DAY = 'day'
const SAME = 'same'

type BodyProps = Omit<CopyDialogProps, 'open'>

const MEALS = enumOptions(MEAL_TYPE)
const SCOPE_OPTIONS = [{ value: DAY, label: 'Whole day' }, ...MEALS]
const TO_MEAL_OPTIONS = [{ value: SAME, label: 'Same meal' }, ...MEALS]

/** Chỉ mount khi dialog mở → state luôn khởi tạo lại từ ngày hiện tại. */
function CopyBody({ fromDate, defaultToDate, isPending, error, onOpenChange, onCopy }: BodyProps) {
  const [scope, setScope] = useState<string>(DAY)
  const [toDate, setToDate] = useState(defaultToDate)
  const [toMeal, setToMeal] = useState<string>(SAME)

  const meal = scope === DAY ? null : (scope as MealType)
  const targetMeal = toMeal === SAME ? null : (toMeal as MealType)
  // BE từ chối nguồn = đích (cùng ngày và cùng bữa)
  const sameTarget =
    toDate === fromDate && (meal === null || targetMeal === null || targetMeal === meal)
  const canCopy = Boolean(toDate) && !sameTarget && !isPending

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-sans text-sm font-semibold">
          Copy from {formatDate(fromDate)}
        </DialogTitle>
        <DialogDescription className="text-xs">
          Copies nutrition exactly as it was logged.
        </DialogDescription>
      </DialogHeader>
      <FormErrorAlert title="Couldn't copy" message={error} />
      <div className="space-y-4">
        <FormField label="Copy">
          {(field) => (
            <PickerSelect
              {...field}
              title="Copy"
              options={SCOPE_OPTIONS}
              value={scope}
              onValueChange={setScope}
            />
          )}
        </FormField>
        <FormField
          label="To date"
          required
          error={sameTarget ? 'Source and destination are the same.' : undefined}
        >
          {(field) => <DateField {...field} value={toDate} onValueChange={setToDate} />}
        </FormField>
        {scope !== DAY && (
          <FormField label="To meal">
            {(field) => (
              <PickerSelect
                {...field}
                title="To Meal"
                options={TO_MEAL_OPTIONS}
                value={toMeal}
                onValueChange={setToMeal}
              />
            )}
          </FormField>
        )}
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          disabled={!canCopy}
          aria-busy={isPending}
          onClick={() =>
            onCopy({
              fromDate,
              toDate,
              mealType: meal,
              toMealType: meal === null ? null : targetMeal,
            })
          }
        >
          {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {isPending ? 'Copying...' : 'Copy'}
        </Button>
      </DialogFooter>
    </>
  )
}

export function CopyDialog({ open, onOpenChange, ...rest }: CopyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !rest.isPending && onOpenChange(next)}>
      <DialogContent>{open && <CopyBody {...rest} onOpenChange={onOpenChange} />}</DialogContent>
    </Dialog>
  )
}
