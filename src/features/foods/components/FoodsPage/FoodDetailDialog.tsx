import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FOOD_CATEGORY } from '@/config/enums'
import type { FoodDetail } from '../../types/food.types'

interface FoodDetailDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly food?: FoodDetail
  readonly isLoading: boolean
  readonly onEdit: (food: FoodDetail) => void
  readonly onRequestDelete: (food: FoodDetail) => void
}

const cell = (label: string, value: number | null | undefined, unit: string) =>
  value === null || value === undefined ? null : (
    <div key={label} className="bg-secondary rounded-xl px-3.5 py-2.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-base font-semibold tabular-nums">
        {Math.round(value * 10) / 10}{' '}
        <span className="text-muted-foreground text-xs font-normal">{unit}</span>
      </p>
    </div>
  )

export function FoodDetailDialog({
  open,
  onOpenChange,
  food,
  isLoading,
  onEdit,
  onRequestDelete,
}: FoodDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-sans text-sm font-semibold">
            {food?.name ?? 'Thực phẩm'}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1.5 text-xs">
            {food ? (
              <>
                {food.brand && <span>{food.brand}</span>}
                <Badge variant="outline">{FOOD_CATEGORY[food.category]}</Badge>
                {food.isMine && (
                  <Badge
                    variant="secondary"
                    className="bg-mf-pastel-green text-mf-pastel-green-text"
                  >
                    Của tôi
                  </Badge>
                )}
              </>
            ) : (
              'Dinh dưỡng trên 100 g'
            )}
          </DialogDescription>
        </DialogHeader>
        {isLoading || !food ? (
          <Skeleton className="h-40 w-full" aria-busy="true" />
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
              <p className="text-muted-foreground mb-1.5 text-xs">Khẩu phần</p>
              <ul className="divide-border divide-y text-sm">
                {food.servings.map((serving) => (
                  <li key={serving.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="flex items-center gap-1.5">
                      {serving.servingName}
                      {serving.isDefault && <Badge variant="outline">Mặc định</Badge>}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {serving.weightInGrams} g
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {food.isMine && (
              <DialogFooter>
                <Button variant="destructive" onClick={() => onRequestDelete(food)}>
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
