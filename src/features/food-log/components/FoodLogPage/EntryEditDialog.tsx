'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MEAL_TYPE, enumOptions, type MealType } from '@/config/enums'
import type { FoodDetail } from '@/features/foods/types/food.types'
import type { FoodLogEntry, UpdateEntryRequest } from '../../types/food-log.types'

interface EntryEditDialogProps {
  readonly entry: FoodLogEntry | null
  readonly food?: FoodDetail
  readonly isFoodLoading: boolean
  readonly isPending: boolean
  readonly error: string | null
  readonly onOpenChange: (open: boolean) => void
  readonly onSave: (id: string, payload: UpdateEntryRequest) => void
  /** Xoá cần xác nhận → cha mở ConfirmDialog. */
  readonly onRequestDelete: (entry: FoodLogEntry) => void
}

// Radix Select không nhận value rỗng → dùng sentinel cho "Gram"
const GRAM = 'gram'

type EditBodyProps = Omit<EntryEditDialogProps, 'entry' | 'onOpenChange'> & {
  readonly entry: FoodLogEntry
  readonly onClose: () => void
}

/** Mount lại theo entry.id (key ở cha) nên state khởi tạo từ entry, không cần effect đồng bộ. */
function EditBody({
  entry,
  food,
  isFoodLoading,
  isPending,
  error,
  onSave,
  onRequestDelete,
  onClose,
}: EditBodyProps) {
  const [meal, setMeal] = useState<MealType>(entry.mealType)
  const [servingId, setServingId] = useState(entry.foodServingId ?? GRAM)
  const [quantity, setQuantity] = useState(String(entry.quantity))
  const quantityNumber = Number(quantity)
  const invalid = !(quantityNumber >= 0.01 && quantityNumber <= 10000)
  const editable = entry.foodItemId !== null

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-sans text-sm font-semibold">{entry.foodName}</DialogTitle>
        <DialogDescription className="text-xs tabular-nums">
          {Math.round(entry.calories)} kcal · P {Math.round(entry.protein)} · C{' '}
          {Math.round(entry.carbs)} · F {Math.round(entry.fat)} (as logged)
        </DialogDescription>
      </DialogHeader>
      <FormErrorAlert title="Couldn't save food" message={error} />
      {!editable ? (
        <p className="text-muted-foreground text-sm">
          Foods from recipes can&apos;t be edited yet.
        </p>
      ) : (
        <div className="space-y-4">
          <FormField label="Meal">
            {(field) => (
              <Select value={meal} onValueChange={(next) => setMeal(next as MealType)}>
                <SelectTrigger id={field.id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" position="popper" sideOffset={4}>
                  {enumOptions(MEAL_TYPE).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          {isFoodLoading || !food ? (
            <Skeleton className="h-20 w-full rounded-xl" aria-busy="true" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Serving">
                {(field) => (
                  <Select value={servingId} onValueChange={setServingId}>
                    <SelectTrigger id={field.id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start" position="popper" sideOffset={4}>
                      {food.servings.map((serving) => (
                        <SelectItem key={serving.id} value={serving.id}>
                          {serving.servingName} ({serving.weightInGrams} g)
                        </SelectItem>
                      ))}
                      <SelectItem value={GRAM}>Gram</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </FormField>
              <FormField
                label={servingId === GRAM ? 'Grams' : 'Servings'}
                error={invalid ? 'Enter a value from 0.01 to 10000' : undefined}
              >
                {(field) => (
                  <Input
                    {...field}
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                )}
              </FormField>
            </div>
          )}
        </div>
      )}
      <DialogFooter>
        <Button
          variant="outline"
          className="text-destructive sm:mr-auto"
          onClick={() => onRequestDelete(entry)}
          disabled={isPending}
        >
          Delete
        </Button>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        {editable && (
          <Button
            disabled={isPending || invalid || !food}
            aria-busy={isPending}
            onClick={() =>
              onSave(entry.id, {
                mealType: meal,
                eatenAt: entry.eatenAt,
                foodServingId: servingId === GRAM ? null : servingId,
                quantity: quantityNumber,
              })
            }
          >
            {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}

export function EntryEditDialog({ entry, onOpenChange, ...rest }: EntryEditDialogProps) {
  return (
    <Dialog open={entry !== null} onOpenChange={(next) => !rest.isPending && onOpenChange(next)}>
      <DialogContent>
        {entry && (
          <EditBody key={entry.id} entry={entry} {...rest} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
