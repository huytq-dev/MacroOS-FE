import { Plus } from 'lucide-react'
import { FoodIcon } from '@/features/foods/components/FoodIcon'
import type { FoodSummary } from '@/features/foods/types/food.types'

interface RecentFoodsProps {
  readonly foods: readonly FoodSummary[]
  readonly onQuickAdd: (food: FoodSummary) => void
}

/** Hàng ngang món vừa log (kiểu "Favorites" của MacroFactor): chạm là thêm ngay 1 khẩu phần mặc định. */
export function RecentFoods({ foods, onQuickAdd }: RecentFoodsProps) {
  if (foods.length === 0) return null
  return (
    <section aria-label="Món gần đây" className="space-y-2 pt-3">
      <h3 className="px-4 text-base font-semibold md:text-sm">Gần đây</h3>
      <ul className="flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1">
        {foods.map((food) => (
          <li key={food.id} className="w-20 shrink-0">
            <button
              type="button"
              onClick={() => onQuickAdd(food)}
              aria-label={`Thêm ${food.name}`}
              className="focus-visible:ring-ring/50 flex w-full flex-col items-center gap-1.5 rounded-xl py-1 focus-visible:ring-1 focus-visible:outline-none active:opacity-70"
            >
              <span className="relative">
                <FoodIcon name={food.name} category={food.category} className="size-14 text-5xl" />
                <span
                  aria-hidden="true"
                  className="bg-foreground text-background absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full"
                >
                  <Plus className="size-4" />
                </span>
              </span>
              <span className="line-clamp-2 text-center text-xs leading-tight">{food.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
