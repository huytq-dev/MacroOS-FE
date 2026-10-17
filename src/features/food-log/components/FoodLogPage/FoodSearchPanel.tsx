'use client'

import { FoodList } from '@/features/foods/components/FoodList'
import {
  scaleNutrition,
  servingAmountLabel,
  type FoodDetail,
  type FoodSummary,
} from '@/features/foods/types/food.types'
import type { FavoriteFood } from '@/features/foods/types/favorite.types'
import { normalizeSearchText } from '@/components/shared/searchable-options'
import { ListFilter } from 'lucide-react'
import { useState } from 'react'
import { FOOD_CATEGORY, enumOptions, type FoodCategory } from '@/config/enums'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { TileOptions } from '../../food-log-settings'
import type { PlateItem } from '../../types/food-log.types'
import { FoodTile, type FoodTileData } from './FoodTile'
import { FoodPicker } from './FoodPicker'
import { FavoriteList } from './FavoriteList'
import { FavoritesBar } from './FavoritesBar'

/** Dữ liệu ô món từ kết quả tìm kiếm: số theo khẩu phần mặc định (khẩu phần "1 cup" hoặc gram) và khối lượng của nó. */
const tileDataOfFood = (food: FoodSummary): FoodTileData => ({
  name: food.brand ? `${food.name} (${food.brand})` : food.name,
  calories: scaleNutrition(food.caloriesPer100g, food.defaultServingGrams),
  protein: scaleNutrition(food.proteinPer100g, food.defaultServingGrams),
  fat: scaleNutrition(food.fatPer100g, food.defaultServingGrams),
  carbs: scaleNutrition(food.carbsPer100g, food.defaultServingGrams),
  servingText: food.defaultServingId
    ? servingAmountLabel(1, food.defaultServingName)
    : `${food.defaultServingGrams} g`,
  weightText: `${Math.round(food.defaultServingGrams)} g`,
  emoji: food.emoji ?? null,
})

/** Khoá dòng plate phải khác nhau mỗi lần thêm (cùng món thêm nhiều lần); chỉ gọi trong sự kiện bấm. */
const newPlateKey = (id: string) => `${id}-${Date.now()}`

export type FoodView = 'all' | 'recent' | 'favorites' | 'mine'

const VIEWS: readonly { value: FoodView; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'Foods' },
  { value: 'recent', label: 'Recents', title: 'Recent foods' },
  { value: 'favorites', label: 'Favorites', title: 'Favorites' },
  { value: 'mine', label: 'Mine', title: 'Custom foods' },
]

interface FoodSearchPanelProps {
  readonly view: FoodView
  readonly onViewChange: (view: FoodView) => void
  readonly category: FoodCategory | null
  readonly onCategoryChange: (category: FoodCategory | null) => void
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
  /** Cài đặt Logger Food Tiles: cách mỗi món hiện trong kết quả. */
  readonly tileOptions: TileOptions
  readonly favorites: readonly FavoriteFood[]
  readonly isFavoritePending: boolean
  readonly onAddFavorite: (foodItemId: string, servingId: string | null, quantity: number) => void
  readonly onRemoveFavorite: (id: string) => void
  readonly onReorderFavorites: (ids: string[]) => void
}

export function FoodSearchPanel({
  view,
  onViewChange,
  category,
  onCategoryChange,
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
  onReorderFavorites,
}: FoodSearchPanelProps) {
  const [showFilters, setShowFilters] = useState(false)

  if (pickedId) {
    if (!picked) return <Skeleton className="m-4 h-56 rounded-2xl" aria-busy="true" />
    return (
      <FoodPicker
        key={picked.id}
        food={picked}
        onBack={onBack}
        onAdd={onAddToPlate}
        favorites={favorites.filter((item) => item.foodItemId === picked.id)}
        isFavoritePending={isFavoritePending}
        onAddFavorite={(servingId, quantity) => onAddFavorite(picked.id, servingId, quantity)}
        onRemoveFavorite={onRemoveFavorite}
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
  const shownFavorites = isSearching
    ? favorites.filter((item) =>
        normalizeSearchText(item.foodName).includes(normalizeSearchText(search))
      )
    : favorites
  const shown = view === 'recent' ? items.filter((item) => item.lastLoggedAt) : items
  const title = VIEWS.find((item) => item.value === view)?.title

  return (
    <div>
      <div className="flex items-center gap-3 px-4 pt-3">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(next) => next && onViewChange(next as FoodView)}
          aria-label="Food source"
          className="bg-secondary flex-1 gap-0 rounded-full p-1"
        >
          {VIEWS.map((item) => (
            <ToggleGroupItem
              key={item.value}
              value={item.value}
              className="data-[state=on]:bg-foreground data-[state=on]:text-background h-10 flex-1 rounded-full px-1 text-sm md:h-8"
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {view !== 'favorites' && (
          <button
            type="button"
            aria-label="Filter by category"
            aria-pressed={showFilters || category !== null}
            onClick={() => setShowFilters((current) => !current)}
            className={cn(
              'bg-secondary focus-visible:ring-ring/50 flex size-12 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none md:size-9',
              category !== null && 'bg-foreground text-background'
            )}
          >
            <ListFilter aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>

      {showFilters && view !== 'favorites' && (
        <ToggleGroup
          type="single"
          value={category ?? 'all'}
          onValueChange={(next) =>
            next && onCategoryChange(next === 'all' ? null : (next as FoodCategory))
          }
          aria-label="Food category"
          className="flex justify-start gap-2 overflow-x-auto overscroll-x-contain px-4 pt-3"
        >
          {[{ value: 'all', label: 'All categories' }, ...enumOptions(FOOD_CATEGORY)].map(
            (option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="bg-secondary data-[state=on]:bg-foreground data-[state=on]:text-background h-9 shrink-0 rounded-full px-4 text-sm"
              >
                {option.label}
              </ToggleGroupItem>
            )
          )}
        </ToggleGroup>
      )}

      {view === 'favorites' ? (
        <FavoriteList
          favorites={shownFavorites}
          isFiltered={isSearching}
          onQuickAdd={quickAddFavorite}
          onReorder={onReorderFavorites}
          onRemove={onRemoveFavorite}
        />
      ) : (
        <>
          {view === 'all' && !isSearching && category === null && (
            <FavoritesBar favorites={favorites} onQuickAdd={quickAddFavorite} />
          )}
          <h3 className="px-4 pt-4 text-lg font-semibold md:text-sm">
            {isSearching ? 'Results' : title}
          </h3>
          <FoodList
            items={shown}
            totalCount={view === 'recent' ? shown.length : totalCount}
            isLoading={isLoading}
            isFetching={isFetching}
            isFiltered={isSearching || category !== null}
            onClearFilters={() => {
              onSearchChange('')
              onCategoryChange(null)
            }}
            onSelect={onPick}
            onQuickAdd={quickAdd}
            renderRow={(food) => (
              <FoodTile
                variant="row"
                food={tileDataOfFood(food)}
                settings={tileOptions}
                onSelect={() => onPick(food)}
                onAdd={() => quickAdd(food)}
              />
            )}
            onLoadMore={onLoadMore}
          />
        </>
      )}
    </div>
  )
}
