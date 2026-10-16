import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FOOD_CATEGORY } from '@/config/enums'
import type { FoodDetail } from '../../types/food.types'

interface FoodDetailDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly food?: FoodDetail
  readonly isLoading: boolean
  readonly isDeleting: boolean
  readonly onEdit: (food: FoodDetail) => void
  readonly onDelete: (id: string) => void
}

const cell = (label: string, value: number | null | undefined, unit: string) =>
  value === null || value === undefined ? null : (
    <div key={label} className="rounded-md border px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-base font-semibold tabular-nums">
        {Math.round(value * 10) / 10} <span className="text-muted-foreground text-xs font-normal">{unit}</span>
      </p>
    </div>
  )

export function FoodDetailDialog({ open, onOpenChange, food, isLoading, isDeleting, onEdit, onDelete }: FoodDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{food?.name ?? 'Thực phẩm'}</DialogTitle>
          <DialogDescription>
            {food ? `${food.brand ? `${food.brand} · ` : ''}${FOOD_CATEGORY[food.category]}` : 'Dinh dưỡng trên 100 g'}
          </DialogDescription>
        </DialogHeader>
        {isLoading || !food ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {cell('Calories', food.nutrition.caloriesPer100g, 'kcal')}
              {cell('Protein', food.nutrition.proteinPer100g, 'g')}
              {cell('Carbs', food.nutrition.carbsPer100g, 'g')}
              {cell('Fat', food.nutrition.fatPer100g, 'g')}
              {cell('Fiber', food.nutrition.fiberPer100g, 'g')}
              {cell('Sodium', food.nutrition.sodiumPer100g, 'mg')}
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Khẩu phần</p>
              <ul className="space-y-1 text-sm">
                {food.servings.map((serving) => (
                  <li key={serving.id} className="flex justify-between">
                    <span>
                      {serving.servingName}
                      {serving.isDefault && ' (mặc định)'}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{serving.weightInGrams} g</span>
                  </li>
                ))}
              </ul>
            </div>
            {food.isMine && (
              <DialogFooter>
                <Button variant="destructive" onClick={() => onDelete(food.id)} disabled={isDeleting}>
                  Xoá
                </Button>
                <Button onClick={() => onEdit(food)}>Sửa</Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
