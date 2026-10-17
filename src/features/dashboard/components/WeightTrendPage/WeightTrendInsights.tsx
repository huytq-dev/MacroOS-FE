import { DETAIL_CARD, MetricRow, ScaleIcon, SourceRow, WaitingIcon } from '../DetailPage'
import { MoveIndicator } from './MoveIndicator'
import { moveOf } from '../../weight-trend.utils'
import { routePath } from '@/config/route-path'

interface WeightChangeRow {
  readonly days: number
  /** kg so với N ngày trước; null = chưa đủ dữ liệu. */
  readonly delta: number | null
}

interface WeightTrendInsightsProps {
  readonly changes: readonly WeightChangeRow[]
  readonly current: number | null
  readonly weeklyRate: number
  readonly energyKcal: number
  readonly projection: number | null
}

const signed = (value: number, digits: number) => `${value > 0 ? '+' : ''}${value.toFixed(digits)}`

/**
 * "Insights & Data" của Weight Trend: Weight Changes (3/7/14/30/90 ngày, "Waiting" khi chưa đủ dữ liệu), các chỉ số xu hướng
 * (cân hiện tại, tốc độ tuần, năng lượng dư/thiếu, dự báo 30 ngày) và Data Sources.
 */
export function WeightTrendInsights({
  changes,
  current,
  weeklyRate,
  energyKcal,
  projection,
}: WeightTrendInsightsProps) {
  const gaining = weeklyRate >= 0
  const direction = gaining ? 'gain' : 'loss'
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Insights & Data</h2>

      <section aria-labelledby="weight-changes-heading" className={`${DETAIL_CARD} p-4`}>
        <h3 id="weight-changes-heading" className="text-lg">
          Weight Changes
        </h3>
        <ul className="mt-3 space-y-3.5">
          {changes.map(({ days, delta }) => (
            <li
              key={days}
              className="grid grid-cols-[4.5rem_1fr_1fr_auto] items-center gap-3 text-base"
            >
              <span className="text-muted-foreground">{days}-day</span>
              <span aria-hidden="true" className="bg-mf-purple h-0.5 w-14" />
              <span className="tabular-nums">
                {delta === null ? '-- kg' : `${signed(delta, 1)} kg`}
              </span>
              {delta === null ? (
                <span className="flex items-center gap-2">
                  <WaitingIcon className="text-mf-purple size-5" />
                  <span className="text-muted-foreground">Waiting</span>
                </span>
              ) : (
                <MoveIndicator move={moveOf(delta)} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={`${DETAIL_CARD} space-y-5 p-4`}>
        <MetricRow
          value={current === null ? '---' : current.toFixed(1)}
          unit="kg"
          title="Current Weight"
          text="Our estimate of your true weight after smoothing out day-to-day fluctuations."
        />
        <MetricRow
          value={weeklyRate.toFixed(2)}
          unit="kg per week"
          title="Weekly Weight Change"
          text={`Your typical weekly rate of weight ${direction} over the past three weeks.`}
        />
        <MetricRow
          value={String(energyKcal)}
          unit="kcal per day"
          title={gaining ? 'Energy Surplus' : 'Energy Deficit'}
          text={`Our estimate of your average daily caloric ${gaining ? 'surplus' : 'deficit'}, based on your rate of weight ${direction} over the past three weeks.`}
        />
        <MetricRow
          value={projection === null ? '---' : projection.toFixed(1)}
          unit="kg"
          title="30-Day Projection"
          text={`Your projected weight in 30 days if your current rate of weight ${direction} is met.`}
        />
      </section>

      <section aria-labelledby="weight-sources-heading" className="space-y-3">
        <h2 id="weight-sources-heading" className="text-lg font-bold">
          Data Sources
        </h2>
        <div className={DETAIL_CARD}>
          <SourceRow icon={ScaleIcon} title="Scale Weight" href={routePath.weight} />
        </div>
      </section>
    </div>
  )
}
