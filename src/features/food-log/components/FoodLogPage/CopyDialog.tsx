'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MEAL_TYPE, enumOptions, type MealType } from '@/config/enums'
import { formatDateVi } from '@/lib/date'
import type { CopyRequest } from '../../types/food-log.types'

interface CopyDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly fromDate: string
  readonly defaultToDate: string
  readonly isPending: boolean
  readonly onCopy: (payload: CopyRequest) => void
}

const DAY = 'day'
const SAME = 'same'

type BodyProps = Omit<CopyDialogProps, 'open' | 'onOpenChange'>

/** Chỉ mount khi dialog mở → state luôn khởi tạo lại từ ngày hiện tại. */
function CopyBody({ fromDate, defaultToDate, isPending, onCopy }: BodyProps) {
  const [scope, setScope] = useState<string>(DAY)
  const [toDate, setToDate] = useState(defaultToDate)
  const [toMeal, setToMeal] = useState<string>(SAME)

  const meal = scope === DAY ? null : (scope as MealType)
  const targetMeal = toMeal === SAME ? null : (toMeal as MealType)
  // BE từ chối nguồn = đích (cùng ngày và cùng bữa)
  const sameTarget = toDate === fromDate && (meal === null || targetMeal === null || targetMeal === meal)
  const canCopy = Boolean(toDate) && !sameTarget && !isPending

  return (
    <>
      <DialogHeader>
        <DialogTitle>Sao chép từ {formatDateVi(fromDate)}</DialogTitle>
        <DialogDescription>Giữ nguyên dinh dưỡng đã log, không đọc lại thực phẩm.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="copy-scope">Sao chép</Label>
          <NativeSelect id="copy-scope" value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value={DAY}>Cả ngày</option>
            {enumOptions(MEAL_TYPE).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="copy-date">Sang ngày</Label>
          <Input id="copy-date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
        {scope !== DAY && (
          <div className="space-y-1.5">
            <Label htmlFor="copy-meal">Vào bữa</Label>
            <NativeSelect id="copy-meal" value={toMeal} onChange={(event) => setToMeal(event.target.value)}>
              <option value={SAME}>Giữ nguyên bữa</option>
              {enumOptions(MEAL_TYPE).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        {sameTarget && <p className="text-destructive text-[11px]">Nguồn và đích trùng nhau.</p>}
      </div>
      <DialogFooter>
        <Button disabled={!canCopy} onClick={() => onCopy({ fromDate, toDate, mealType: meal, toMealType: meal === null ? null : targetMeal })}>
          {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
          Sao chép
        </Button>
      </DialogFooter>
    </>
  )
}

export function CopyDialog({ open, onOpenChange, ...rest }: CopyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <CopyBody {...rest} />}</DialogContent>
    </Dialog>
  )
}
