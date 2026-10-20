'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecipeNutrients } from '../../hooks/use-food-log'
import { MACRO_BAR } from '../../nutrition-overview.utils'
import type { RecipeIngredientRequest } from '../../types/food-log.types'
import { SECTION_GROUPS } from '../FoodLogPage/FoodDetail'
import { SlidingSwitch } from '../FoodLogPage/SlidingSwitch'
import { NutrientBar, NutrientCard } from '../NutritionOverviewPage'

type View = 'serving' | 'recipe'

const VIEWS = [
  { value: 'serving', label: 'Serving' },
  { value: 'recipe', label: 'Recipe' },
] as const

const MACRO_CARDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
] as const

interface RecipeNutritionProps {
  /** Nguyên liệu hợp lệ (đã đổi sang request của BE); rỗng thì chưa tính. */
  readonly ingredients: readonly RecipeIngredientRequest[]
  readonly servingsCount: number
}

/**
 * Mục Nutrition của Create Recipe bước 1 (như MacroFactor): công tắc Serving | Recipe, bốn thẻ Calories / Protein / Fat / Carbs
 * ("1474 kcal per serving" hoặc "total", thanh với vạch mục tiêu) rồi toàn bộ các nhóm chất cộng từ mọi nguyên liệu. Số liệu từ BE
 * `POST /recipes/nutrients`; perServing = tổng ÷ số khẩu phần. Đổi nguyên liệu hoặc số khẩu phần thì tính lại, thanh chạy mượt.
 */
export function RecipeNutrition({ ingredients, servingsCount }: RecipeNutritionProps) {
  const [view, setView] = useState<View>('serving')
  const ready = ingredients.length > 0
  const remote = useRecipeNutrients(
    { ingredients: [...ingredients], servingsCount: Math.max(1, servingsCount) },
    ready
  )
  const data = remote.data
  const rows = view === 'serving' ? data?.perServingNutrients : data?.totalNutrients
  const byKey: Record<string, { amount: number | null; target: number | null }> = {}
  for (const row of rows ?? [])
    if (row.key)
      byKey[row.key] = { amount: row.amount, target: row.target ?? row.ceiling ?? row.floor }
  const macros = view === 'serving' ? data?.perServing : data?.total
  const suffix = view === 'serving' ? 'per serving' : 'total'

  return (
    <section aria-labelledby="recipe-nutrition" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="recipe-nutrition" className="text-xl font-bold">
          Nutrition
        </h2>
        <SlidingSwitch
          options={VIEWS}
          value={view}
          onChange={setView}
          label="Nutrition view"
          className="bg-card"
        />
      </div>

      {!ready ? (
        <p className="bg-card text-muted-foreground rounded-xl px-4 py-4 text-base">
          Add ingredients to see the nutrition.
        </p>
      ) : remote.isPending ? (
        <div className="grid grid-cols-2 gap-3" aria-busy="true">
          {MACRO_CARDS.map((card) => (
            <Skeleton key={card.key} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : remote.isError || !data ? (
        <p role="alert" className="bg-card text-muted-foreground rounded-xl px-4 py-4 text-base">
          Couldn&apos;t calculate the nutrition. Check the ingredients and try again.
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3">
            {MACRO_CARDS.map((card) => {
              const value = macros?.[card.key] ?? byKey[card.key]?.amount ?? 0
              const shown = card.unit === 'kcal' ? Math.round(value) : Number(value.toFixed(1))
              return (
                <li key={card.key} className="bg-card rounded-xl px-4 py-4">
                  <p className="text-base font-medium">{card.label}</p>
                  <p className="text-muted-foreground mt-1 text-sm tabular-nums">
                    {shown} {card.unit} {suffix}
                  </p>
                  <div className="mt-4">
                    <NutrientBar
                      kind="target"
                      value={value}
                      target={byKey[card.key]?.target ?? null}
                      tone={MACRO_BAR[card.key]}
                    />
                  </div>
                </li>
              )
            })}
          </ul>

          {SECTION_GROUPS.map((group) => (
            <section key={group.key} aria-labelledby={`recipe-${group.key}`} className="space-y-3">
              <h3 id={`recipe-${group.key}`} className="text-xl font-bold">
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.nutrients.map((nutrient) => (
                  <NutrientCard
                    key={nutrient.key}
                    nutrient={nutrient}
                    value={byKey[nutrient.key]?.amount ?? 0}
                    target={byKey[nutrient.key]?.target ?? null}
                    tone={group.tone}
                  />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </section>
  )
}
