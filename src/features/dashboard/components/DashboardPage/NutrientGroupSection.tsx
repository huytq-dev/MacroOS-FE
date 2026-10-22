import { MetricTile } from './MetricTile'
import { NutrientTile } from './NutrientTile'
import { MacroStack } from './TileVisuals'
import { nutrientValue } from '../../dashboard.utils'
import { tilePending, type DashboardPending } from '../../dashboard-pending'
import type { MacroStackDay, NutrientGroup, NutrientValue } from '../../types/dashboard.types'
import { displayAmount, formatAmount } from '@/features/nutrition/nutrient-display'
import { useUnits } from '@/features/users/hooks/use-units'

interface NutrientGroupSectionProps {
  readonly group: NutrientGroup
  readonly values: Readonly<Record<string, NutrientValue>>
  /** Cột chồng 7 ngày của ô "Macros". */
  readonly macrosWeek: readonly (MacroStackDay | null)[]
  /** Nguồn nào còn chờ BE: ô của nguồn đó hiện khung xám thay vì "---" / 0. */
  readonly pending: DashboardPending
  readonly index: number
}

/**
 * Một nhóm nutrient của trang "Dinh dưỡng": tiêu đề nhóm và lưới ô. Mỗi ô là `NutrientTile` (cùng thanh mục tiêu và cùng cách ghi số với
 * Dashboard); "Macros" là cột chồng 7 ngày; chạm một ô mở trang chi tiết của chất đó.
 */
export function NutrientGroupSection({
  group,
  values,
  macrosWeek,
  pending,
  index,
}: NutrientGroupSectionProps) {
  const id = `group-${group.key}`
  const { energy } = useUnits()
  return (
    <section
      aria-labelledby={id}
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 space-y-3 [animation-fill-mode:backwards]"
      style={{ animationDelay: `${Math.min(index, 4) * 60}ms` }}
    >
      <h2 id={id} className="text-xl font-bold">
        {group.title}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {group.nutrients.map((nutrient) => {
          if (nutrient.key !== 'macros')
            return (
              <NutrientTile
                key={nutrient.key}
                tileKey={nutrient.key}
                values={values}
                loading={tilePending(nutrient.key, pending)}
              />
            )
          const shown = displayAmount(
            nutrientValue(values, nutrient.key).value,
            nutrient.unit,
            energy
          )
          return (
            <MetricTile
              key={nutrient.key}
              title={nutrient.name}
              subtitle={nutrient.period ?? 'Last 7 Days'}
              visual={<MacroStack days={macrosWeek} />}
              value={formatAmount(shown.value, shown.unit)}
              unit={shown.unit}
              loading={tilePending(nutrient.key, pending)}
            />
          )
        })}
      </div>
    </section>
  )
}
