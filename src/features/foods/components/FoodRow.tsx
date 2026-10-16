import { ChevronRight } from 'lucide-react'
import type { FoodSummary } from '../types/food.types'

interface FoodRowProps {
  readonly food: FoodSummary
  readonly onSelect: (food: FoodSummary) => void
  readonly trailing?: React.ReactNode
}

/** Dòng thực phẩm dùng chung (thư viện, tìm khi log). Cao ≥ 56px để chạm bằng ngón cái. */
export function FoodRow({ food, onSelect, trailing }: FoodRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(food)}
      className="hover:bg-muted active:bg-muted flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left transition-colors"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{food.name}</span>
        <span className="text-muted-foreground block truncate text-xs">
          {food.brand ? `${food.brand} · ` : ''}
          {Math.round(food.caloriesPer100g)} kcal · P {Math.round(food.proteinPer100g)} · C {Math.round(food.carbsPer100g)} · F{' '}
          {Math.round(food.fatPer100g)} /100 g
        </span>
      </span>
      {food.isMine && <span className="bg-mf-pastel-green text-mf-pastel-green-text shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">Của tôi</span>}
      {trailing ?? <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />}
    </button>
  )
}
