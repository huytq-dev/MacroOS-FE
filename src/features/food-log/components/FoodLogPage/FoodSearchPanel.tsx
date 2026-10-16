'use client'

import { FoodList } from '@/features/foods/components/FoodList'
import {
  scaleNutrition,
  type FoodDetail,
  type FoodSummary,
} from '@/features/foods/types/food.types'
import { SearchInput } from '@/components/shared/SearchInput'
import { Skeleton } from '@/components/ui/skeleton'
import type { PlateItem } from '../../types/food-log.types'
import { FoodPicker } from './FoodPicker'
import { RecentFoods } from './RecentFoods'

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
    if (!picked) return <Skeleton className="m-4 h-56 rounded-2xl" aria-busy="true" />
    return <FoodPicker key={picked.id} food={picked} onBack={onBack} onAdd={onAddToPlate} />
  }

  const quickAdd = (food: FoodSummary) =>
    onAddToPlate({
      key: `${food.id}-${Date.now()}`,
      foodItemId: food.id,
      name: food.name,
      foodServingId: food.defaultServingId,
      servingLabel: food.defaultServingId
        ? `1 × ${food.defaultServingName}`
        : `${food.defaultServingGrams} g`,
      quantity: food.defaultServingId ? 1 : food.defaultServingGrams,
      calories: scaleNutrition(food.caloriesPer100g, food.defaultServingGrams),
      protein: scaleNutrition(food.proteinPer100g, food.defaultServingGrams),
      carbs: scaleNutrition(food.carbsPer100g, food.defaultServingGrams),
      fat: scaleNutrition(food.fatPer100g, food.defaultServingGrams),
    })

  const recent = search.trim() === '' ? items.filter((item) => item.lastLoggedAt).slice(0, 10) : []

  return (
    <div>
      <div className="bg-background sticky top-0 z-10 p-3">
        <SearchInput
          value={search}
          onValueChange={onSearchChange}
          placeholder="Tìm theo tên hoặc thương hiệu"
          aria-label="Tìm thực phẩm"
        />
      </div>
      <RecentFoods foods={recent} onQuickAdd={quickAdd} />
      {search.trim() === '' && (
        <h3 className="px-4 pt-4 text-base font-semibold md:text-sm">Thực phẩm</h3>
      )}
      <FoodList
        items={items}
        totalCount={totalCount}
        isLoading={isLoading}
        isFetching={isFetching}
        isFiltered={search.trim() !== ''}
        onClearFilters={() => onSearchChange('')}
        onSelect={onPick}
        onQuickAdd={quickAdd}
        onLoadMore={onLoadMore}
      />
    </div>
  )
}
