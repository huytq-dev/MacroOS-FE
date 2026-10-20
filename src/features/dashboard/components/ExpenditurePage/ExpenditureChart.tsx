'use client'

import { yScale, type ChartPoint, type RangeKey } from '../../expenditure.utils'
import { cn } from '@/lib/utils'

const WIDTH = 360
const PAD = { left: 4, right: 52, top: 14, bottom: 28 }
const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BAR_MODE_MAX = 14

interface ExpenditureChartProps {
  readonly points: readonly ChartPoint[]
  readonly range: RangeKey
  /** Số ô ngang của trục x: 1W luôn là 7 (ngày chưa tới để trống), các kỳ khác = số điểm. */
  readonly height: number
  readonly className?: string
}

const dayOfWeekIndex = (date: string) => (new Date(`${date}T00:00:00`).getDay() + 6) % 7

/**
 * Biểu đồ Expenditure kiểu MacroFactor: dải Flux (mờ) quanh đường Expenditure; ít điểm thì vẽ từng cột có hai ô vuông ở
 * hai đầu đoạn kcal (Holding) hoặc vòng tròn (Updating), nhiều điểm thì vẽ dải liền + đường; trục kcal bên phải, vạch đứt ngang.
 */
export function ExpenditureChart({ points, range, height, className }: ExpenditureChartProps) {
  const { ticks, min, max } = yScale(points)
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * plotH
  const slots = range === '1W' ? 7 : Math.max(points.length, 1)
  const slotW = plotW / slots
  const barMode = points.length <= BAR_MODE_MAX
  const slotOf = (point: ChartPoint, index: number) =>
    range === '1W' ? dayOfWeekIndex(point.date) : index
  const x = (slot: number) => PAD.left + slotW * (slot + 0.5)

  const xLabels: { slot: number; text: string }[] =
    range === '1W'
      ? WEEK_LABELS.map((text, slot) => ({ slot, text }))
      : points
          .map((point, index) => ({ point, index }))
          .filter(({ index }) => index % Math.max(1, Math.round(points.length / 5)) === 0)
          .map(({ point, index }) => ({
            slot: index,
            text: new Date(`${point.date}T00:00:00`).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
          }))

  const line = points
    .map((point, index) => `${x(slotOf(point, index))},${y(point.value)}`)
    .join(' ')
  const band = [
    ...points.map((point, index) => `${x(slotOf(point, index))},${y(point.high)}`),
    ...[...points].reverse().map((point, i) => {
      const index = points.length - 1 - i
      return `${x(slotOf(point, index))},${y(point.low)}`
    }),
  ].join(' ')

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label="Expenditure chart"
      className={cn('w-full', className)}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1="0"
            x2={WIDTH - PAD.right + 8}
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-foreground/25"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x={WIDTH - 2}
            y={y(tick) + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[11px] tabular-nums"
          >
            {Math.round(tick)}
          </text>
        </g>
      ))}
      <line
        x1="0"
        x2={WIDTH - PAD.right + 8}
        y1={height - PAD.bottom}
        y2={height - PAD.bottom}
        className="stroke-foreground/50"
      />

      {barMode
        ? points.map((point, index) => {
            const cx = x(slotOf(point, index))
            const w = slotW * 0.62
            return (
              <g
                key={point.date}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500"
              >
                <rect
                  x={cx - w / 2}
                  y={y(point.high)}
                  width={w}
                  height={Math.max(2, y(point.low) - y(point.high))}
                  className="fill-mf-tile-protein/30"
                />
                <line
                  x1={cx - w / 2}
                  x2={cx + w / 2}
                  y1={y(point.value)}
                  y2={y(point.value)}
                  className="stroke-mf-tile-protein"
                  strokeWidth="1.5"
                />
                {point.holding ? (
                  <>
                    <rect
                      x={cx - w / 2 - 3}
                      y={y(point.value) - 3}
                      width="6"
                      height="6"
                      className="fill-card stroke-mf-tile-protein"
                      strokeWidth="1.5"
                    />
                    <rect
                      x={cx + w / 2 - 3}
                      y={y(point.value) - 3}
                      width="6"
                      height="6"
                      className="fill-card stroke-mf-tile-protein"
                      strokeWidth="1.5"
                    />
                  </>
                ) : (
                  <circle
                    cx={cx}
                    cy={y(point.value)}
                    r="3.5"
                    className="fill-card stroke-mf-tile-protein"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            )
          })
        : points.length > 0 && (
            <>
              <polygon points={band} className="fill-mf-tile-protein/25" />
              <polyline
                points={line}
                fill="none"
                pathLength={1}
                className="stroke-mf-tile-protein motion-safe:animate-chart-draw"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </>
          )}

      {xLabels.map(({ slot, text }) => (
        <text
          key={`${slot}-${text}`}
          x={x(slot)}
          y={height - 8}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
        >
          {text}
        </text>
      ))}
      {points.length === 0 && (
        <text
          x={(WIDTH - PAD.right) / 2}
          y={height / 2}
          textAnchor="middle"
          className="fill-muted-foreground text-sm"
        >
          No data yet
        </text>
      )}
    </svg>
  )
}
