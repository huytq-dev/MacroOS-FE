'use client'

import { Search } from 'lucide-react'
import { FoodList } from '@/features/foods/components/FoodList'
import type { FoodDetail, FoodSummary } from '@/features/foods/types/food.types'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { PlateItem } from '../../types/food-log.types'
import { FoodPicker } from './FoodPicker'

interface FoodSearchPanelProps {
  readonly search: string
  readonly onSearchChange: (value: string) => void
  readonly items: FoodSummary[]
  readonly totalCount: number | null
  readonly isLoading: boolean
  readonly isFetching: boolean
  readonly onLoadMore: () => void
  readonly pickedId: string | null
  readonly picked?: FoodDetail
  readonly onPick: (food: FoodSummary) => void
  readonly onBack: () => void
  readonly onAddToPlate: (item: PlateItem) => void
}

export function FoodSearchPanel({
  search,
  onSearchChange,
  items,
  totalCount,
  isLoading,
  isFetching,
  onLoadMore,
  pickedId,
  picked,
  onPick,
  onBack,
  onAddToPlate,
}: FoodSearchPanelProps) {
  if (pickedId) {
    if (!picked) return <Skeleton className="m-4 h-56" />
    return <FoodPicker key={picked.id} food={picked} onBack={onBack} onAdd={onAddToPlate} />
  }

  return (
    <div>
      <div className="bg-background sticky top-0 z-10 border-b p-3">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
          <Input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Tìm theo tên hoặc thương hiệu"
            value={search}
            className="pl-9"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
      <FoodList
        items={items}
        totalCount={totalCount}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyText={search ? 'Không tìm thấy. Thử từ khoá khác hoặc dùng Nhập nhanh.' : 'Chưa có thực phẩm. Tạo ở mục Thực phẩm hoặc dùng Nhập nhanh.'}
        onSelect={onPick}
        onLoadMore={onLoadMore}
      />
    </div>
  )
}
