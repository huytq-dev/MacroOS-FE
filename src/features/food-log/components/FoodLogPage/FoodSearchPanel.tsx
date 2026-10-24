'use client'

import { useState } from 'react'
import { ChevronLeft, Flame, Loader2, Plus } from 'lucide-react'
import { Energy } from '@/components/shared/Energy'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { HighlightedText } from '@/lib/search-highlight'
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
import { plateItemOfFood } from './LibraryPanel'

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

const GROUP_ORDER = ['From History', 'Common', 'Custom', 'Branded', 'Open Food Facts'] as const
type ResultGroupName = (typeof GROUP_ORDER)[number]
/** Mỗi nhóm hiện sẵn ngần này dòng; phần còn lại nằm sau "See N More" (mở danh sách đầy đủ của nhóm). */
const GROUP_LIMIT = 5

/**
 * Món có thuộc nhóm không (như MacroFactor, KHÔNG loại trừ): "From History" = món đã từng log khớp từ khoá, và món đó vẫn xuất hiện
 * tiếp ở nhóm gốc của nó; OpenFoodFacts → "Open Food Facts", món của tôi → "Custom", có thương hiệu → "Branded", còn lại (hệ thống,
 * USDA, VN) → "Common".
 */
const inGroup = (food: FoodSummary, name: ResultGroupName) => {
  if (name === 'From History') return Boolean(food.lastLoggedAt)
  const open = food.source === 'OpenFoodFacts'
  if (name === 'Open Food Facts') return open
  if (name === 'Custom') return !open && food.isMine
  if (name === 'Branded') return !open && !food.isMine && Boolean(food.brand)
  return !open && !food.isMine && !food.brand
}

/** Một nhóm kết quả: tiêu đề + link "See N More" bên phải, năm dòng đầu theo thứ tự BE đã xếp hạng. */
function ResultGroup({
  title,
  foods,
  renderRow,
  onSeeMore,
}: {
  readonly title: ResultGroupName
  readonly foods: readonly FoodSummary[]
  readonly renderRow: (food: FoodSummary) => React.ReactNode
  /** Không truyền = nhóm không có "See N More" (From History chỉ hiện tối đa năm món). */
  readonly onSeeMore?: () => void
}) {
  const rest = foods.length - GROUP_LIMIT
  return (
    <section aria-label={title}>
      <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-1">
        <h3 className="text-xl leading-tight font-bold">{title}</h3>
        {onSeeMore && rest > 0 && (
          <button
            type="button"
            onClick={onSeeMore}
            className="text-muted-foreground focus-visible:ring-ring/50 active:text-foreground relative text-sm underline underline-offset-2 transition-colors before:absolute before:-inset-x-2 before:-inset-y-3 before:content-[''] focus-visible:ring-1 focus-visible:outline-none"
          >
            See {rest} More
          </button>
        )}
      </div>
      <div className="divide-border divide-y">
        {foods.slice(0, GROUP_LIMIT).map((food) => (
          <div key={food.id}>{renderRow(food)}</div>
        ))}
      </div>
    </section>
  )
}

/** Danh sách đầy đủ của một nhóm ("See N More"): trượt vào từ phải 300ms; Back trượt trở lại từ trái. */
function GroupFullList({
  title,
  foods,
  renderRow,
  onBack,
  footer,
}: {
  readonly title: ResultGroupName
  readonly foods: readonly FoodSummary[]
  readonly renderRow: (food: FoodSummary) => React.ReactNode
  readonly onBack: () => void
  readonly footer?: React.ReactNode
}) {
  return (
    <section
      aria-label={title}
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-6 motion-safe:animation-duration-300 pb-4"
    >
      <div className="flex items-center gap-1 px-2 pt-2">
        <button
          type="button"
          aria-label="Back to results"
          onClick={onBack}
          className="focus-visible:ring-ring/50 active:bg-muted flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <div className="divide-border divide-y">
        {foods.map((food) => (
          <div key={food.id}>{renderRow(food)}</div>
        ))}
      </div>
      {footer}
    </section>
  )
}

