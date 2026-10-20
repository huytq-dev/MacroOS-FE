'use client'

import type { RangeKey } from '../../expenditure.utils'
import { weightScale, type WeightPoint } from '../../weight-trend.utils'
import { cn } from '@/lib/utils'

const WIDTH = 360
const PAD = { left: 4, right: 52, top: 14, bottom: 28 }
const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
/** Từng này điểm trở xuống thì vẽ dấu chấm/vòng tròn từng ngày, nhiều hơn chỉ vẽ đường. */
const MARKER_MODE_MAX = 14

interface WeightTrendChartProps {
  readonly points: readonly WeightPoint[]
  readonly range: RangeKey
  readonly height: number
  readonly className?: string
}

const dayOfWeekIndex = (date: string) => (new Date(`${date}T00:00:00`).getDay() + 6) % 7

/**
 * Biểu đồ Weight Trend kiểu MacroFactor: số cân thô là đường mảnh mờ có chấm nhỏ, xu hướng là đường tím đậm có vòng tròn;
 * 1W luôn đủ 7 ô Mon→Sun (ngày chưa tới để trống), trục kg bên phải với vạch đứt ngang.
 */
export function WeightTrendChart({ points, range, height, className }: WeightTrendChartProps) {
  const { ticks, min, max } = weightScale(points)
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * plotH
  const slots = range === '1W' ? 7 : Math.max(points.length, 1)
  const slotW = plotW / slots
  const x = (point: WeightPoint, index: number) =>
    PAD.left + slotW * ((range === '1W' ? dayOfWeekIndex(point.date) : index) + 0.5)
  const markers = points.length <= MARKER_MODE_MAX

  const xLabels =
    range === '1W'
      ? WEEK_LABELS.map((text, slot) => ({ x: PAD.left + slotW * (slot + 0.5), text }))
      : points
          .map((point, index) => ({ point, index }))
          .filter(({ index }) => index % Math.max(1, Math.round(points.length / 5)) === 0)
          .map(({ point, index }) => ({
            x: x(point, index),
            text: new Date(`${point.date}T00:00:00`).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
          }))

  const scaleLine = points.map((point, index) => `${x(point, index)},${y(point.scale)}`).join(' ')
  const trendLine = points.map((point, index) => `${x(point, index)},${y(point.trend)}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label="Weight trend chart"
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

      {points.length > 0 && (
        <>
          <polyline
            points={scaleLine}
            fill="none"
            pathLength={1}
            className="stroke-mf-purple/45 motion-safe:animate-chart-draw"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <polyline
            points={trendLine}
            fill="none"
            pathLength={1}
            className="stroke-mf-purple motion-safe:animate-chart-draw"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </>
      )}
      {markers &&
        points.map((point, index) => (
          <g
            key={point.date}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500"
          >
            <circle cx={x(point, index)} cy={y(point.scale)} r="2" className="fill-mf-purple/60" />
            <circle
              cx={x(point, index)}
              cy={y(point.trend)}
              r="3.5"
              className="fill-card stroke-mf-purple"
              strokeWidth="1.5"
            />
          </g>
        ))}

      {xLabels.map(({ x: labelX, text }) => (
        <text
          key={`${labelX}-${text}`}
          x={labelX}
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
