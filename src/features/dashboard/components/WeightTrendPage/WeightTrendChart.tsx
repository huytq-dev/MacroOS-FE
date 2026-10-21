'use client'

import { useRef, useState } from 'react'
import { shortDay } from '../../expenditure.utils'
import { slotOf, windowDays, yAxis, type ScaleDay, type TrendDay } from '../../weight-trend-series'
import { cn } from '@/lib/utils'

const WIDTH = 360
const PAD = { left: 4, right: 40, top: 14, bottom: 28 }
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** Từng này điểm trở xuống thì vẽ vòng tròn rỗng mỗi ngày trên đường xu hướng, nhiều hơn chỉ vẽ đường. */
const MARKER_MODE_MAX = 14

/** Scale Weight = tím đậm, Trend Weight = tím nhạt (cùng họ màu `--mf-purple`, pha đen / trắng). */
export const SCALE_COLOR = 'color-mix(in srgb, var(--mf-purple) 55%, black)'
export const TREND_COLOR = 'color-mix(in srgb, var(--mf-purple) 55%, white)'

interface WeightTrendChartProps {
  readonly trend: readonly TrendDay[]
  readonly scale: readonly ScaleDay[]
  readonly span: { readonly from: string; readonly to: string }
  /** false = trục từ 0 (0 / 50 / 100); true = vừa khít dữ liệu. */
  readonly fit: boolean
  readonly height?: number
  readonly className?: string
}

/** Đường cong mượt (Catmull-Rom → Bézier) đi qua mọi điểm. */
export function smoothPath(points: readonly { x: number; y: number }[], move = true) {
  let path = move ? `M ${points[0].x} ${points[0].y}` : ''
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index]
    const p1 = points[index]
    const p2 = points[index + 1]
    const p3 = points[index + 2] ?? p2
    path += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`
  }
  return path
}

const tickText = (value: number) => String(Number(value.toFixed(1)))

/**
 * Biểu đồ Weight Trend kiểu MacroFactor: Scale Weight là đường cong tím đậm nối các lần cân thật (không marker), Trend Weight là
 * đường tím nhạt có vòng tròn rỗng MỖI NGÀY. Kỳ nào cũng kết thúc hôm nay (1W: 7 ô, nhãn thứ từng ngày). Trục kg bên phải với vạch
 * đứt; chạm / rê vào một ngày để xem giá trị. Đường tự vẽ khi vào và vẽ lại khi đổi kỳ hay chế độ trục.
 */
export function WeightTrendChart({
  trend,
  scale,
  span,
  fit,
  height = 300,
  className,
}: WeightTrendChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const { ticks, min, max } = yAxis(
    [...trend.map((d) => d.trend), ...scale.map((d) => d.value)],
    fit
  )
  const days = windowDays(span)
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const slotW = plotW / days
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * plotH
  const x = (date: string) => PAD.left + slotW * (slotOf(span, date) + 0.5)
  const markers = trend.length <= MARKER_MODE_MAX

  const labelEvery = Math.max(1, Math.round(days / 5))
  const xLabels = Array.from({ length: days }, (_, slot) => slot)
    .filter((slot) => days <= 7 || slot % labelEvery === 0)
    .map((slot) => {
      const date = new Date(`${span.from}T00:00:00`)
      date.setDate(date.getDate() + slot)
      const text =
        days <= 7
          ? WEEKDAYS[date.getDay()]
          : `${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}`
      return { x: PAD.left + slotW * (slot + 0.5), text }
    })

  const scalePoints = scale.map((point) => ({ x: x(point.date), y: y(point.value) }))
  const trendLine = trend.map((point) => `${x(point.date)},${y(point.trend)}`).join(' ')

  const pick = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = wrapper.current?.getBoundingClientRect()
    if (!box) return
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    const slot = Math.floor((px - PAD.left) / slotW)
    const index = trend.findIndex((point) => slotOf(span, point.date) === slot)
    setActive(index >= 0 ? index : null)
  }
  const selected = active === null ? null : trend[active]
  const selectedScale = selected ? scale.find((point) => point.date === selected.date) : undefined

  return (
    <div
      ref={wrapper}
      className={cn('relative touch-pan-y select-none', className)}
      onPointerDown={pick}
      onPointerMove={(event) => event.pointerType === 'mouse' && pick(event)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && setActive(null)}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label="Weight trend chart"
        className="w-full"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1="0"
              x2={WIDTH - PAD.right + 8}
              y1={y(tick)}
              y2={y(tick)}
              className={tick === min ? 'stroke-foreground/50' : 'stroke-foreground/25'}
              strokeWidth="1"
              strokeDasharray={tick === min ? undefined : '3 3'}
            />
            <text
              x={WIDTH - 2}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[11px] tabular-nums"
            >
              {tickText(tick)}
            </text>
          </g>
        ))}

        {selected && (
          <line
            x1={x(selected.date)}
            x2={x(selected.date)}
            y1={PAD.top}
            y2={height - PAD.bottom}
            className="stroke-foreground/40"
            strokeDasharray="3 3"
          />
        )}

        <g key={`${fit}-${span.from}-${span.to}-${trend.length}`}>
          {scalePoints.length > 1 && (
            <path
              d={smoothPath(scalePoints)}
              fill="none"
              pathLength={1}
              stroke={SCALE_COLOR}
              strokeWidth="2.2"
              strokeLinecap="round"
              className="motion-safe:animate-chart-draw"
            />
          )}
          {scalePoints.length === 1 && (
            <circle
              cx={scalePoints[0].x}
              cy={scalePoints[0].y}
              r="2.5"
              fill={SCALE_COLOR}
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500"
            />
          )}
          {trend.length > 1 && (
            <polyline
              points={trendLine}
              fill="none"
              pathLength={1}
              stroke={TREND_COLOR}
              strokeWidth="2"
              strokeLinejoin="round"
              className="motion-safe:animate-chart-draw"
            />
          )}
          {markers &&
            trend.map((point, index) => (
              <circle
                key={point.date}
                cx={x(point.date)}
                cy={y(point.trend)}
                r={index === active ? 5 : 3.5}
                stroke={TREND_COLOR}
                strokeWidth="1.8"
                className="fill-background motion-safe:animate-in motion-safe:fade-in-0 transition-[r] duration-200 motion-safe:duration-500"
              />
            ))}
        </g>

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
        {trend.length === 0 && (
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

      {selected && (
        <div
          role="status"
          style={{
            left: `${Math.min(78, Math.max(22, (x(selected.date) / WIDTH) * 100))}%`,
          }}
          className="bg-popover border-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-200 pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border px-3 py-2 text-center whitespace-nowrap shadow-md"
        >
          <p className="text-muted-foreground text-xs">{shortDay(selected.date)}</p>
          <p className="text-sm font-medium tabular-nums">Trend {selected.trend.toFixed(1)} kg</p>
          {selectedScale && (
            <p className="text-sm tabular-nums">Scale {selectedScale.value.toFixed(1)} kg</p>
          )}
        </div>
      )}
    </div>
  )
}
