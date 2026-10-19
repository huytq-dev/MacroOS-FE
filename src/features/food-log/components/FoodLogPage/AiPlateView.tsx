'use client'

import { useState } from 'react'
import { ChevronDown, Flame, Search, Trash2 } from 'lucide-react'
import { CollapseItem } from '@/components/shared/CollapseItem'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { Button } from '@/components/ui/button'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { useExitingList } from '@/hooks/use-exiting-list'
import { useSheet } from '@/hooks/use-sheet'
import { cn } from '@/lib/utils'
import {
  baseDataOf,
  liveIngredients,
  sumLive,
  toPlateItem,
  totalsOf,
  type AiPlateEdits,
  type LiveIngredient,
} from '../../ai-plate.utils'
import type { TileOptions } from '../../food-log-settings'
import type {
  AiConfirmIngredient,
  AiDish,
  AiIngredient,
  IngredientState,
  MacroTotals,
  PlateItem,
  ResolvedIngredient,
} from '../../types/food-log.types'
import { AmountSheet, type AmountUnit } from './AmountSheet'
import { IngredientSearchSheet } from './IngredientSearchSheet'
import { PlateNutrition } from './PlatePanel/PlateNutrition'

const BONE = 'bg-foreground/10 motion-safe:animate-pulse rounded-full'
const FADE_IN = 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300'
const QUANTITY_BUTTON =
  'bg-background focus-visible:ring-ring/50 active:bg-foreground/20 flex h-14 w-20 shrink-0 flex-col items-center justify-center rounded-lg px-2 leading-tight transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100'
const TRASH_BUTTON =
  'text-muted-foreground active:bg-foreground/10 focus-visible:ring-ring/50 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none'

const statusOf = (states: Record<string, IngredientState>, id: string) =>
  states[id]?.status ?? 'searching'

const oneDecimal = (value: number) => Number(value.toFixed(1))

function MacroLine({
  calories,
  protein,
  fat,
  carbs,
  weightGrams,
}: {
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
  readonly weightGrams: number
}) {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 overflow-hidden text-[13px] whitespace-nowrap tabular-nums">
      <span className="inline-flex items-center">
        {Math.round(calories)}
        <Flame aria-hidden="true" fill="currentColor" className="size-3.5" />
      </span>
      <span>{Math.round(protein)}P</span>
      <span>{Math.round(fat)}F</span>
      <span>{Math.round(carbs)}C</span>
      <span aria-hidden="true">•</span>
      <span>{Math.round(weightGrams)} g</span>
    </span>
  )
}

/** Ô lượng bên phải: số lớn + đơn vị nhỏ; bấm để sửa. */
function QuantityButton({
  quantity,
  unit,
  label,
  onClick,
}: {
  readonly quantity: number
  readonly unit: string
  readonly label: string
  readonly onClick: () => void
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={QUANTITY_BUTTON}>
      <span className="text-base tabular-nums">{oneDecimal(quantity)}</span>
      <span className="text-muted-foreground w-full truncate text-center text-xs">{unit}</span>
    </button>
  )
}

interface IngredientRowProps {
  readonly ingredient: AiIngredient
  readonly state: IngredientState | undefined
  readonly live: LiveIngredient | undefined
  readonly onEdit: () => void
  readonly onRemove: () => void
  readonly onRetry: () => void
  readonly onSearch: () => void
}

