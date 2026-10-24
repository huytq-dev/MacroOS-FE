'use client'

import Link from 'next/link'
import { ArrowDownUp, Heart, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FoodList } from '@/features/foods/components/FoodList'
import type { FavoriteFood } from '@/features/foods/types/favorite.types'
import {
  scaleExact,
  scaleNutrition,
  servingAmountLabel,
  type FoodSummary,
} from '@/features/foods/types/food.types'
import type { TileOptions } from '../../food-log-settings'
import type { LibraryItem, PlateItem } from '../../types/food-log.types'
import { FoodTile, type FoodTileData } from './FoodTile'
import { SlidingSwitch } from './SlidingSwitch'

export type LibraryView = 'recipes' | 'foods' | 'favorites'

const VIEWS = [
  { value: 'recipes', label: 'Recipes' },
  { value: 'foods', label: 'Foods' },
  {
    value: 'favorites',
    label: <Heart aria-hidden="true" fill="currentColor" className="size-4" />,
    ariaLabel: 'Favorites',
  },
] as const

const ROUND_BUTTON =
  'bg-secondary focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none active:bg-foreground/20'

// Hai hàm dưới lặp lại cách FoodSearchPanel dựng ô món / dòng plate (file đó do trang Search quản lý).
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
  iconKey: food.iconKey ?? null,
})

const tileDataOfFavorite = (favorite: FavoriteFood): FoodTileData => ({
  name: favorite.brand ? `${favorite.foodName} (${favorite.brand})` : favorite.foodName,
  calories: favorite.calories,
  protein: favorite.protein,
  fat: favorite.fat,
  carbs: favorite.carbs,
  servingText: favorite.foodServingId
    ? servingAmountLabel(favorite.quantity, favorite.servingName)
    : `${favorite.quantity} g`,
  weightText: `${Math.round(favorite.grams)} g`,
  emoji: null,
})

const tileDataOfRecipe = (recipe: LibraryItem): FoodTileData => ({
  name: recipe.name,
  calories: recipe.calories,
  protein: recipe.protein,
  fat: recipe.fat,
  carbs: recipe.carbs,
  servingText: recipe.servingName,
  weightText: null,
  emoji: recipe.emoji,
  iconKey: recipe.iconKey ?? null,
})

/** Khoá dòng plate phải khác nhau mỗi lần thêm; chỉ gọi trong sự kiện bấm. */
const newPlateKey = (id: string) => `${id}-${Date.now()}`

/** Một món với khẩu phần mặc định cho plate (nút + của Library và của kết quả tìm kiếm / History). */
export const plateItemOfFood = (food: FoodSummary): PlateItem => ({
  key: newPlateKey(food.id),
  foodItemId: food.id,
  name: food.name,
  foodServingId: food.defaultServingId,
  servingLabel: food.defaultServingId ? food.defaultServingName : `${food.defaultServingGrams} g`,
  quantity: food.defaultServingId ? 1 : food.defaultServingGrams,
  calories: scaleExact(food.caloriesPer100g, food.defaultServingGrams),
  protein: scaleExact(food.proteinPer100g, food.defaultServingGrams),
  carbs: scaleExact(food.carbsPer100g, food.defaultServingGrams),
  fat: scaleExact(food.fatPer100g, food.defaultServingGrams),
  emoji: food.emoji ?? null,
  iconKey: food.iconKey ?? null,
  grams: food.defaultServingGrams,
})

function EmptyCard({ title, hint }: { readonly title: string; readonly hint: string }) {
  return (
    <div className="bg-card mx-4 mt-4 rounded-xl px-4 py-4">
      <p className="text-base font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{hint}</p>
    </div>
  )
}

interface LibraryPanelProps {
  readonly view: LibraryView
  readonly onViewChange: (view: LibraryView) => void
  /** Chữ ở ô lọc đáy bảng (lọc theo tên, ngay trên client). */
  readonly filter: string
  readonly onClearFilter: () => void
  readonly foods: FoodSummary[]
  readonly foodsTotal: number | null
  readonly isFoodsLoading: boolean
  readonly isFoodsFetching: boolean
  readonly onLoadMoreFoods: () => void
  /** Recipe của tôi; lọc theo tên do server làm (`filter` đã debounce ở trang). */
  readonly recipes: LibraryItem[]
  readonly recipesTotal: number | null
  readonly isRecipesLoading: boolean
  readonly isRecipesFetching: boolean
  readonly onLoadMoreRecipes: () => void
  readonly favorites: readonly FavoriteFood[]
  readonly isFavoritesLoading: boolean
  readonly tileOptions: TileOptions
  /** Trang tạo món / công thức; bấm thì `onNavigate` đóng bảng Thêm món. */
  readonly createFoodHref: string
  readonly createRecipeHref: string
  readonly onNavigate: () => void
  readonly onPickFood: (food: FoodSummary) => void
  readonly onAddToPlate: (item: PlateItem) => void
}

/**
 * Tab Library (kiểu MacroFactor): công tắc ba ngăn Recipes | Foods | ♥ và nút tròn bên phải (+ ở Recipes/Foods, sắp xếp ở ♥).
 * Foods = món tự tạo của người dùng, Favorites = preset yêu thích, cả hai vẽ bằng FoodTile theo cài đặt Logger Food Tiles.
 * Recipes lấy từ `GET /library?scope=Recipes` (số trên 1 khẩu phần), bấm dòng hoặc + thì thêm 1 khẩu phần vào plate. Ô lọc nằm ở
 * thanh đáy của AddFoodDialog.
 */
