'use client'

import { FoodIcon } from '@/components/shared/FoodIcon'
import { SheetFrame } from '@/components/shared/SheetFrame'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { foodsLabel, totalsOfEntries } from '../../selection.utils'
import type { FoodLogEntry, PlateItem } from '../../types/food-log.types'
import { macroShares } from './FoodDetail/food-detail.utils'
import { FoodMacroRow } from './FoodDetail/FoodMacroRow'
import { ImpactRings, type ImpactItem } from './FoodDetail/ImpactRings'
import { PlateNutrition } from './PlatePanel/PlateNutrition'

const RINGS = [
  {
    key: 'calories',
    label: 'Calories',
    stroke: 'stroke-mf-tile-calories',
    target: 'caloriesTarget',
  },
  { key: 'protein', label: 'Protein', stroke: 'stroke-mf-tile-protein', target: 'proteinTarget' },
  { key: 'fat', label: 'Fat', stroke: 'stroke-mf-tile-fat', target: 'fatTarget' },
  { key: 'carbs', label: 'Carbs', stroke: 'stroke-mf-tile-carbs', target: 'carbsTarget' },
] as const

interface SelectionSummarySheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Các món đã chọn (đúng thứ tự trên timeline) và dòng plate tương ứng để tính nhóm chất. */
  readonly entries: readonly FoodLogEntry[]
  readonly plate: readonly PlateItem[]
  /** Ngày đang xem (mục tiêu và nhóm chất lấy theo ngày này). */
  readonly date: string
  readonly target: ProgramWeek | null
}

/**
 * Bảng View của chế độ chọn nhiều món (như MacroFactor): "N Foods", hàng icon các món, tổng calo + macro kèm % calo, Impact on
 * Targets (% so với mục tiêu ngày) và đủ các nhóm chất của riêng các món đã chọn (BE `POST /food-logs/plate/nutrients`).
 */
export function SelectionSummarySheet({
  open,
  onOpenChange,
  entries,
  plate,
  date,
  target,
}: SelectionSummarySheetProps) {
  const totals = totalsOfEntries(entries)
  const shares = macroShares(totals.protein, totals.carbs, totals.fat)
  const rings: ImpactItem[] = RINGS.map((ring) => {
    const goal = target?.[ring.target] ?? null
    const value = totals[ring.key]
    return {
      key: ring.key,
      label: ring.label,
      stroke: ring.stroke,
      percent: goal && goal > 0 ? Math.round((value / goal) * 100) : null,
    }
  })

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={foodsLabel(entries.length)}
      showDone={false}
      tall
    >
      <div className="px-4 pb-8">
        <ul aria-label="Selected foods" className="flex gap-2 overflow-x-auto pt-4 pb-1">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="border-border flex size-12 shrink-0 items-center justify-center rounded-full border"
            >
              <FoodIcon iconKey={entry.iconKey} emoji={entry.emoji ?? null} size={28} />
            </li>
          ))}
        </ul>
        <FoodMacroRow
          calories={totals.calories}
          protein={totals.protein}
          fat={totals.fat}
          carbs={totals.carbs}
          shares={shares}
        />
        <section aria-labelledby="selection-impact" className="mb-8 space-y-4">
          <h2 id="selection-impact" className="text-xl font-bold">
            Impact on Targets
          </h2>
          <ImpactRings items={rings} isLoading={false} />
        </section>
        <PlateNutrition
          date={date}
          plate={plate}
          plateTotals={totals}
          target={target}
          allowDay={false}
        />
      </div>
    </SheetFrame>
  )
}
