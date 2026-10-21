import {
  FullBodyTile,
  MeasureTile,
  ProgressPhotosTile,
  RatioTile,
  sparkOf,
} from './BodyMetricTiles'
import { MetricTile } from './MetricTile'
import { TileSection } from './TileSection'
import {
  EnergyBalanceTile,
  ExpenditureTile,
  GoalProgressTile,
  WeightTrendTile,
  fixed,
} from './DashboardTiles'
import { NutrientTile } from './NutrientTile'
import { HabitGrid, MacroStack, Sparkline } from './TileVisuals'
import { nutrientValue } from '../../dashboard.utils'
import { SECTIONS, type NutrientDisplay, type SectionKey } from '../../dashboard-layout'
import type { DashboardData } from '../../hooks/use-dashboard-data'
import { NUTRIENT_GROUPS } from '../../nutrient-catalog'
import { routePath } from '@/config/route-path'

const NUTRIENT_KEYS = new Set(
  NUTRIENT_GROUPS.flatMap((group) => group.nutrients.map((nutrient) => nutrient.key))
)

/** Một ô theo khoá trong bố cục; ô số đo cơ thể chỉ hiện khi đã có dữ liệu. */
function renderTile(key: string, data: DashboardData, display: NutrientDisplay) {
  switch (key) {
    case 'expenditure':
      return <ExpenditureTile />
    case 'weightTrend':
      return <WeightTrendTile />
    case 'energyBalance':
      return <EnergyBalanceTile />
    case 'goalProgress':
      return <GoalProgressTile />
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
          subtitle="Last 7 Entries"
          href={routePath.weight}
          visual={<Sparkline values={sparkOf(data.scale.spark)} className="text-mf-tile-carbs" />}
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
          visual={<Sparkline values={sparkOf(data.bodyFat.spark)} className="text-mf-tile-carbs" />}
          value={fixed(data.bodyFat.latest)}
          unit="%"
        />
      )
    case 'progressPhotos':
      return <ProgressPhotosTile />
    case 'fullBody':
      return <FullBodyTile />
    case 'steps':
      return (
        <MetricTile
          title="Steps"
          subtitle="Last 7 Days"
          href={routePath.steps}
          value={data.steps === null ? '---' : String(data.steps)}
          unit="steps"
        />
      )
    case 'period':
      return (
        <MetricTile
          title="Period"
          subtitle="Last 30 Days"
          href={routePath.period}
          visual={<HabitGrid cells={data.period.cells} tone="bg-mf-period" />}
          value={data.period.daysAgo === null ? '---' : String(data.period.daysAgo)}
          unit="days ago"
        />
      )
    default: {
      if (NUTRIENT_KEYS.has(key)) {
        if (key === 'macros')
          return (
            <MetricTile
              title="Macros"
              subtitle="Last 7 Days"
              href={routePath.dashboardNutrition}
              visual={<MacroStack days={data.macrosWeek} />}
              value={String(Math.round(nutrientValue(data.nutrientsToday, 'macros').value))}
              unit="kcal"
            />
          )
        return <NutrientTile tileKey={key} values={data.nutrientsToday} display={display} />
      }
      const label = SECTIONS.bodyMetrics.groups
        .flatMap((g) => g.tiles)
        .find((tile) => tile.key === key)
      if (key === 'waistToHeight' || key === 'waistToHip')
        return <RatioTile tileKey={key} title={label?.label ?? key} />
      return <MeasureTile tileKey={key} title={label?.label ?? key} />
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
