'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FoodList } from '@/features/foods/components/FoodList'
import {
  scaleNutrition,
  servingAmountLabel,
  type FoodDetail,
  type FoodSummary,
} from '@/features/foods/types/food.types'
import type { FavoriteFood } from '@/features/foods/types/favorite.types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { TileOptions } from '../../food-log-settings'
import type { PlateItem } from '../../types/food-log.types'
import { FoodTile, type FoodTileData } from './FoodTile'
import { FoodDetailView, type FoodDetailExtras } from './FoodDetail'
import { FavoritesBar } from './FavoritesBar'

/** Dữ liệu ô món từ kết quả tìm kiếm: số theo khẩu phần mặc định (khẩu phần "1 cup" hoặc gram) và khối lượng của nó. */
const tileDataOfFood = (food: FoodSummary, highlight?: string): FoodTileData => ({
  name: food.brand ? `${food.name} (${food.brand})` : food.name,
  highlight,
  calories: scaleNutrition(food.caloriesPer100g, food.defaultServingGrams),
  protein: scaleNutrition(food.proteinPer100g, food.defaultServingGrams),
  fat: scaleNutrition(food.fatPer100g, food.defaultServingGrams),
  carbs: scaleNutrition(food.carbsPer100g, food.defaultServingGrams),
  servingText: food.defaultServingId
    ? servingAmountLabel(1, food.defaultServingName)
    : `${food.defaultServingGrams} g`,
  weightText: `${Math.round(food.defaultServingGrams)} g`,
  emoji: food.emoji ?? null,
  iconKey: food.iconKey ?? null,
})

const GROUP_ORDER = ['Common', 'Branded', 'Open Food Facts'] as const
type ResultGroupName = (typeof GROUP_ORDER)[number]
/** Mỗi nhóm hiện sẵn ngần này dòng; phần còn lại nằm sau "See N More". */
const GROUP_LIMIT = 5

/** Món OpenFoodFacts → "Open Food Facts"; có thương hiệu → "Branded"; còn lại (hệ thống, USDA, VN, tự tạo) → "Common". */
const groupOf = (food: FoodSummary): ResultGroupName =>
  food.source === 'OpenFoodFacts' ? 'Open Food Facts' : food.brand ? 'Branded' : 'Common'

