'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { DateField } from '@/components/shared/DateField'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MEAL_TYPE, enumOptions, type MealType } from '@/config/enums'
import { formatDateVi } from '@/lib/date'
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

const mealItems = enumOptions(MEAL_TYPE).map((option) => (
  <SelectItem key={option.value} value={option.value}>
    {option.label}
  </SelectItem>
))

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
          Sao chép từ {formatDateVi(fromDate)}
        </DialogTitle>
        <DialogDescription className="text-xs">
          Giữ nguyên dinh dưỡng đã log, không đọc lại thực phẩm.
        </DialogDescription>
      </DialogHeader>
      <FormErrorAlert title="Không sao chép được" message={error} />
      <div className="space-y-4">
        <FormField label="Sao chép">
          {(field) => (
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger id={field.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" position="popper" sideOffset={4}>
                <SelectItem value={DAY}>Cả ngày</SelectItem>
                {mealItems}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField
          label="Sang ngày"
          required
          error={sameTarget ? 'Nguồn và đích trùng nhau.' : undefined}
        >
          {(field) => <DateField {...field} value={toDate} onValueChange={setToDate} />}
        </FormField>
        {scope !== DAY && (
          <FormField label="Vào bữa">
            {(field) => (
              <Select value={toMeal} onValueChange={setToMeal}>
                <SelectTrigger id={field.id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" position="popper" sideOffset={4}>
                  <SelectItem value={SAME}>Giữ nguyên bữa</SelectItem>
                  {mealItems}
                </SelectContent>
              </Select>
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
          Huỷ
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
          {isPending ? 'Đang sao chép...' : 'Sao chép'}
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
