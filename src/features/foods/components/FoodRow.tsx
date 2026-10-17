import { ChevronRight, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FoodIcon } from './FoodIcon'
import { scaleNutrition, type FoodSummary } from '../types/food.types'

interface FoodRowProps {
  readonly food: FoodSummary
  readonly onSelect: (food: FoodSummary) => void
  /** Có thì hiện nút + tròn: thêm ngay 1 khẩu phần mặc định, không qua màn chọn khẩu phần. */
  readonly onQuickAdd?: (food: FoodSummary) => void
  readonly trailing?: React.ReactNode
}

/** Dòng thực phẩm dùng chung (thư viện, tìm khi log): tên, kcal và macro của MỘT khẩu phần mặc định (kiểu MacroFactor). */
export function FoodRow({ food, onSelect, onQuickAdd, trailing }: FoodRowProps) {
  const grams = food.defaultServingGrams
  return (
    <div className="flex min-h-16 items-center">
      <button
        type="button"
        onClick={() => onSelect(food)}
        className="hover:bg-muted/60 active:bg-muted focus-visible:ring-ring/50 flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2.5 pr-2 pl-4 text-left transition-colors focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset"
      >
        <FoodIcon name={food.name} category={food.category} />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-base leading-snug font-medium md:text-sm">
            {food.name}
          </span>
          <span className="block text-sm tabular-nums md:text-xs">
            <span className="text-mf-calories font-semibold">
              {scaleNutrition(food.caloriesPer100g, grams)} kcal
            </span>
            <span className="text-muted-foreground">
              {'  '}
              {scaleNutrition(food.proteinPer100g, grams)}P {scaleNutrition(food.fatPer100g, grams)}
              F {scaleNutrition(food.carbsPer100g, grams)}C • {food.defaultServingName} (
              {Math.round(grams)} g)
            </span>
          </span>
        </span>
        {food.isMine && (
          <Badge
            variant="secondary"
            className="bg-mf-pastel-green text-mf-pastel-green-text shrink-0"
          >
            Mine
          </Badge>
        )}
        {!onQuickAdd &&
          (trailing ?? (
            <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          ))}
      </button>
      {onQuickAdd && (
        <button
          type="button"
          aria-label={`Add ${food.name}`}
          onClick={() => onQuickAdd(food)}
          className="bg-secondary active:bg-muted focus-visible:ring-ring/50 mr-3 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none md:size-9"
        >
          <Plus aria-hidden="true" className="size-5" />
        </button>
      )}
    </div>
  )
}
