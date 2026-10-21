import { DETAIL_CARD, MetricRow, ScaleIcon, SourceRow, WaitingIcon } from '../DetailPage'
import { MoveIndicator } from './MoveIndicator'
import type { WeightChangeStatus } from '../../types/weight-trend.types'
import type { TrendDay } from '../../weight-trend-series'
import { routePath } from '@/config/route-path'

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
}

const MOVE_OF_STATUS = { Decrease: 'down', Increase: 'up', NoChange: 'same' } as const

const signed = (value: number, digits: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`

const AREA_W = 56
const AREA_H = 20

/** Vùng thu nhỏ của xu hướng N ngày qua (tím nhạt, đường tím phía trên); chưa đủ dữ liệu thì một dải phẳng. Tự vẽ từ trái sang. */
function MiniArea({ points }: { readonly points: readonly TrendDay[] }) {
  const values = points.length >= 2 ? points.map((point) => point.trend) : [0, 0]
  const lo = Math.min(...values)
  const span = Math.max(...values) - lo
  const ys = values.map((value) => (span === 0 ? 7 : 3 + (1 - (value - lo) / span) * (AREA_H - 9)))
  const line = ys
    .map((y, index) => `${index === 0 ? 'M' : 'L'} ${(index / (ys.length - 1)) * AREA_W} ${y}`)
    .join(' ')
  return (
    <svg
      viewBox={`0 0 ${AREA_W} ${AREA_H}`}
      aria-hidden="true"
      className="text-mf-purple motion-safe:animate-chart-grow h-5 w-14 origin-left"
    >
      <path
        d={`${line} L ${AREA_W} ${AREA_H} L 0 ${AREA_H} Z`}
        fill="currentColor"
        opacity="0.28"
      />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

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
              className="grid grid-cols-[4rem_3.5rem_1fr_auto] items-center gap-2.5 text-base"
            >
              <span className="text-muted-foreground whitespace-nowrap">{days}-day</span>
              <MiniArea points={status === 'Waiting' ? [] : area} />
              <span className="tabular-nums">
                {status === 'Waiting' || delta === null ? '-- kg' : `${signed(delta, 1)} kg`}
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
          value={current === null ? '---' : current.toFixed(1)}
          unit="kg"
          title="Current Weight"
          text="Our estimate of your true weight after smoothing out day-to-day fluctuations."
        />
        <MetricRow
          value={weeklyRate === null ? '---' : weeklyRate.toFixed(2)}
          unit="kg per week"
          title="Weekly Weight Change"
          text={`Your typical weekly rate of weight ${direction} over the past three weeks.`}
        />
        <MetricRow
          value={energyKcal === null ? '---' : String(Math.round(energyKcal))}
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