/** Một nhóm kết quả: giữ nguyên thứ tự BE đã xếp hạng; phần vượt giới hạn mở/đóng bằng grid-rows 300ms. */
function ResultGroup({
  title,
  foods,
  renderRow,
}: {
  readonly title: ResultGroupName
  readonly foods: readonly FoodSummary[]
  readonly renderRow: (food: FoodSummary) => React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const head = foods.slice(0, GROUP_LIMIT)
  const rest = foods.slice(GROUP_LIMIT)
  return (
    <section aria-label={title}>
      <h3 className="px-4 pt-4 pb-1 text-xl font-bold">{title}</h3>
      <div className="divide-border divide-y">
        {head.map((food) => (
          <div key={food.id}>{renderRow(food)}</div>
        ))}
      </div>
      {rest.length > 0 && (
        <>
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
              expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
          >
            <div className="overflow-hidden" inert={!expanded}>
              <div className="divide-border border-border divide-y border-t">
                {rest.map((food) => (
                  <div key={food.id}>{renderRow(food)}</div>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground focus-visible:ring-ring/50 active:bg-muted flex min-h-12 w-full items-center px-4 text-base transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            {expanded ? 'See Less' : `See ${rest.length} More`}
          </button>
        </>
      )}
    </section>
  )
}

/** Khoá dòng plate phải khác nhau mỗi lần thêm (cùng món thêm nhiều lần); chỉ gọi trong sự kiện bấm. */
const newPlateKey = (id: string) => `${id}-${Date.now()}`

interface FoodSearchPanelProps {
  readonly search: string
  readonly onSearchChange: (value: string) => void
  /** Kết quả tìm kiếm; khi chưa gõ gì thì BE đã xếp theo lần log gần nhất và panel chỉ giữ các món từng log làm "History". */
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
  /** Cài đặt Logger Food Tiles: cách mỗi món hiện trong kết quả. */
  readonly tileOptions: TileOptions
  readonly favorites: readonly FavoriteFood[]
  readonly isFavoritePending: boolean
  readonly onAddFavorite: (foodItemId: string, servingId: string | null, quantity: number) => void
  readonly onRemoveFavorite: (id: string) => void
  /** Phần của màn Food Detail do trang quyết định (mục tiêu, ghi log ngay, sao chép thành món tự tạo). */
  readonly detail: FoodDetailExtras
}

/**
 * Tab Search (kiểu MacroFactor): chưa gõ thì hiện Favorites (nếu có) và "History" — các món đã từng log, mới nhất trước; chưa có
 * món nào thì thẻ "No history yet / Search for foods below". Gõ ở ô tìm dưới đáy thì hiện "Results". Chọn một món để chọn
 * khẩu phần, hoặc nút + để thêm ngay khẩu phần mặc định vào plate. Không có bộ lọc nguồn/nhóm món.
 */
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
  tileOptions,
  favorites,
  isFavoritePending,
  onAddFavorite,
  onRemoveFavorite,
  detail,
}: FoodSearchPanelProps) {
  if (pickedId) {
    if (!picked) return <Skeleton className="m-4 h-56 rounded-2xl" aria-busy="true" />
    return (
      <FoodDetailView
        key={picked.id}
        food={picked}
        onBack={onBack}
        onAdd={onAddToPlate}
        favorites={favorites.filter((item) => item.foodItemId === picked.id)}
        isFavoritePending={isFavoritePending}
        onAddFavorite={(servingId, quantity) => onAddFavorite(picked.id, servingId, quantity)}
        onRemoveFavorite={onRemoveFavorite}
        {...detail}
      />
    )
  }

  const quickAdd = (food: FoodSummary) =>
    onAddToPlate({
      key: newPlateKey(food.id),
      foodItemId: food.id,
      name: food.name,
      foodServingId: food.defaultServingId,
      servingLabel: food.defaultServingId
        ? food.defaultServingName
        : `${food.defaultServingGrams} g`,
      quantity: food.defaultServingId ? 1 : food.defaultServingGrams,
      calories: scaleNutrition(food.caloriesPer100g, food.defaultServingGrams),
      protein: scaleNutrition(food.proteinPer100g, food.defaultServingGrams),
      carbs: scaleNutrition(food.carbsPer100g, food.defaultServingGrams),
      fat: scaleNutrition(food.fatPer100g, food.defaultServingGrams),
      emoji: food.emoji ?? null,
      iconKey: food.iconKey ?? null,
      grams: food.defaultServingGrams,
    })

  const quickAddFavorite = (favorite: FavoriteFood) =>
    onAddToPlate({
      key: newPlateKey(favorite.id),
      foodItemId: favorite.foodItemId,
      name: favorite.foodName,
      foodServingId: favorite.foodServingId,
      servingLabel: favorite.foodServingId
        ? servingAmountLabel(favorite.quantity, favorite.servingName)
        : `${favorite.quantity} g`,
      quantity: favorite.quantity,
      calories: favorite.calories,
      protein: Math.round(favorite.protein),
      carbs: Math.round(favorite.carbs),
      fat: Math.round(favorite.fat),
    })

  const isSearching = search.trim() !== ''
  const shown = isSearching ? items : items.filter((item) => item.lastLoggedAt)
  const noHistory = !isSearching && !isLoading && shown.length === 0
  const grouped = isSearching && !isLoading && items.length > 0
  const hasMore = totalCount !== null && items.length < totalCount
  const query = search.trim()
  const renderRow = (food: FoodSummary) => (
    <FoodTile
      variant="row"
      food={tileDataOfFood(food, isSearching ? query : undefined)}
      settings={tileOptions}
      onSelect={() => onPick(food)}
      onAdd={() => quickAdd(food)}
    />
  )

  return (
    <div className="pb-4">
      {!isSearching && <FavoritesBar favorites={favorites} onQuickAdd={quickAddFavorite} />}
      {noHistory ? (
        <div className="bg-card mx-4 mt-4 rounded-xl px-4 py-4">
          <p className="text-base font-medium">No history yet</p>
          <p className="text-muted-foreground text-sm">Search for foods below</p>
        </div>
      ) : grouped ? (
        <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          {GROUP_ORDER.map((name) => {
            const foods = items.filter((food) => groupOf(food) === name)
            return foods.length > 0 ? (
              <ResultGroup key={name} title={name} foods={foods} renderRow={renderRow} />
            ) : null
          })}
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
                {isFetching ? 'Loading...' : `Load more (${items.length}/${totalCount})`}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <h3 className="px-4 pt-4 text-xl font-bold">{isSearching ? 'Results' : 'History'}</h3>
          <FoodList
            items={shown}
            totalCount={isSearching ? totalCount : shown.length}
            isLoading={isLoading}
            isFetching={isFetching}
            isFiltered={isSearching}
            onClearFilters={() => onSearchChange('')}
            onSelect={onPick}
            onQuickAdd={quickAdd}
            renderRow={renderRow}
            onLoadMore={onLoadMore}
          />
        </>
      )}
    </div>
  )
}
