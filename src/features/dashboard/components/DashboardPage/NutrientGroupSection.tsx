import { MetricTile } from './MetricTile'
import { TargetBar } from './TileVisuals'
import { nutrientValue } from '../../dashboard.utils'
import type { NutrientGroup, NutrientValue } from '../../types/dashboard.types'

interface NutrientGroupSectionProps {
  readonly group: NutrientGroup
  readonly values: Readonly<Record<string, NutrientValue>>
  readonly index: number
}

const format = (value: number, unit: string) =>
  unit === 'kcal' || value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10)

/** Một nhóm nutrient của trang "Dinh dưỡng": tiêu đề nhóm và lưới ô, mỗi ô có thanh target theo màu của nhóm. */
export function NutrientGroupSection({ group, values, index }: NutrientGroupSectionProps) {
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
        {group.nutrients.map((nutrient) => {
          const { value, target } = nutrientValue(values, nutrient.key)
          return (
            <MetricTile
              key={nutrient.key}
              title={nutrient.name}
              subtitle={nutrient.period ?? 'Today'}
              visual={
                nutrient.kind === 'none' ? undefined : (
                  <TargetBar value={value} target={target} kind={nutrient.kind} tone={group.tone} />
                )
              }
              value={format(value, nutrient.unit)}
              unit={nutrient.unit}
            />
          )
        })}
      </div>
    </section>
  )
}
