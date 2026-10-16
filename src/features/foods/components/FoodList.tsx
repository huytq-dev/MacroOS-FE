import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { FoodRow } from './FoodRow'
import type { FoodSummary } from '../types/food.types'

interface FoodListProps {
  readonly items: FoodSummary[]
  readonly totalCount: number | null
  readonly isLoading: boolean
  readonly isFetching: boolean
  readonly emptyText: string
  readonly onSelect: (food: FoodSummary) => void
  readonly onLoadMore: () => void
}

export function FoodList({ items, totalCount, isLoading, isFetching, emptyText, onSelect, onLoadMore }: FoodListProps) {
  if (isLoading)
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )
  if (items.length === 0) return <p className="text-muted-foreground px-3 py-8 text-center text-sm">{emptyText}</p>
  const hasMore = totalCount !== null && items.length < totalCount
  return (
    <div className="divide-y">
      {items.map((food) => (
        <FoodRow key={food.id} food={food} onSelect={onSelect} />
      ))}
      {hasMore && (
        <div className="p-2">
          <Button variant="ghost" className="w-full" onClick={onLoadMore} disabled={isFetching}>
            {isFetching ? 'Đang tải…' : `Tải thêm (${items.length}/${totalCount})`}
          </Button>
        </div>
      )}
    </div>
  )
}
