'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { NutrientGoalBar } from '@/features/nutrition/NutrientGoalBar'
import { NO_GOAL, primaryGoal, type NutrientGoal } from '@/features/nutrition/goal-progress'
import { MACRO_TONE } from '@/features/nutrition/nutrient-display'
import { cn } from '@/lib/utils'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { usePlateNutrients } from '../../../hooks/use-food-log'
import { programGoals } from '../../../nutrition-overview.utils'
import type { MacroTotals, PlateItem, PlateNutrientsItem } from '../../../types/food-log.types'
import { NutrientCard } from '../../NutritionOverviewPage'
import { SECTION_GROUPS } from '../FoodDetail'
import { SlidingSwitch } from '../SlidingSwitch'

type View = 'plate' | 'day'

const VIEWS = [
  { value: 'plate', label: 'Plate' },
  { value: 'day', label: 'Day' },
] as const

const MACRO_CARDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
] as const

const SWITCH = 'h-7! w-12! [&_[data-slot=switch-thumb]]:size-6'

interface PlateNutritionProps {
  /** Ngày sẽ ghi (yyyy-MM-dd): chế độ Day và mục tiêu lấy theo ngày này. */
  readonly date: string
  readonly plate: readonly PlateItem[]
  readonly plateTotals: MacroTotals
  /** Tổng đã log trong ngày (không gồm plate); chưa tải xong thì thiếu. */
  readonly dayTotals?: MacroTotals
  readonly target?: ProgramWeek | null
  /** false = chỉ xem phần của `plate` (ẩn công tắc Plate | Day): dùng cho View của các món đã chọn trên timeline. */
  readonly allowDay?: boolean
}

/** Cộng lượng từng chất của các dòng plate (dòng không có dữ liệu chất đó coi như 0); dùng khi chưa có số từ BE. */
function sumNutrients(plate: readonly PlateItem[]) {
  const sums: Record<string, number> = {}
  for (const item of plate)
    for (const [key, amount] of Object.entries(item.nutrients ?? {}))
      sums[key] = (sums[key] ?? 0) + amount
  return sums
}

/** Dòng plate → dòng request của BE: món (serving null = gram), recipe (số khẩu phần), hoặc ước lượng chỉ có macro. */
const toRequestItem = (item: PlateItem): PlateNutrientsItem =>
  item.recipeId
    ? { recipeId: item.recipeId, quantity: item.quantity }
    : item.foodItemId
      ? { foodItemId: item.foodItemId, foodServingId: item.foodServingId, quantity: item.quantity }
      : {
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        }

/**
 * Mục Nutrition của Your Plate: công tắc Plate | Day, bốn thẻ Calories / Protein / Fat / Carbs (số, thanh với vạch mục tiêu) và
 * "Show all nutrients" mở đủ các nhóm chất. Số liệu đủ chất (kể cả vi chất của recipe và tổng ngày) lấy từ BE
 * `POST /food-logs/plate/nutrients` theo ngày đang ghi; trong lúc tải hoặc khi lỗi thì dùng số cộng tại chỗ từ các dòng plate.
 */
export function PlateNutrition({
  date,
  plate,
  plateTotals,
  dayTotals,
  target,
  allowDay = true,
}: PlateNutritionProps) {
  const [chosenView, setView] = useState<View>('plate')
  const view: View = allowDay ? chosenView : 'plate'
  const [showAll, setShowAll] = useState(false)
  const macroGoals = programGoals(target)
  const remote = usePlateNutrients(
    { date, items: plate.map(toRequestItem) },
    showAll || view === 'day'
  )
  const rows = view === 'plate' ? remote.data?.plate : remote.data?.day
  const remoteByKey: Record<string, { amount: number | null; goal: NutrientGoal }> = {}
  for (const row of rows ?? [])
    if (row.key)
      remoteByKey[row.key] = {
        amount: row.amount,
        goal: {
          floor: row.floor,
          target: row.target,
          ceiling: row.ceiling,
          goalKind: row.goalKind,
        },
      }

  const plateNutrients = sumNutrients(plate)
  const localValue = (key: string) => {
    const macro = MACRO_CARDS.some((card) => card.key === key)
    if (macro) {
      const plateValue = plateTotals[key as keyof MacroTotals]
      return view === 'plate'
        ? plateValue
        : (dayTotals?.[key as keyof MacroTotals] ?? 0) + plateValue
    }
    return plateNutrients[key] ?? 0
  }
  // Số từ BE khi có (amount null = chưa có dữ liệu → "---"), không thì số cộng tại chỗ
  const valueOf = (key: string): number | null =>
    key in remoteByKey ? remoteByKey[key].amount : localValue(key)
  // Mục tiêu từ BE nguyên vẹn; chưa có thì calo / macro lấy từ chương trình, chất khác không có mục tiêu
  const goalOf = (key: string): NutrientGoal =>
    remoteByKey[key]?.goal ?? macroGoals[key as keyof typeof macroGoals] ?? NO_GOAL

  return (
    <section aria-labelledby="plate-nutrition" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="plate-nutrition" className="text-xl font-bold">
          Nutrition
        </h2>
        {allowDay && (
          <SlidingSwitch
            options={VIEWS}
            value={view}
            onChange={setView}
            label="Nutrition view"
            className="bg-card"
          />
        )}
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {MACRO_CARDS.map((card) => {
          const goal = goalOf(card.key)
          const reference = primaryGoal(goal)
          const value = valueOf(card.key) ?? 0
          // kcal làm tròn nguyên, gram một số lẻ (bỏ ".0"): "618 / 2880 kcal", "16.1 / 137 g"
          const shown = card.unit === 'kcal' ? Math.round(value) : Number(value.toFixed(1))
          return (
            <li key={card.key} className="bg-card rounded-xl px-4 py-4">
              <p className="text-base font-medium">{card.label}</p>
              <p className="text-muted-foreground mt-1 text-sm tabular-nums">
                {view === 'plate'
                  ? `${shown} ${card.unit} in plate`
                  : `${shown}${reference !== null ? ` / ${Math.round(reference)}` : ''} ${card.unit}`}
              </p>
              <div className="mt-4">
                <NutrientGoalBar
                  goal={goal}
                  consumed={value}
                  tone={MACRO_TONE[card.key]}
                  layout="row"
                />
              </div>
            </li>
          )
        })}
      </ul>

      <label className="bg-card flex min-h-14 items-center justify-between gap-3 rounded-xl px-4 text-base">
        Show all nutrients
        <Switch
          checked={showAll}
          onCheckedChange={setShowAll}
          aria-label="Show all nutrients"
          className={SWITCH}
        />
      </label>

      {/* Mở/đóng bằng grid-rows 1fr ↔ 0fr (300ms) thay vì gỡ khỏi cây, để có cả hoạt ảnh đóng */}
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
          showAll ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0 space-y-6 overflow-hidden" inert={!showAll}>
          {SECTION_GROUPS.map((group) => (
            <section key={group.key} aria-labelledby={`plate-${group.key}`} className="space-y-3">
              <h3 id={`plate-${group.key}`} className="text-xl font-bold">
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.nutrients.map((nutrient) => {
                  const goal = goalOf(nutrient.key)
                  return (
                    <NutrientCard
                      key={nutrient.key}
                      nutrient={nutrient}
                      value={valueOf(nutrient.key)}
                      goal={goal}
                      tone={group.tone}
                    />
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
