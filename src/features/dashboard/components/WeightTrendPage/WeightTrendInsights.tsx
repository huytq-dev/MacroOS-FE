import {
  DETAIL_CARD,
  MetricRow,
  MiniArea,
  ScaleIcon,
  SourceRow,
  WaitingIcon,
  padWindow,
} from '../DetailPage'
import { MoveIndicator } from './MoveIndicator'
import type { WeightChangeStatus } from '../../types/weight-trend.types'
import type { TrendDay } from '../../weight-trend-series'
import { routePath } from '@/config/route-path'
import { useUnits } from '@/features/users/hooks/use-units'

interface WeightChangeRow {
  readonly days: number
  /** kg so với N ngày trước; null = chưa đủ dữ liệu. */
  readonly delta: number | null
  /** Trạng thái do BE tính: Decrease / Increase / NoChange (|đổi| < 0.05 kg) / Waiting (chưa đủ lịch sử). */
  readonly status: WeightChangeStatus
  /** Xu hướng N + 1 ngày cuối, vẽ vùng thu nhỏ của hàng. */
  readonly area: readonly TrendDay[]
}

interface WeightTrendInsightsProps {
  readonly changes: readonly WeightChangeRow[]
  readonly current: number | null
  /** kg / tuần; null khi chưa đủ 7 ngày dữ liệu. */
  readonly weeklyRate: number | null
  /** kcal / ngày, âm khi đang giảm; null khi chưa đủ 7 ngày dữ liệu. */
  readonly energyKcal: number | null
  readonly projection: number | null
  /** Lý do BE chưa tính tốc độ (chưa đủ lần cân / lâu không cân): hiện dưới ba chỉ số "---"; null khi đã tính. */
  readonly waiting: string | null
}

const MOVE_OF_STATUS = { Decrease: 'down', Increase: 'up', NoChange: 'same' } as const

/** Giảm hiện "−0.1", tăng hiện "0.1" (không dấu +, như MacroFactor); nhãn Increase / Decrease đã báo hướng. */
const changeText = (value: number) => `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}`

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
  waiting,
}: WeightTrendInsightsProps) {
  const { weight, energy } = useUnits()
  const gaining = (weeklyRate ?? 0) > 0
  const direction = gaining ? 'gain' : 'loss'
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Insights & Data</h2>

      <section aria-labelledby="weight-changes-heading" className={`${DETAIL_CARD} p-4`}>
        <h3 id="weight-changes-heading" className="text-lg">
          Weight Changes
        </h3>
        <ul className="mt-3 space-y-3.5">
          {changes.map(({ days, delta, status, area }) => (
            <li
              key={days}
              className="grid grid-cols-[4rem_minmax(0,3.5rem)_1fr_auto] items-center gap-2.5 text-base max-[359px]:grid-cols-[3.25rem_minmax(0,3.5rem)_1fr_auto] max-[359px]:text-sm"
            >
              <span className="text-muted-foreground whitespace-nowrap">{days}-day</span>
              <MiniArea
                values={padWindow(
                  area.map((day) => day.trend),
                  days
                )}
                className="text-mf-purple"
              />
              <span className="whitespace-nowrap tabular-nums">
                {status === 'Waiting' || delta === null
                  ? `-- ${weight.unit}`
                  : `${changeText(weight.convert(delta))} ${weight.unit}`}
              </span>
              {status === 'Waiting' ? (
                <span className="flex items-center gap-2">
                  <WaitingIcon className="text-mf-purple size-5" />
                  <span className="text-muted-foreground">Waiting</span>
                </span>
              ) : (
                <MoveIndicator move={MOVE_OF_STATUS[status]} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={`${DETAIL_CARD} space-y-5 p-4`}>
        <MetricRow
          value={current === null ? '---' : weight.format(current)}
          unit={weight.unit}
          title="Current Weight"
          text="Our estimate of your true weight after smoothing out day-to-day fluctuations."
        />
        <MetricRow
          value={weeklyRate === null ? '---' : weight.format(weeklyRate, 2)}
          unit={`${weight.unit} per week`}
          title="Weekly Weight Change"
          text={`Your typical weekly rate of weight ${direction} over the past three weeks.`}
        />
        <MetricRow
          value={energyKcal === null ? '---' : energy.format(energyKcal)}
          unit={`${energy.unit} per day`}
          title={gaining ? 'Energy Surplus' : 'Energy Deficit'}
          text={`Our estimate of your average daily caloric ${gaining ? 'surplus' : 'deficit'}, based on your rate of weight ${direction} over the past three weeks.`}
        />
        <MetricRow
          value={projection === null ? '---' : weight.format(projection)}
          unit={weight.unit}
          title="30-Day Projection"
          text={`Your projected weight in 30 days if your current rate of weight ${direction} is met.`}
        />
        {waiting !== null && (
          <p className="text-muted-foreground flex items-start gap-2 text-sm" role="status">
            <WaitingIcon className="text-mf-purple mt-0.5 size-4 shrink-0" />
            {waiting}
          </p>
        )}
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