export function LibraryPanel({
  view,
  onViewChange,
  filter,
  onClearFilter,
  foods,
  foodsTotal,
  isFoodsLoading,
  isFoodsFetching,
  onLoadMoreFoods,
  recipes,
  recipesTotal,
  isRecipesLoading,
  isRecipesFetching,
  onLoadMoreRecipes,
  favorites,
  isFavoritesLoading,
  tileOptions,
  createFoodHref,
  createRecipeHref,
  onNavigate,
  onPickFood,
  onAddToPlate,
}: LibraryPanelProps) {
  const query = filter.trim().toLowerCase()
  const shownFoods = query ? foods.filter((food) => food.name.toLowerCase().includes(query)) : foods
  const shownFavorites = query
    ? favorites.filter((favorite) => favorite.foodName.toLowerCase().includes(query))
    : favorites

  const addFood = (food: FoodSummary) => onAddToPlate(plateItemOfFood(food))

  // Recipe log theo số khẩu phần: không có foodItemId / serving, quantity 1 = 1 khẩu phần.
  const addRecipe = (recipe: LibraryItem) =>
    onAddToPlate({
      key: newPlateKey(recipe.id),
      foodItemId: null,
      recipeId: recipe.id,
      name: recipe.name,
      foodServingId: null,
      servingLabel: recipe.servingName,
      quantity: 1,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
    })

  const addFavorite = (favorite: FavoriteFood) =>
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

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 px-3 pt-3">
        <div className="bg-secondary flex-1 rounded-2xl p-2">
          <SlidingSwitch
            options={VIEWS}
            value={view}
            onChange={onViewChange}
            label="Library section"
            className="bg-background"
          />
        </div>
        {view === 'favorites' ? (
          <button
            type="button"
            aria-label="Sort favorites"
            onClick={() => toast('Sorting is coming soon')}
            className={ROUND_BUTTON}
          >
            <ArrowDownUp aria-hidden="true" className="size-5" />
          </button>
        ) : (
          <Link
            href={view === 'foods' ? createFoodHref : createRecipeHref}
            aria-label={view === 'foods' ? 'Create a food' : 'Create a recipe'}
            onClick={onNavigate}
            className={ROUND_BUTTON}
          >
            <Plus aria-hidden="true" className="size-5" />
          </Link>
        )}
      </div>

      <div
        key={view}
        className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300"
      >
        {view === 'recipes' &&
          (isRecipesLoading ? (
            <div className="space-y-1 p-3" aria-busy="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : recipes.length === 0 ? (
            query ? (
              <p className="text-muted-foreground px-4 py-6 text-center text-sm">
                No recipes match &ldquo;{filter.trim()}&rdquo;
              </p>
            ) : (
              <EmptyCard title="No recipes yet" hint="Use the + above to add recipes" />
            )
          ) : (
            <div
              className={isRecipesFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}
            >
              <ul className="divide-border divide-y pt-2">
                {recipes.map((recipe) => (
                  <li key={recipe.id}>
                    <FoodTile
                      variant="row"
                      food={tileDataOfRecipe(recipe)}
                      settings={tileOptions}
                      onSelect={() => addRecipe(recipe)}
                      onAdd={() => addRecipe(recipe)}
                    />
                  </li>
                ))}
              </ul>
              {recipesTotal !== null && recipes.length < recipesTotal && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={onLoadMoreRecipes}
                    disabled={isRecipesFetching}
                    aria-busy={isRecipesFetching}
                  >
                    {isRecipesFetching && (
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    )}
                    {isRecipesFetching
                      ? 'Loading...'
                      : `Load more (${recipes.length}/${recipesTotal})`}
                  </Button>
                </div>
              )}
            </div>
          ))}

        {view === 'foods' &&
          (!isFoodsLoading && foods.length === 0 && !query ? (
            <EmptyCard title="No foods yet" hint="Use the + above to add foods" />
          ) : (
            <FoodList
              items={shownFoods}
              totalCount={query ? shownFoods.length : foodsTotal}
              isLoading={isFoodsLoading}
              isFetching={isFoodsFetching}
              isFiltered={Boolean(query)}
              onClearFilters={onClearFilter}
              onSelect={onPickFood}
              onQuickAdd={addFood}
              renderRow={(food) => (
                <FoodTile
                  variant="row"
                  food={tileDataOfFood(food)}
                  settings={tileOptions}
                  onSelect={() => onPickFood(food)}
                  onAdd={() => addFood(food)}
                />
              )}
              onLoadMore={onLoadMoreFoods}
            />
          ))}

        {view === 'favorites' &&
          (isFavoritesLoading ? (
            <Skeleton className="m-4 h-40 rounded-2xl" aria-busy="true" />
          ) : favorites.length === 0 ? (
            <EmptyCard
              title="No favorites yet"
              hint="Search for a food, open the Food Detail view, and press the heart to save it as your favorite"
            />
          ) : shownFavorites.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">
              No favorites match &ldquo;{filter.trim()}&rdquo;
            </p>
          ) : (
            <ul className="divide-border divide-y pt-2">
              {shownFavorites.map((favorite) => (
                <li key={favorite.id}>
                  <FoodTile
                    variant="row"
                    food={tileDataOfFavorite(favorite)}
                    settings={tileOptions}
                    onSelect={() => addFavorite(favorite)}
                    onAdd={() => addFavorite(favorite)}
                  />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  )
}
