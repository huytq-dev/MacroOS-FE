import { ArrowDown, ArrowUp, ArrowUpDown, Heart, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'
import { IconButton } from '@/components/shared/IconButton'
import { Button } from '@/components/ui/button'
import { FoodIcon } from '@/features/foods/components/FoodIcon'
import type { FavoriteFood } from '@/features/foods/types/favorite.types'
import { servingAmountLabel } from '@/features/foods/types/food.types'

interface FavoriteListProps {
  readonly favorites: readonly FavoriteFood[]
  readonly onQuickAdd: (favorite: FavoriteFood) => void
  readonly onReorder: (ids: string[]) => void
  readonly onRemove: (id: string) => void
  /** Có từ khoá tìm: ẩn sắp xếp (chỉ sắp xếp được khi xem đủ danh sách). */
  readonly isFiltered: boolean
}

const quantityLabel = (favorite: FavoriteFood) =>
  favorite.foodServingId
    ? servingAmountLabel(favorite.quantity, favorite.servingName)
    : `${favorite.quantity} g`

/** Library → Favorites: danh sách preset, có chế độ "Sắp xếp" (lên/xuống, bỏ) như màn Reorder của MacroFactor. */
export function FavoriteList({
  favorites,
  onQuickAdd,
  onReorder,
  onRemove,
  isFiltered,
}: FavoriteListProps) {
  const [reordering, setReordering] = useState(false)

  if (favorites.length === 0)
    return (
      <EmptyState
        icon={Heart}
        title={isFiltered ? 'Không có kết quả phù hợp' : 'Chưa có món yêu thích'}
        description={
          isFiltered
            ? 'Thử từ khoá khác.'
            : 'Mở một món, chọn khẩu phần rồi chạm hình trái tim để lưu lại.'
        }
      />
    )

  const move = (index: number, offset: -1 | 1) => {
    const ids = favorites.map((favorite) => favorite.id)
    const target = index + offset
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    onReorder(ids)
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <h3 className="text-lg font-semibold md:text-sm">Yêu thích</h3>
        {!isFiltered && favorites.length > 1 && (
          <Button
            variant="ghost"
            className="h-10 rounded-full px-3 text-base md:h-8 md:text-sm"
            aria-pressed={reordering}
            onClick={() => setReordering((current) => !current)}
          >
            <ArrowUpDown aria-hidden="true" className="size-4" />
            {reordering ? 'Xong' : 'Sắp xếp'}
          </Button>
        )}
      </div>
      <ul className="divide-border divide-y">
        {favorites.map((favorite, index) => (
          <li key={favorite.id} className="flex min-h-16 items-center">
            <button
              type="button"
              disabled={reordering}
              onClick={() => onQuickAdd(favorite)}
              className="active:bg-muted focus-visible:ring-ring/50 flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2.5 pr-2 pl-4 text-left transition-colors focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset disabled:active:bg-transparent"
            >
              <FoodIcon name={favorite.foodName} category={favorite.category} />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-base leading-snug font-medium md:text-sm">
                  {favorite.foodName}
                </span>
                <span className="block text-sm tabular-nums md:text-xs">
                  <span className="text-mf-calories font-semibold">{favorite.calories} kcal</span>
                  <span className="text-muted-foreground">
                    {'  '}
                    {Math.round(favorite.protein)}P {Math.round(favorite.fat)}F{' '}
                    {Math.round(favorite.carbs)}C • {quantityLabel(favorite)}
                  </span>
                </span>
              </span>
            </button>
            {reordering ? (
              <div className="flex shrink-0 items-center pr-2">
                <IconButton
                  icon={ArrowUp}
                  label={`Đưa ${favorite.foodName} lên`}
                  className="size-11 md:size-8"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                />
                <IconButton
                  icon={ArrowDown}
                  label={`Đưa ${favorite.foodName} xuống`}
                  className="size-11 md:size-8"
                  disabled={index === favorites.length - 1}
                  onClick={() => move(index, 1)}
                />
                <IconButton
                  icon={Trash2}
                  label={`Bỏ ${favorite.foodName} khỏi yêu thích`}
                  className="text-muted-foreground hover:text-destructive size-11 md:size-8"
                  onClick={() => onRemove(favorite.id)}
                />
              </div>
            ) : (
              <button
                type="button"
                aria-label={`Thêm ${favorite.foodName}`}
                onClick={() => onQuickAdd(favorite)}
                className="bg-secondary active:bg-muted focus-visible:ring-ring/50 mr-3 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none md:size-9"
              >
                <Plus aria-hidden="true" className="size-5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