function IngredientRow({
  ingredient,
  state,
  live,
  onEdit,
  onRemove,
  onRetry,
  onSearch,
}: IngredientRowProps) {
  if (live) {
    const { data } = live
    return (
      <div className={cn('flex items-center gap-3 px-4 py-3', FADE_IN)}>
        <FoodIcon iconKey={data.iconKey} emoji={data.emoji ?? '🍽️'} size={36} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-base leading-snug">
              {data.foodName ?? ingredient.name}
            </span>
            {data.estimated && (
              <span className="bg-foreground/10 text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[11px] leading-none">
                Estimated
              </span>
            )}
          </span>
          <MacroLine
            calories={data.calories}
            protein={data.protein}
            fat={data.fat}
            carbs={data.carbs}
            weightGrams={data.weightGrams}
          />
        </span>
        <QuantityButton
          quantity={data.quantity}
          unit={data.unitLabel}
          label={`Edit amount of ${ingredient.name}`}
          onClick={onEdit}
        />
        <button
          type="button"
          aria-label={`Remove ${ingredient.name}`}
          onClick={onRemove}
          className={TRASH_BUTTON}
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </button>
      </div>
    )
  }

  if (!state || state.status === 'searching') {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span aria-hidden="true" className={cn('size-9 shrink-0', BONE)} />
        <span className="min-w-0 flex-1 space-y-2">
          <span className="flex items-center gap-1.5 text-base">
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">Searching for &ldquo;{ingredient.name}&rdquo;</span>
          </span>
          <span aria-hidden="true" className={cn('block h-3 w-3/5', BONE)} />
        </span>
        <span aria-hidden="true" className={cn('h-14 w-20 shrink-0 rounded-lg', BONE)} />
      </div>
    )
  }

  // not-found: AI không tìm được và không ước lượng được → "No data yet" + chọn món thay thế; error: tra lỗi → thử lại
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', FADE_IN)}>
      <span aria-hidden="true" className="w-9 shrink-0 text-center text-2xl leading-none">
        🍽️
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base leading-snug">{ingredient.name}</span>
        <span className="text-muted-foreground block text-[13px]">
          {state.status === 'error' ? 'Couldn’t search' : 'No data yet'}
        </span>
      </span>
      <button
        type="button"
        onClick={state.status === 'error' ? onRetry : onSearch}
        className="bg-background focus-visible:ring-ring/50 active:bg-foreground/20 h-11 shrink-0 rounded-lg px-4 text-base font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        {state.status === 'error' ? 'Retry' : 'Search'}
      </button>
      <button
        type="button"
        aria-label={`Remove ${ingredient.name}`}
        onClick={onRemove}
        className={TRASH_BUTTON}
      >
        <Trash2 aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}

interface DishCardProps {
  readonly dish: AiDish
  readonly states: Record<string, IngredientState>
  readonly edits: AiPlateEdits
  readonly live: readonly LiveIngredient[]
  readonly onEditDish: () => void
  readonly onEditIngredient: (ingredient: AiIngredient) => void
  readonly onRemoveIngredient: (ingredient: AiIngredient) => void
  readonly onRetry: (ingredient: AiIngredient) => void
  readonly onSearch: (ingredient: AiIngredient) => void
}

