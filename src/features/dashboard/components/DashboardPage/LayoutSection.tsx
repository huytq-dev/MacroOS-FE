import { FullBodyTile, MeasureTile, ProgressPhotosTile, RatioTile } from './BodyMetricTiles'
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
import { tilePending } from '../../dashboard-pending'
import { EntrySparkline, HabitGrid, MacroStack, StepsBars } from './TileVisuals'
import { nutrientValue } from '../../dashboard.utils'
import { SECTIONS, type NutrientDisplay, type SectionKey } from '../../dashboard-layout'
import type { DashboardData } from '../../hooks/use-dashboard-data'
import { NUTRIENT_GROUPS } from '../../nutrient-catalog'
import { routePath } from '@/config/route-path'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { useUnits, type UnitsView } from '@/features/users/hooks/use-units'

const NUTRIENT_KEYS = new Set(
  NUTRIENT_GROUPS.flatMap((group) => group.nutrients.map((nutrient) => nutrient.key))
)

/** Một ô theo khoá trong bố cục; ô số đo cơ thể chỉ hiện khi đã có dữ liệu. */
function renderTile(
  key: string,
  data: DashboardData,
  display: NutrientDisplay,
  units: UnitsView,
  derived: ReturnType<typeof useDerivedGate>
) {
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
      return (
        <MetricTile
          title="Weigh-In"
          subtitle="Last 30 Days"
          href={routePath.habitsWeighIn}
          visual={<HabitGrid cells={data.weighIn.cells} tone="bg-mf-tile-carbs" />}
          value={`${data.weighIn.week}/7`}
          unit="this week"
          loading={tilePending(key, data.pending)}
        />
      )
    case 'foodLogging':
      // Đếm từ snapshot từng ngày (`GET /expenditure/daily`, BE dựng lại) nên như các ô dẫn xuất: Failed = thẻ "Try again", Updating = mờ, tải lại lỗi = "---"
      // (không hiện số TanStack còn giữ, có thể là số trước khi BE dựng lại)
      if (derived.gate === 'failed')
        return <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
      return (
        <MetricTile
          title="Food Logging"
          subtitle="Last 30 Days"
          href={routePath.habitsFoodLogging}
          visual={
            data.loggingError ? undefined : (
              <HabitGrid cells={data.logging.cells} tone="bg-mf-tile-carbs" />
            )
          }
          value={data.loggingError ? '---' : `${data.logging.week}/7`}
          unit="this week"
          loading={tilePending(key, data.pending)}
          className={derived.gate === 'updating' ? 'opacity-60 transition-opacity' : undefined}
          busy={derived.gate === 'updating'}
        />
      )
    case 'scaleWeight':
      return (
        <MetricTile
          title="Scale Weight"
          subtitle="Last 7 Entries"
          href={routePath.weight}
          visual={<EntrySparkline values={data.scale.spark} className="text-mf-tile-carbs" />}
          value={data.scale.latest === null ? '---' : units.weight.format(data.scale.latest)}
          unit={units.weight.unit}
          loading={tilePending(key, data.pending)}
        />
      )
    case 'bodyFat':
      return (
        <MetricTile
          title="Visual Body Fat"
          subtitle="Last 7 Entries"
          href={routePath.visualBodyFat}
          visual={<EntrySparkline values={data.bodyFat.spark} className="text-mf-tile-carbs" />}
          value={fixed(data.bodyFat.latest)}
          unit="%"
          loading={tilePending(key, data.pending)}
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
          visual={<StepsBars days={data.stepsWeek} />}
          value={data.steps === null ? '---' : String(data.steps)}
          unit="steps"
          loading={tilePending(key, data.pending)}
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
          loading={tilePending(key, data.pending)}
        />
      )
    default: {
      if (NUTRIENT_KEYS.has(key)) {
        if (key === 'macros')
          return (
            <MetricTile
              title="Macros"
              subtitle="Last 7 Days"
              href={routePath.dashboardMacros}
              visual={<MacroStack days={data.macrosWeek} />}
              value={units.energy.format(nutrientValue(data.nutrientsToday, 'macros').value)}
              unit={units.energy.unit}
              loading={tilePending(key, data.pending)}
            />
          )
        return (
          <NutrientTile
            tileKey={key}
            values={data.nutrientsToday}
            display={display}
            loading={tilePending(key, data.pending)}
          />
        )
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
  const units = useUnits()
  const derived = useDerivedGate()
  if (tiles.length === 0) return null
  return (
    <TileSection title={SECTIONS[section].title} seeAllHref={SEE_ALL[section]} index={index}>
      {tiles.map((key) => (
        <div key={key} className="contents">
          {renderTile(key, data, display[key] ?? 'consumed', units, derived)}
        </div>
      ))}
    </TileSection>
  )
}
