import { Plus } from 'lucide-react'
import { Energy, EnergyUnit } from '@/components/shared/Energy'
import { FoodIcon } from '@/features/foods/components/FoodIcon'
import type { FavoriteFood } from '@/features/foods/types/favorite.types'

interface FavoritesBarProps {
  readonly favorites: readonly FavoriteFood[]
  readonly onQuickAdd: (favorite: FavoriteFood) => void
}

/** Thanh yêu thích trên đầu kết quả tìm (kiểu MacroFactor): mỗi preset một ô, chạm là thêm ngay đúng khẩu phần đã lưu. */
export function FavoritesBar({ favorites, onQuickAdd }: FavoritesBarProps) {
  if (favorites.length === 0) return null
  return (
    <section aria-label="Favorites" className="space-y-2 pt-3">
      <h3 className="px-4 text-lg font-semibold md:text-sm">Favorites</h3>
      <ul className="flex gap-2 overflow-x-auto overscroll-x-contain px-3 pb-1">
        {favorites.map((favorite) => (
          <li key={favorite.id} className="w-24 shrink-0">
            <button
              type="button"
              onClick={() => onQuickAdd(favorite)}
              aria-label={`Add ${favorite.foodName}, ${favorite.quantity} ${favorite.servingName}`}
              className="focus-visible:ring-ring/50 flex w-full flex-col items-center gap-1 rounded-xl px-1 py-1.5 focus-visible:ring-1 focus-visible:outline-none active:opacity-70"
            >
              <span className="relative">
                <FoodIcon
                  name={favorite.foodName}
                  category={favorite.category}
                  className="size-14 text-5xl"
                />
                <span
                  aria-hidden="true"
                  className="bg-foreground text-background absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full"
                >
                  <Plus className="size-4" />
                </span>
              </span>
              <span className="line-clamp-2 text-center text-sm leading-tight md:text-xs">
                {favorite.foodName}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                <Energy kcal={favorite.calories} /> <EnergyUnit />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
