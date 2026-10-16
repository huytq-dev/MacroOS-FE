import { Loader2, SearchX, Apple } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FoodRow } from './FoodRow'
import type { FoodSummary } from '../types/food.types'

interface FoodListProps {
  readonly items: FoodSummary[]
  readonly totalCount: number | null
  readonly isLoading: boolean
  readonly isFetching: boolean
  /** Có từ khoá hoặc bộ lọc → "rỗng do lọc" (nút Xoá bộ lọc), ngược lại "rỗng thật" (UI.md mục 16). */
  readonly isFiltered: boolean
  readonly onClearFilters: () => void
  readonly emptyAction?: React.ReactNode
  readonly onSelect: (food: FoodSummary) => void
  readonly onQuickAdd?: (food: FoodSummary) => void
  readonly onLoadMore: () => void
}

export function FoodList({
  items,
  totalCount,
  isLoading,
  isFetching,
  isFiltered,
  onClearFilters,
  emptyAction,
  onSelect,
  onQuickAdd,
  onLoadMore,
}: FoodListProps) {
  if (isLoading)
    return (
      <div className="space-y-1 p-3" aria-busy="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )

  if (items.length === 0)
    return isFiltered ? (
      <EmptyState
        icon={SearchX}
        title="Không có kết quả phù hợp"
        description="Thử từ khoá khác hoặc bỏ bộ lọc."
        action={
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Xoá bộ lọc
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Apple}
        title="Chưa có thực phẩm"
        description="Tạo món đầu tiên của bạn để dùng khi log."
        action={emptyAction}
      />
    )

  const hasMore = totalCount !== null && items.length < totalCount
  return (
    <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
      <p className="text-muted-foreground px-4 pt-3 pb-1 text-xs tabular-nums">
        {totalCount ?? items.length} kết quả
      </p>
      <div className="divide-border divide-y">
        {items.map((food) => (
          <FoodRow key={food.id} food={food} onSelect={onSelect} onQuickAdd={onQuickAdd} />
        ))}
      </div>
      {hasMore && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={onLoadMore}
            disabled={isFetching}
            aria-busy={isFetching}
          >
            {isFetching && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {isFetching ? 'Đang tải...' : `Tải thêm (${items.length}/${totalCount})`}
          </Button>
        </div>
      )}
    </div>
  )
}