function DishCard({
  dish,
  states,
  edits,
  live,
  onEditDish,
  onEditIngredient,
  onRemoveIngredient,
  onRetry,
  onSearch,
}: DishCardProps) {
  const [open, setOpen] = useState(false)
  const remaining = dish.ingredients.filter((item) => !edits.ingredients[item.id]?.removed)
  // Nguyên liệu vừa xoá còn giữ 300ms để co lại rồi mới biến mất
  const rows = useExitingList(remaining, (item) => item.id)
  const searching = remaining.some(
    (item) => !edits.ingredients[item.id]?.replacement && statusOf(states, item.id) === 'searching'
  )
  const expanded = searching || open
  const mine = live.filter((item) => item.dishId === dish.id)
  const total = sumLive(mine)
  const scale = edits.dishScales[dish.id] ?? 1
  const lead = mine[0]?.data
  const bare = searching && mine.length === 0

  return (
    <div className="bg-secondary overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 px-4 py-3">
        {bare ? (
          <span aria-hidden="true" className={cn('size-10 shrink-0', BONE)} />
        ) : (
          <span className={FADE_IN}>
            <FoodIcon iconKey={lead?.iconKey} emoji={lead?.emoji ?? '🍽️'} size={40} />
          </span>
        )}
        <span className="min-w-0 flex-1 space-y-1">
          <span className="block text-base leading-snug font-medium">{dish.name}</span>
          {bare ? (
            <span aria-hidden="true" className={cn('block h-3 w-3/5', BONE)} />
          ) : (
            <MacroLine {...total} />
          )}
        </span>
        {bare ? (
          <span aria-hidden="true" className={cn('h-14 w-20 shrink-0 rounded-lg', BONE)} />
        ) : (
          <QuantityButton
            quantity={scale}
            unit="plate"
            label={`Edit servings of ${dish.name}`}
            onClick={onEditDish}
          />
        )}
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        disabled={searching}
        onClick={() => setOpen(!open)}
        className="border-border focus-visible:ring-ring/50 flex w-full items-center justify-between border-t px-4 py-3 text-base focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
      >
        {expanded ? 'Collapse Ingredients' : 'Expand Ingredients'}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-5 transition-transform duration-300 motion-reduce:transition-none',
            expanded && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden" inert={!expanded}>
          <ul className="divide-border border-border divide-y border-t">
            {rows.map(({ item, key, entering, leaving }) => (
              <CollapseItem key={key} entering={entering} leaving={leaving}>
                <IngredientRow
                  ingredient={item}
                  state={states[item.id]}
                  live={mine.find((entry) => entry.ingredient.id === item.id)}
                  onEdit={() => onEditIngredient(item)}
                  onRemove={() => onRemoveIngredient(item)}
                  onRetry={() => onRetry(item)}
                  onSearch={() => onSearch(item)}
                />
              </CollapseItem>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

interface AiPlateViewProps {
  /** Ngày sẽ ghi (yyyy-MM-dd): thẻ Nutrition lấy số liệu và mục tiêu theo ngày này. */
  readonly date: string
  readonly dishes: AiDish[]
  readonly states: Record<string, IngredientState>
  readonly edits: AiPlateEdits
  /** Tổng đã log trong ngày và mục tiêu, cho chế độ Day của phần Nutrition. */
  readonly dayTotals?: MacroTotals
  readonly target?: ProgramWeek | null
  readonly tileOptions: TileOptions
  readonly onRetry: (ingredient: AiIngredient) => void
  readonly onSetGrams: (ingredientId: string, grams: number) => void
  readonly onRemoveIngredient: (ingredientId: string) => void
  readonly onReplaceIngredient: (ingredientId: string, data: ResolvedIngredient) => void
  readonly onSetDishScale: (dishId: string, scale: number) => void
  readonly onStartOver: () => void
  /** `confirmations`: tên nguyên liệu AI + món user đã chọn, để cha báo BE (best-effort) sau khi log. */
  readonly onLog: (items: PlateItem[], confirmations: AiConfirmIngredient[]) => void
}

type AmountTarget =
  | { readonly kind: 'dish'; readonly dish: AiDish }
  | { readonly kind: 'ingredient'; readonly ingredient: AiIngredient }

const dishIdOf = (dishes: readonly AiDish[], ingredientId: string) =>
  dishes.find((dish) => dish.ingredients.some((item) => item.id === ingredientId))?.id ?? ''

/**
 * Kết quả "AI Plate": thẻ món (icon, tên, tổng macro, ô "1 plate" sửa được, danh sách nguyên liệu mở/thu 300ms). Từng nguyên
 * liệu có icon, macro, ô lượng sửa được và nút xoá; chưa tìm được thì hiện skeleton "Searching for…", không có dữ liệu thì "No
 * data yet" kèm Search để chọn món thay. Mọi chỉnh sửa tính lại tổng món, thẻ Nutrition (Plate | Day, Show all nutrients) tức thì;
 * Log Foods đưa các nguyên liệu vào nhật ký.
 */
export function AiPlateView({
  date,
  dishes,
  states,
  edits,
  dayTotals,
  target,
  tileOptions,
  onRetry,
  onSetGrams,
  onRemoveIngredient,
  onReplaceIngredient,
  onSetDishScale,
  onStartOver,
  onLog,
}: AiPlateViewProps) {
  const amountSheet = useSheet<AmountTarget>()
  const searchSheet = useSheet<AiIngredient>()
  const live = liveIngredients(dishes, states, edits)
  const visibleDishes = dishes.filter((dish) =>
    dish.ingredients.some((item) => !edits.ingredients[item.id]?.removed)
  )
  const pending = dishes
    .flatMap((dish) => dish.ingredients)
    .some(
      (item) =>
        !edits.ingredients[item.id]?.removed &&
        !edits.ingredients[item.id]?.replacement &&
        statusOf(states, item.id) === 'searching'
    )
  const plateItems = live.map((item) => toPlateItem(item, item.ingredient.id))

  const logFoods = () =>
    onLog(
      live.map((item) => toPlateItem(item, `${item.ingredient.id}-${Date.now()}`)),
      // Ước lượng (không có món thật) không có foodItemId nên không gửi confirm.
      live.flatMap(({ ingredient, data }) =>
        data.foodItemId ? [{ name: ingredient.name, foodItemId: data.foodItemId }] : []
      )
    )

  // Gram hiện tại và các đơn vị có thể nhập của mục đang sửa
  const amountValue = amountSheet.value
  const amountSetup = (): { title: string; units: AmountUnit[]; grams: number } | null => {
    if (!amountValue) return null
    if (amountValue.kind === 'dish') {
      return {
        title: amountValue.dish.name,
        units: [{ label: 'plate', gramsPerUnit: 1 }],
        grams: edits.dishScales[amountValue.dish.id] ?? 1,
      }
    }
    const { ingredient } = amountValue
    const data =
      live.find((item) => item.ingredient.id === ingredient.id)?.data ??
      baseDataOf(states[ingredient.id], edits.ingredients[ingredient.id])
    if (!data) return null
    const units: AmountUnit[] =
      data.unitLabel !== 'g' && data.quantity > 0
        ? [
            { label: data.unitLabel, gramsPerUnit: data.weightGrams / data.quantity },
            { label: 'g', gramsPerUnit: 1 },
          ]
        : [{ label: 'g', gramsPerUnit: 1 }]
    return { title: ingredient.name, units, grams: data.weightGrams }
  }
  const amount = amountSetup()

  return (
    <div className="flex h-full min-h-[24rem] flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">AI Plate</h2>
          <button
            type="button"
            onClick={onStartOver}
            className="text-muted-foreground focus-visible:ring-ring/50 rounded text-sm focus-visible:ring-1 focus-visible:outline-none"
          >
            Start over
          </button>
        </div>

        <div className="space-y-3">
          {visibleDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              states={states}
              edits={edits}
              live={live}
              onEditDish={() => amountSheet.show({ kind: 'dish', dish })}
              onEditIngredient={(ingredient) =>
                amountSheet.show({ kind: 'ingredient', ingredient })
              }
              onRemoveIngredient={(ingredient) => onRemoveIngredient(ingredient.id)}
              onRetry={onRetry}
              onSearch={(ingredient) => searchSheet.show(ingredient)}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-center text-sm">
          MacroOS AI can make mistakes, so always verify its results.
        </p>

        {!pending && live.length > 0 && (
          <div className={cn('[&_.bg-card]:bg-secondary', FADE_IN)}>
            <PlateNutrition
              date={date}
              plate={plateItems}
              plateTotals={totalsOf(live)}
              dayTotals={dayTotals}
              target={target}
            />
          </div>
        )}
      </div>

      {!pending && (
        <div className="flex justify-end px-4 pt-2 pb-4">
          <Button
            className="h-12 shrink-0 rounded-full px-5 text-base"
            disabled={live.length === 0}
            onClick={logFoods}
          >
            Log Foods
          </Button>
        </div>
      )}

      {amountSheet.value && amount && (
        <AmountSheet
          key={amountSheet.id}
          open={amountSheet.open}
          onOpenChange={amountSheet.onOpenChange}
          title={amount.title}
          units={amount.units}
          grams={amount.grams}
          onSave={(value) => {
            if (amountValue?.kind === 'dish') onSetDishScale(amountValue.dish.id, value)
            else if (amountValue) {
              // Gram nhập là lượng đã nhân hệ số của món; lưu theo gram gốc để hệ số món vẫn nhân đúng
              const scale = edits.dishScales[dishIdOf(dishes, amountValue.ingredient.id)] ?? 1
              onSetGrams(amountValue.ingredient.id, value / scale)
            }
          }}
        />
      )}

      {searchSheet.value && (
        <IngredientSearchSheet
          key={searchSheet.id}
          open={searchSheet.open}
          onOpenChange={searchSheet.onOpenChange}
          ingredient={searchSheet.value}
          tileOptions={tileOptions}
          onSelect={(data) => {
            if (searchSheet.value) onReplaceIngredient(searchSheet.value.id, data)
          }}
        />
      )}
    </div>
  )
}
