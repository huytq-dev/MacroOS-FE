import { MetricTile } from './MetricTile'
import { NutrientTile } from './NutrientTile'
import { MacroStack } from './TileVisuals'
import { nutrientValue } from '../../dashboard.utils'
import type { MacroStackDay, NutrientGroup, NutrientValue } from '../../types/dashboard.types'
import { formatAmount } from '@/features/nutrition/nutrient-display'

interface NutrientGroupSectionProps {
  readonly group: NutrientGroup
  readonly values: Readonly<Record<string, NutrientValue>>
  /** Cột chồng 7 ngày của ô "Macros". */
  readonly macrosWeek: readonly (MacroStackDay | null)[]
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
  index,
}: NutrientGroupSectionProps) {
  const id = `group-${group.key}`
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
        {group.nutrients.map((nutrient) =>
          nutrient.key === 'macros' ? (
            <MetricTile
              key={nutrient.key}
              title={nutrient.name}
              subtitle={nutrient.period ?? 'Last 7 Days'}
              visual={<MacroStack days={macrosWeek} />}
              value={formatAmount(nutrientValue(values, nutrient.key).value, nutrient.unit)}
              unit={nutrient.unit}
            />
          ) : (
            <NutrientTile key={nutrient.key} tileKey={nutrient.key} values={values} />
          )
        )}
      </div>
    </section>
  )
}
