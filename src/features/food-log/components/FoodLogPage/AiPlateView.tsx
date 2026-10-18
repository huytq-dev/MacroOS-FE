'use client'

import { useState } from 'react'
import { ChevronDown, Flame, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { cn } from '@/lib/utils'
import type {
  AiConfirmIngredient,
  AiDish,
  AiIngredient,
  IngredientState,
  MacroTotals,
  PlateItem,
  ResolvedIngredient,
} from '../../types/food-log.types'
import { SlidingSwitch } from './SlidingSwitch'

type Scope = 'plate' | 'day'

const SCOPES: readonly { value: Scope; label: string }[] = [
  { value: 'plate', label: 'Plate' },
  { value: 'day', label: 'Day' },
]

const NUTRIENTS = [
  {
    key: 'calories',
    label: 'Calories',
    unit: 'kcal',
    bar: 'bg-mf-tile-calories',
    goal: 'caloriesTarget',
  },
  { key: 'protein', label: 'Protein', unit: 'g', bar: 'bg-mf-tile-protein', goal: 'proteinTarget' },
  { key: 'fat', label: 'Fat', unit: 'g', bar: 'bg-mf-tile-fat', goal: 'fatTarget' },
  { key: 'carbs', label: 'Carbs', unit: 'g', bar: 'bg-mf-tile-carbs', goal: 'carbsTarget' },
] as const

const BONE = 'bg-foreground/10 motion-safe:animate-pulse rounded-full'
const FADE_IN = 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300'
const QUANTITY_BOX =
  'bg-background min-w-16 shrink-0 rounded-lg px-3 py-2 text-center text-sm tabular-nums'

const statusOf = (states: Record<string, IngredientState>, id: string) =>
  states[id]?.status ?? 'searching'

const sumOf = (list: readonly ResolvedIngredient[]) => ({
  calories: list.reduce((sum, item) => sum + item.calories, 0),
  protein: list.reduce((sum, item) => sum + item.protein, 0),
  fat: list.reduce((sum, item) => sum + item.fat, 0),
  carbs: list.reduce((sum, item) => sum + item.carbs, 0),
  weightGrams: list.reduce((sum, item) => sum + item.weightGrams, 0),
})

const matchedOf = (ingredients: readonly AiIngredient[], states: Record<string, IngredientState>) =>
  ingredients.flatMap((ingredient) => {
    const state = states[ingredient.id]
    return state?.status === 'matched' ? [{ ingredient, data: state.data }] : []
  })

function MacroLine({
  calories,
  protein,
  fat,
  carbs,
  weightGrams,
  estimated,
}: {
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
  readonly weightGrams: number
  readonly estimated?: boolean
}) {
  return (
    <span className="text-muted-foreground flex items-center gap-2 text-[13px] whitespace-nowrap tabular-nums">
      <span className="inline-flex items-center">
        {estimated && '~'}
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

function IngredientRow({
  ingredient,
  state,
  onRetry,
}: {
  readonly ingredient: AiIngredient
  readonly state: IngredientState | undefined
  readonly onRetry: () => void
}) {
  if (!state || state.status === 'searching') {
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <span aria-hidden="true" className={cn('size-9 shrink-0', BONE)} />
        <span className="min-w-0 flex-1 space-y-2">
          <span className="flex items-center gap-1.5 text-base">
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">Searching for &ldquo;{ingredient.name}&rdquo;</span>
          </span>
          <span aria-hidden="true" className={cn('block h-3 w-3/5', BONE)} />
        </span>
        <span aria-hidden="true" className={cn('h-9 w-16 shrink-0 rounded-lg', BONE)} />
      </li>
    )
  }
  if (state.status !== 'matched') {
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-base">
          {state.status === 'error' ? 'Couldn’t search' : 'Couldn’t find'} &ldquo;{ingredient.name}
          &rdquo;
        </span>
        <button
          type="button"
          onClick={onRetry}
          className="bg-background focus-visible:ring-ring/50 h-9 shrink-0 rounded-lg px-3 text-sm font-medium focus-visible:ring-1 focus-visible:outline-none"
        >
          Retry
        </button>
      </li>
    )
  }
  const { data } = state
  return (
    <li className={cn('flex items-center gap-3 px-4 py-3', FADE_IN)}>
      <span aria-hidden="true" className="w-9 shrink-0 text-center text-2xl leading-none">
        {data.emoji ?? '🍽️'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base leading-snug">
          {data.foodName ?? ingredient.name}
        </span>
        <MacroLine
          calories={data.calories}
          protein={data.protein}
          fat={data.fat}
          carbs={data.carbs}
          weightGrams={data.weightGrams}
          estimated={data.estimated}
        />
      </span>
      <span className={QUANTITY_BOX}>
        {Number(data.quantity.toFixed(2))} / {data.unitLabel}
      </span>
    </li>
  )
}

function DishCard({
  dish,
  states,
  onRetry,
}: {
  readonly dish: AiDish
  readonly states: Record<string, IngredientState>
  readonly onRetry: (ingredient: AiIngredient) => void
}) {
  const [open, setOpen] = useState(false)
  const searching = dish.ingredients.some((item) => statusOf(states, item.id) === 'searching')
  const expanded = searching || open
  const matched = matchedOf(dish.ingredients, states)
  const total = sumOf(matched.map((item) => item.data))
  return (
    <li className="bg-secondary overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 px-4 py-3">
        {searching ? (
          <span aria-hidden="true" className={cn('size-9 shrink-0', BONE)} />
        ) : (
          <span
            aria-hidden="true"
            className={cn('w-9 shrink-0 text-center text-3xl leading-none', FADE_IN)}
          >
            {matched[0]?.data.emoji ?? '🍽️'}
          </span>
        )}
        <span className="min-w-0 flex-1 space-y-1">
          <span className="block text-base leading-snug font-medium">{dish.name}</span>
          {searching ? (
            <span aria-hidden="true" className={cn('block h-3 w-3/5', BONE)} />
          ) : (
            <MacroLine {...total} />
          )}
        </span>
        {searching ? (
          <span aria-hidden="true" className={cn('h-9 w-16 shrink-0 rounded-lg', BONE)} />
        ) : (
          <span className={cn(QUANTITY_BOX, FADE_IN)}>1 / plate</span>
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
            {dish.ingredients.map((item) => (
              <IngredientRow
                key={item.id}
                ingredient={item}
                state={states[item.id]}
                onRetry={() => onRetry(item)}
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  )
}

interface AiPlateViewProps {
  readonly dishes: AiDish[]
  readonly states: Record<string, IngredientState>
  /** Tổng đã log trong ngày và mục tiêu, cho chế độ Day của phần Nutrition. */
  readonly dayTotals?: MacroTotals
  readonly target?: ProgramWeek | null
  readonly onRetry: (ingredient: AiIngredient) => void
  readonly onStartOver: () => void
  /** `confirmations`: tên nguyên liệu AI + món user đã chọn, để cha báo BE (best-effort) trước khi vào plate. */
  readonly onLog: (items: PlateItem[], confirmations: AiConfirmIngredient[]) => void
}

/**
 * Kết quả "AI Plate": thẻ món (tên, tổng macro, số lượng, danh sách nguyên liệu mở/thu bằng grid-rows 300ms). Khi nguyên liệu còn
 * đang tra thì dòng hiện skeleton "Searching for…" và thẻ món khoá ở trạng thái mở; tra xong hết thì món tự gom tổng, hiện phần
 * Nutrition (Plate | Day) và nút Log Foods đưa các nguyên liệu khớp vào plate.
 */
export function AiPlateView({
  dishes,
  states,
  dayTotals,
  target,
  onRetry,
  onStartOver,
  onLog,
}: AiPlateViewProps) {
  const [scope, setScope] = useState<Scope>('plate')
  const ingredients = dishes.flatMap((dish) => dish.ingredients)
  const done = ingredients.every((item) => statusOf(states, item.id) !== 'searching')
  const matched = matchedOf(ingredients, states)
  const plate = sumOf(matched.map((item) => item.data))

  const logFoods = () =>
    onLog(
      matched.map(({ ingredient, data }) => ({
        key: `${ingredient.id}-${Date.now()}`,
        foodItemId: data.foodItemId,
        name: data.foodName ?? ingredient.name,
        foodServingId: data.servingId ?? null,
        servingLabel: data.unitLabel,
        quantity: data.quantity,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
      })),
      // Ước lượng (không có món thật) không có foodItemId nên không gửi confirm.
      matched.flatMap(({ ingredient, data }) =>
        data.foodItemId ? [{ name: ingredient.name, foodItemId: data.foodItemId }] : []
      )
    )

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

        <ul className="space-y-3">
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} states={states} onRetry={onRetry} />
          ))}
        </ul>
        <p className="text-muted-foreground text-center text-sm">
          AI can make mistakes, so always verify its results.
        </p>

        {done && (
          <section className={cn('space-y-3', FADE_IN)}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Nutrition</h2>
              <SlidingSwitch
                options={SCOPES}
                value={scope}
                onChange={setScope}
                label="Nutrition scope"
                className="bg-secondary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {NUTRIENTS.map((nutrient) => {
                const value =
                  scope === 'plate'
                    ? plate[nutrient.key]
                    : (dayTotals?.[nutrient.key] ?? 0) + plate[nutrient.key]
                const goal = target?.[nutrient.goal]
                const scale = Math.max(value, goal ?? 0, 1)
                return (
                  <div key={nutrient.key} className="bg-secondary space-y-2 rounded-xl p-3">
                    <p className="text-base font-medium">{nutrient.label}</p>
                    <p className="text-muted-foreground text-sm tabular-nums">
                      {scope === 'plate'
                        ? `${Math.round(value)} ${nutrient.unit} in plate`
                        : goal
                          ? `${Math.round(value)} / ${Math.round(goal)} ${nutrient.unit}`
                          : `${Math.round(value)} ${nutrient.unit}`}
                    </p>
                    <div className="bg-foreground/10 relative h-1.5 rounded-full">
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width] duration-300',
                          nutrient.bar
                        )}
                        style={{ width: `${(value / scale) * 100}%` }}
                      />
                      {goal ? (
                        <span
                          aria-hidden="true"
                          className="bg-foreground absolute -top-0.5 h-2.5 w-0.5 rounded-full"
                          style={{ left: `calc(${(goal / scale) * 100}% - 1px)` }}
                        />
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {done && (
        <div className="flex justify-end px-4 pt-2 pb-4">
          <Button
            className="h-12 shrink-0 rounded-full px-5 text-base"
            disabled={matched.length === 0}
            onClick={logFoods}
          >
            Log Foods
          </Button>
        </div>
      )}
    </div>
  )
}
