import { MetricTile } from './MetricTile'
import { TileSection } from './TileSection'
import {
  EnergyBalanceTile,
  ExpenditureTile,
  GoalProgressTile,
  WeightTrendTile,
  fixed,
} from './DashboardTiles'
import { HabitGrid, Sparkline, TargetBar } from './TileVisuals'
import { energyBalance, nutrientValue } from '../../dashboard.utils'
import { SECTIONS, type NutrientDisplay, type SectionKey } from '../../dashboard-layout'
import type { DashboardData } from '../../hooks/use-dashboard-data'
import { NUTRIENT_GROUPS } from '../../nutrient-catalog'
import { routePath } from '@/config/route-path'

const NUTRIENTS = new Map(
  NUTRIENT_GROUPS.flatMap((group) =>
    group.nutrients.map((nutrient) => [nutrient.key, { nutrient, tone: group.tone }])
  )
)
const MACRO_TONE: Record<string, string> = {
  calories: 'bg-mf-tile-calories',
  protein: 'bg-mf-tile-protein',
  fat: 'bg-mf-tile-fat',
  carbs: 'bg-mf-tile-carbs',
}

/** Ô dinh dưỡng: số theo cách người dùng chọn (phần trăm / đã ăn / còn lại) và thanh target. */
function NutrientTile({
  tileKey,
  data,
  display,
}: {
  readonly tileKey: string
  readonly data: DashboardData
  readonly display: NutrientDisplay
}) {
  const entry = NUTRIENTS.get(tileKey)
  if (!entry) return null
  const { nutrient, tone } = entry
  const { value, target } = nutrientValue(data.nutrientsToday, tileKey)
  const hasTarget = target !== null && target > 0
  const shown =
    display === 'percent' && hasTarget
      ? { text: String(Math.round((value / target) * 100)), unit: '%' }
      : display === 'remaining' && hasTarget
        ? { text: String(Math.max(0, Math.round(target - value))), unit: nutrient.unit }
        : { text: String(Math.round(value * 10) / 10), unit: nutrient.unit }
  return (
    <MetricTile
      title={nutrient.name}
      subtitle={nutrient.period ?? 'Today'}
      href={routePath.dashboardNutrition}
      visual={
        nutrient.kind === 'none' ? undefined : (
          <TargetBar
            value={value}
            target={target}
            kind={nutrient.kind}
            tone={MACRO_TONE[tileKey] ?? tone}
          />
        )
      }
      value={shown.text}
      unit={shown.unit}
    />
  )
}

const MEASURE_UNIT: Record<string, string> = { waistToHeight: '', waistToHip: '' }

/** Một ô theo khoá trong bố cục; số đo cơ thể chưa có API thì hiện "---". */
function renderTile(key: string, data: DashboardData, display: NutrientDisplay) {
  switch (key) {
    case 'expenditure':
      return <ExpenditureTile data={data} />
    case 'weightTrend':
      return <WeightTrendTile data={data} />
    case 'energyBalance':
      return <EnergyBalanceTile data={data} />
    case 'goalProgress':
      return <GoalProgressTile data={data} />
    case 'weighIn':
    case 'foodLogging': {
      const habit = key === 'weighIn' ? data.weighIn : data.logging
      return (
        <MetricTile
          title={key === 'weighIn' ? 'Weigh-In' : 'Food Logging'}
          subtitle="Last 30 Days"
          href={key === 'weighIn' ? routePath.habitsWeighIn : routePath.habitsFoodLogging}
          visual={<HabitGrid cells={habit.cells} tone="bg-mf-tile-carbs" />}
          value={`${habit.week}/7`}
          unit="this week"
        />
      )
    }
    case 'scaleWeight':
      return (
        <MetricTile
          title="Scale Weight"
          subtitle="Last 7 Weigh-Ins"
          href={routePath.weight}
          visual={<Sparkline values={data.scale.spark} className="text-mf-tile-carbs" />}
          value={fixed(data.scale.latest)}
          unit="kg"
        />
      )
    case 'bodyFat':
      return (
        <MetricTile
          title="Visual Body Fat"
          subtitle="Last 7 Entries"
          href={routePath.visualBodyFat}
          visual={<Sparkline values={data.bodyFat.spark} className="text-mf-tile-carbs" />}
          value={fixed(data.bodyFat.latest)}
          unit="%"
        />
      )
    case 'steps':
      return (
        <MetricTile
          title="Steps"
          subtitle="Last 7 Days"
          value={data.steps === null ? '---' : String(data.steps)}
          unit="steps"
        />
      )
    case 'period':
      return (
        <MetricTile
          title="Period"
          subtitle="Last 30 Days"
          visual={<HabitGrid cells={data.period.cells} tone="bg-mf-tile-protein" />}
          value={data.period.daysAgo === null ? '---' : String(data.period.daysAgo)}
          unit="days ago"
        />
      )
    default: {
      if (NUTRIENTS.has(key)) {
        if (key === 'macros')
          return (
            <MetricTile
              title="Macros"
              subtitle="Last 7 Days"
              value={String(
                energyBalance(data.daily.slice(-7), 'targets', null, null).nutrition ?? 0
              )}
              unit="kcal"
            />
          )
        return <NutrientTile tileKey={key} data={data} display={display} />
      }
      const label = SECTIONS.bodyMetrics.groups
        .flatMap((g) => g.tiles)
        .find((tile) => tile.key === key)
      return (
        <MetricTile
          title={label?.label ?? key}
          subtitle="Last 7 Entries"
          value="---"
          unit={MEASURE_UNIT[key] ?? 'cm'}
        />
      )
    }
  }
}

const SEE_ALL: Partial<Record<SectionKey, string>> = {
  insights: routePath.dashboardInsights,
  nutrition: routePath.dashboardNutrition,
}

interface LayoutSectionProps {
  readonly section: SectionKey
  readonly tiles: readonly string[]
  readonly display: Readonly<Record<string, NutrientDisplay>>
  readonly data: DashboardData
  readonly index: number
}

/** Một nhóm ô của Dashboard theo bố cục người dùng: ẩn cả nhóm khi không còn ô nào. */
export function LayoutSection({ section, tiles, display, data, index }: LayoutSectionProps) {
  if (tiles.length === 0) return null
  return (
    <TileSection title={SECTIONS[section].title} seeAllHref={SEE_ALL[section]} index={index}>
      {tiles.map((key) => (
        <div key={key} className="contents">
          {renderTile(key, data, display[key] ?? 'consumed')}
        </div>
      ))}
    </TileSection>
  )
}
