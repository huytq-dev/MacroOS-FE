'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MEAL_TYPE, enumOptions, type MealType } from '@/config/enums'
import type { FoodDetail } from '@/features/foods/types/food.types'
import type { FoodLogEntry, UpdateEntryRequest } from '../../types/food-log.types'

interface EntryEditDialogProps {
  readonly entry: FoodLogEntry | null
  readonly food?: FoodDetail
  readonly isFoodLoading: boolean
  readonly isPending: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSave: (id: string, payload: UpdateEntryRequest) => void
  readonly onDelete: (id: string) => void
}

const GRAM = ''

type EditBodyProps = Omit<EntryEditDialogProps, 'entry' | 'onOpenChange'> & { readonly entry: FoodLogEntry }

/** Mount lại theo entry.id (key ở cha) nên state khởi tạo từ entry, không cần effect đồng bộ. */
function EditBody({ entry, food, isFoodLoading, isPending, onSave, onDelete }: EditBodyProps) {
  const [meal, setMeal] = useState<MealType>(entry.mealType)
  const [servingId, setServingId] = useState(entry.foodServingId ?? GRAM)
  const [quantity, setQuantity] = useState(String(entry.quantity))
  const quantityNumber = Number(quantity)
  const invalid = !(quantityNumber >= 0.01 && quantityNumber <= 10000)
  const editable = entry.foodItemId !== null

  return (
    <>
      <DialogHeader>
        <DialogTitle>{entry.foodName}</DialogTitle>
        <DialogDescription>
          {Math.round(entry.calories)} kcal · P {Math.round(entry.protein)} · C {Math.round(entry.carbs)} · F {Math.round(entry.fat)} (lúc log)
        </DialogDescription>
      </DialogHeader>
      {!editable ? (
        <p className="text-muted-foreground text-sm">Món từ công thức chưa sửa được.</p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-meal">Bữa</Label>
            <NativeSelect id="edit-meal" value={meal} onChange={(event) => setMeal(event.target.value as MealType)}>
              {enumOptions(MEAL_TYPE).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          {isFoodLoading || !food ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-serving">Khẩu phần</Label>
                <NativeSelect id="edit-serving" value={servingId} onChange={(event) => setServingId(event.target.value)}>
                  {food.servings.map((serving) => (
                    <option key={serving.id} value={serving.id}>
                      {serving.servingName} ({serving.weightInGrams} g)
                    </option>
                  ))}
                  <option value={GRAM}>Gram</option>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-quantity">{servingId === GRAM ? 'Số gram' : 'Số khẩu phần'}</Label>
                <Input id="edit-quantity" type="number" inputMode="decimal" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </div>
            </div>
          )}
        </div>
      )}
      <DialogFooter>
        <Button variant="destructive" onClick={() => onDelete(entry.id)} disabled={isPending}>
          Xoá
        </Button>
        {editable && (
          <Button
            disabled={isPending || invalid || !food}
            onClick={() =>
              onSave(entry.id, { mealType: meal, eatenAt: entry.eatenAt, foodServingId: servingId === GRAM ? null : servingId, quantity: quantityNumber })
            }
          >
            {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
            Lưu
          </Button>
        )}
      </DialogFooter>
    </>
  )
}

export function EntryEditDialog({ entry, onOpenChange, ...rest }: EntryEditDialogProps) {
  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent>{entry && <EditBody key={entry.id} entry={entry} {...rest} />}</DialogContent>
    </Dialog>
  )
}