/** Skeleton theo nhóm khi đang tìm: hai nhóm giả với tiêu đề và vài dòng cùng kích thước dòng thật. */
function GroupSkeletons() {
  return (
    <div aria-busy="true" aria-label="Searching">
      {[3, 2].map((rows, index) => (
        <div key={index}>
          <div className="px-4 pt-4 pb-1">
            <Skeleton className="h-6 w-32" />
          </div>
          {Array.from({ length: rows }).map((_, row) => (
            <div key={row} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Dòng kết quả tìm kiếm dày như MacroFactor (~46px): icon 28px, tên 15px với phần khớp từ khoá in đậm, dòng phụ 12px
 * "kcal P F C • khẩu phần (gram)" luôn kèm gram, cắt "…" ở cuối khi dài. Bấm cả dòng mở chi tiết; nút + nhỏ chỉ hiện khi cài đặt
 * Logger Food Tiles bật Multi-Add (vùng chạm vẫn 44px).
 */
function SearchResultRow({
  food,
  query,
  showAdd,
  onSelect,
  onAdd,
}: {
  readonly food: FoodSummary
  readonly query: string
  readonly showAdd: boolean
  readonly onSelect: () => void
  readonly onAdd: () => void
}) {
  const grams = Math.round(food.defaultServingGrams)
  const serving = food.defaultServingId ? servingAmountLabel(1, food.defaultServingName) : null
  const detail = serving && serving !== `${grams} g` ? `${serving} (${grams} g)` : `${grams} g`
  const per = (value: number) => Math.round(scaleNutrition(value, food.defaultServingGrams))
  return (
    <div className="flex items-center gap-3 px-4">
      <button
        type="button"
        onClick={onSelect}
        className="focus-visible:ring-ring/50 active:bg-muted -mx-4 flex min-h-11 min-w-0 flex-1 items-center gap-3 px-4 text-left transition-colors focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset"
      >
        <FoodIcon iconKey={food.iconKey} emoji={food.emoji ?? null} size={28} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] leading-tight font-medium">
            <HighlightedText
              text={food.brand ? `${food.name} (${food.brand})` : food.name}
              query={query}
            />
          </span>
          <span className="text-muted-foreground mt-0.5 flex items-center gap-x-1.5 text-xs leading-tight tabular-nums">
            <span className="inline-flex shrink-0 items-center">
              <Energy kcal={scaleNutrition(food.caloriesPer100g, food.defaultServingGrams)} />
              <Flame aria-hidden="true" fill="currentColor" className="size-3" />
            </span>
            <span className="shrink-0">
              {per(food.proteinPer100g)}P {per(food.fatPer100g)}F {per(food.carbsPer100g)}C
            </span>
            <span aria-hidden="true">•</span>
            <span className="min-w-0 truncate">{detail}</span>
          </span>
        </span>
      </button>
      {showAdd && (
        <button
          type="button"
          aria-label={`Add ${food.name}`}
          onClick={onAdd}
          className="bg-foreground/15 active:bg-foreground/25 focus-visible:ring-ring/50 relative flex size-8 shrink-0 items-center justify-center rounded-full transition-colors before:absolute before:-inset-2 before:content-[''] focus-visible:ring-1 focus-visible:outline-none"
        >
          <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
        </button>
      )}
    </div>
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
  // Nhóm đang mở danh sách đầy đủ ("See N More"); `cameBack` để lần quay về trượt từ trái thay vì từ phải
  const [openGroup, setOpenGroup] = useState<ResultGroupName | null>(null)
  const [cameBack, setCameBack] = useState(false)

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
  const searchLoading = isSearching && isLoading
  const grouped = isSearching && !isLoading && items.length > 0
  const foodsOf = (name: ResultGroupName) => items.filter((food) => inGroup(food, name))
  const activeGroup =
    grouped && openGroup && openGroup !== 'From History' && foodsOf(openGroup).length > GROUP_LIMIT
      ? openGroup
      : null
  const hasMore = totalCount !== null && items.length < totalCount
  const query = search.trim()
  const renderRow = (food: FoodSummary) =>
    isSearching ? (
      <SearchResultRow
        food={food}
        query={query}
        showAdd={tileOptions.highlight === 'MultiAdd'}
        onSelect={() => onPick(food)}
        onAdd={() => onAddToPlate(plateItemOfFood(food))}
      />
    ) : (
      <FoodTile
        variant="row"
        food={tileDataOfFood(food)}
        settings={tileOptions}
        onSelect={() => onPick(food)}
        onAdd={() => onAddToPlate(plateItemOfFood(food))}
      />
    )

  const loadMore = hasMore && (
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
  )

  if (activeGroup)
    return (
      <GroupFullList
        key={activeGroup}
        title={activeGroup}
        foods={foodsOf(activeGroup)}
        renderRow={renderRow}
        onBack={() => {
          setCameBack(true)
          setOpenGroup(null)
        }}
        footer={loadMore}
      />
    )

  return (
    <div
      className={cn(
        'pb-4',
        cameBack &&
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-6 motion-safe:animation-duration-300'
      )}
    >
      {!isSearching && <FavoritesBar favorites={favorites} onQuickAdd={quickAddFavorite} />}
      {noHistory ? (
        <div className="bg-card mx-4 mt-4 rounded-xl px-4 py-4">
          <p className="text-base font-medium">No history yet</p>
          <p className="text-muted-foreground text-sm">Search for foods below</p>
        </div>
      ) : searchLoading ? (
        <GroupSkeletons />
      ) : grouped ? (
        <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          {GROUP_ORDER.map((name) => {
            const foods = foodsOf(name)
            return foods.length > 0 ? (
              <ResultGroup
                key={name}
                title={name}
                foods={foods}
                renderRow={renderRow}
                onSeeMore={
                  name === 'From History'
                    ? undefined
                    : () => {
                        setCameBack(false)
                        setOpenGroup(name)
                      }
                }
              />
            ) : null
          })}
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
            onQuickAdd={onPick}
            renderRow={renderRow}
            onLoadMore={onLoadMore}
          />
        </>
      )}
    </div>
  )
}
