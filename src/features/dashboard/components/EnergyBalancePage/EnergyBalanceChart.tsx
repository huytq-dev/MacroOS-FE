'use client'

import type { BalanceMode } from '../../dashboard.utils'
import { balanceScale, type BalancePoint } from '../../energy-balance.utils'
import type { RangeKey } from '../../expenditure.utils'
import { cn } from '@/lib/utils'

const WIDTH = 360
const PAD = { left: 4, right: 52, top: 14, bottom: 28 }
const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface EnergyBalanceChartProps {
  readonly points: readonly BalancePoint[]
  readonly range: RangeKey
  readonly mode: BalanceMode
  readonly height: number
  readonly className?: string
}

const dayOfWeekIndex = (date: string) => new Date(`${date}T00:00:00`).getDay()

/**
 * Biểu đồ Energy Balance kiểu MacroFactor: cột xanh là kcal đã ăn (chỉ ngày có log), đường nét đứt là mốc so sánh
 * (cam = Expenditure, vàng = Targets); 1W luôn đủ 7 ô Sun→Sat, trục kcal bên phải với vạch đứt ngang.
 */
export function EnergyBalanceChart({
  points,
  range,
  mode,
  height,
  className,
}: EnergyBalanceChartProps) {
  const { ticks, max } = balanceScale(points)
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const y = (value: number) => PAD.top + (1 - value / max) * plotH
  const slots = range === '1W' ? 7 : Math.max(points.length, 1)
  const slotW = plotW / slots
  const x = (point: BalancePoint, index: number) =>
    PAD.left + slotW * ((range === '1W' ? dayOfWeekIndex(point.date) : index) + 0.5)
  const barWidth = Math.min(22, slotW * 0.6)

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

  const baseline = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.baseline !== null)
    .map(({ point, index }) => `${x(point, index)},${y(point.baseline ?? 0)}`)
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label="Energy balance chart"
      className={cn('w-full', className)}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          {tick > 0 && (
            <line
              x1="0"
              x2={WIDTH - PAD.right + 8}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-foreground/25"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}
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
        y1={y(0)}
        y2={y(0)}
        className="stroke-foreground/50"
      />

      {points.map((point, index) =>
        point.consumed === null ? null : (
          <rect
            key={point.date}
            x={x(point, index) - barWidth / 2}
            y={y(point.consumed)}
            width={barWidth}
            height={Math.max(1, y(0) - y(point.consumed))}
            rx="2"
            className="fill-mf-tile-calories motion-safe:animate-chart-rise"
          />
        )
      )}
      {baseline && (
        <polyline
          points={baseline}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.1 6"
          className={mode === 'targets' ? 'stroke-mf-tile-fat' : 'stroke-mf-tile-protein'}
        />
      )}

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
    </svg>
  )
}
