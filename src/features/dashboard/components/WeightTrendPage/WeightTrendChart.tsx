'use client'

import { useState } from 'react'
import { ChartAxes, PlotClip } from '../../chart/ChartAxes'
import { PAD, PLOT_W, WIDTH, agoOf, showMarkers, visibleAgo, xOfAgo } from '../../chart/geometry'
import type { useChartPan } from '../../chart/use-chart-pan'
import { useTween } from '../../chart/use-tween'
import { bucketLabel } from '../../expenditure.utils'
import { yAxis } from '../../weight-trend-series'
import type { ScaleDay, TrendDay } from '../../weight-trend-series'
import { cn } from '@/lib/utils'

/** Scale Weight = tím đậm, Trend Weight = tím nhạt (cùng họ màu `--mf-purple`, pha đen / trắng). */
export const SCALE_COLOR = 'color-mix(in srgb, var(--mf-purple) 55%, black)'
export const TREND_COLOR = 'color-mix(in srgb, var(--mf-purple) 55%, white)'

interface WeightTrendChartProps {
  /** TOÀN BỘ xu hướng từng ngày (cũ → mới), biểu đồ tự lấy phần đang hiện. */
  readonly trend: readonly TrendDay[]
  readonly scale: readonly ScaleDay[]
  /** Đơn vị của các giá trị trend / scale (kg hoặc lb): chuỗi đã đổi sẵn sang đơn vị này. */
  readonly unit: string
  readonly today: string
  /** Số ô ngày đang trải trên vùng vẽ (số thực: chạy mượt từ kỳ cũ sang kỳ mới khi đổi bộ lọc). */
  readonly slots: number
  /** Số ngày đã kéo lùi về quá khứ (số thực khi đang kéo). */
  readonly pos: number
  readonly pan: ReturnType<typeof useChartPan>
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

/**
 * Biểu đồ Weight Trend kiểu MacroFactor: Scale Weight là đường cong tím đậm nối các lần cân thật (không marker), Trend Weight là
 * đường tím nhạt có vòng tròn rỗng MỖI NGÀY. Kéo ngang để xem các ngày trước (quán tính, bám theo ngày); đổi kỳ thì trục x giãn / co
 * mượt, đổi chế độ trục thì trục y chạy mượt. Chạm một ngày để xem giá trị Trend và Scale.
 */
export function WeightTrendChart({
  trend,
  scale,
  unit,
  today,
  slots,
  pos,
  pan,
  height = 300,
  className,
}: WeightTrendChartProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const plotH = height - PAD.top - PAD.bottom
  const { min: lo, max: hi } = visibleAgo(slots, pos)

  const trendShown = trend.filter((day) => {
    const ago = agoOf(today, day.date)
    return ago >= lo && ago <= hi
  })
  const scaleShown = scale.filter((day) => {
    const ago = agoOf(today, day.date)
    return ago >= lo && ago <= hi
  })
  // Trục lấy theo phần NẰM TRONG khung (không tính ngày chỉ thò ra mép)
  const inFrame = (date: string) => {
    const ago = agoOf(today, date)
    return ago >= pos - 0.5 && ago <= pos + slots - 0.5
  }
  const axis = yAxis([
    ...trend.filter((day) => inFrame(day.date)).map((day) => day.trend),
    ...scale.filter((day) => inFrame(day.date)).map((day) => day.value),
  ])
  const min = useTween(axis.min)
  const max = useTween(axis.max)
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min || 1)) * plotH
  const x = (date: string) => xOfAgo(agoOf(today, date), slots, pos)

  const scalePoints = scaleShown.map((point) => ({ x: x(point.date), y: y(point.value) }))
  const trendLine = trendShown.map((point) => `${x(point.date)},${y(point.trend)}`).join(' ')
  // Vòng tròn rỗng mỗi ngày trên đường xu hướng ở kỳ ngắn, hoặc khi chỉ có MỘT điểm (không có đường để vẽ)
  const markers = showMarkers(slots, trendShown.length)

  const pick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pan.wasDragged()) return
    const box = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    const ago = Math.round(pos + (PAD.left + PLOT_W - px) / (PLOT_W / slots) - 0.5)
    setPicked(trend.some((day) => agoOf(today, day.date) === ago) ? ago : null)
  }
  const selected = picked === null ? null : trend.find((day) => agoOf(today, day.date) === picked)
  const selectedScale = selected ? scale.find((point) => point.date === selected.date) : undefined
  const selectedX = selected ? x(selected.date) : 0
  const selectedVisible =
    selected !== undefined && selectedX >= PAD.left && selectedX <= PAD.left + PLOT_W

  return (
    <div
      className={cn(
        'relative touch-pan-y select-none',
        pan.view.dragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      onClick={pick}
      {...pan.bind}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label="Weight trend chart"
        className="w-full"
      >
        <PlotClip height={height} />
        <ChartAxes
          ticks={axis.ticks}
          min={axis.min}
          y={y}
          height={height}
          today={today}
          slots={slots}
          pos={pos}
        />

        <g clipPath="url(#plot-clip)">
          {selected && selectedVisible && (
            <line
              x1={selectedX}
              x2={selectedX}
              y1={PAD.top}
              y2={height - PAD.bottom}
              className="stroke-foreground/40"
              strokeDasharray="3 3"
            />
          )}
          {scalePoints.length > 1 && (
            <path
              d={smoothPath(scalePoints)}
              fill="none"
              stroke={SCALE_COLOR}
              strokeWidth="2.2"
              strokeLinecap="round"
              pathLength={1}
              className="motion-safe:animate-chart-draw"
            />
          )}
          {scalePoints.length === 1 && (
            <circle cx={scalePoints[0].x} cy={scalePoints[0].y} r="2.5" fill={SCALE_COLOR} />
          )}
          {trendShown.length > 1 && (
            <polyline
              points={trendLine}
              fill="none"
              stroke={TREND_COLOR}
              strokeWidth="2"
              strokeLinejoin="round"
              pathLength={1}
              className="motion-safe:animate-chart-draw"
            />
          )}
          {markers &&
            trendShown.map((point) => (
              <circle
                key={point.date}
                cx={x(point.date)}
                cy={y(point.trend)}
                r={picked !== null && agoOf(today, point.date) === picked ? 5 : 3.5}
                stroke={TREND_COLOR}
                strokeWidth="1.8"
                className="fill-background transition-[r] duration-200"
              />
            ))}
        </g>

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

      {selected && selectedVisible && (
        <div
          role="status"
          style={{ left: `${Math.min(78, Math.max(22, (selectedX / WIDTH) * 100))}%` }}
          className="bg-popover border-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-200 pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border px-3 py-2 text-center whitespace-nowrap shadow-md"
        >
          <p className="text-muted-foreground text-xs">
            {bucketLabel(selected.date, selected.end ?? selected.date, selected.days ?? 1)}
          </p>
          <p className="text-sm font-medium tabular-nums">
            Trend {selected.trend.toFixed(1)} {unit}
          </p>
          {selectedScale && (
            <p className="text-sm tabular-nums">
              Scale {selectedScale.value.toFixed(1)} {unit}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
