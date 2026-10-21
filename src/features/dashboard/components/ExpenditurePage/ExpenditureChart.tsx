'use client'

import { useState } from 'react'
import { smoothPath } from '../WeightTrendPage/WeightTrendChart'
import { ChartAxes, PlotClip } from '../../chart/ChartAxes'
import { PAD, PLOT_W, WIDTH, agoOf, visibleAgo, xOfAgo } from '../../chart/geometry'
import type { useChartPan } from '../../chart/use-chart-pan'
import { useTween } from '../../chart/use-tween'
import { expAxis, type ExpDay } from '../../expenditure-series'
import { shortDay } from '../../expenditure.utils'
import { cn } from '@/lib/utils'

/** Từng này ô trở xuống thì vẽ marker từng ngày (ô vuông = Holding / Calibrating, vòng tròn = Updating), nhiều hơn chỉ vẽ dải và đường. */
const MARKER_MODE_MAX = 14.5

interface ExpenditureChartProps {
  /** TOÀN BỘ chuỗi từng ngày (cũ → mới), biểu đồ tự lấy phần đang hiện. */
  readonly days: readonly ExpDay[]
  readonly today: string
  /** Số ô ngày trải trên vùng vẽ (số thực: chạy mượt khi đổi kỳ). */
  readonly slots: number
  /** Số ngày đã kéo lùi về quá khứ (số thực khi đang kéo). */
  readonly pos: number
  readonly pan: ReturnType<typeof useChartPan>
  readonly height?: number
  readonly className?: string
}

const kcal = (value: number) => Math.round(value).toLocaleString('en-US')

/**
 * Biểu đồ Expenditure kiểu MacroFactor: Flux Range là MỘT vùng cam mờ liền (mép trên / dưới cong mượt, hai đầu thẳng đứng), đường
 * Expenditure màu cam có marker mỗi ngày (ô vuông rỗng = Holding / Calibrating, vòng tròn rỗng = Updating). Kéo ngang để xem các ngày
 * trước (quán tính, bám theo ngày); đổi kỳ thì trục x giãn / co mượt, trục y luôn vừa khít dải Flux trong khung (chạy mượt khi kéo / đổi kỳ); chạm một ngày để xem
 * kcal, Flux low–high và trạng thái.
 */
export function ExpenditureChart({
  days,
  today,
  slots,
  pos,
  pan,
  height = 300,
  className,
}: ExpenditureChartProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const plotH = height - PAD.top - PAD.bottom
  const { min: lo, max: hi } = visibleAgo(slots, pos)

  const shown = days.filter((day) => {
    const ago = agoOf(today, day.date)
    return ago >= lo && ago <= hi
  })
  const inFrame = days.filter((day) => {
    const ago = agoOf(today, day.date)
    return ago >= pos - 0.5 && ago <= pos + slots - 0.5
  })
  const axis = expAxis(inFrame)
  const min = useTween(axis.min)
  const max = useTween(axis.max)
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min || 1)) * plotH
  const x = (date: string) => xOfAgo(agoOf(today, date), slots, pos)
  const markers = slots <= MARKER_MODE_MAX

  const top = shown.map((day) => ({ x: x(day.date), y: y(day.high) }))
  const bottom = shown.map((day) => ({ x: x(day.date), y: y(day.low) })).reverse()
  const band =
    shown.length > 1
      ? `${smoothPath(top)} L ${bottom[0].x} ${bottom[0].y} ${smoothPath(bottom, false)} Z`
      : ''
  const line = shown.map((day) => `${x(day.date)},${y(day.kcal)}`).join(' ')

  const pick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pan.wasDragged()) return
    const box = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    const ago = Math.round(pos + (PAD.left + PLOT_W - px) / (PLOT_W / slots) - 0.5)
    setPicked(days.some((day) => agoOf(today, day.date) === ago) ? ago : null)
  }
  const selected = picked === null ? null : days.find((day) => agoOf(today, day.date) === picked)
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
        aria-label="Expenditure chart"
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
          integerTicks
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
          {band && <path d={band} className="fill-mf-flux-band/50" />}
          {shown.length > 1 && (
            <polyline
              points={line}
              fill="none"
              strokeWidth="1.5"
              strokeLinejoin="round"
              pathLength={1}
              className="stroke-mf-tile-protein motion-safe:animate-chart-draw"
            />
          )}
          {markers &&
            shown.map((day) => {
              const size = picked !== null && agoOf(today, day.date) === picked ? 5 : 3.5
              const common = {
                strokeWidth: 1.5,
                className: 'fill-background stroke-mf-tile-protein',
              }
              return day.holding ? (
                <rect
                  key={day.date}
                  x={x(day.date) - size}
                  y={y(day.kcal) - size}
                  width={size * 2}
                  height={size * 2}
                  {...common}
                />
              ) : (
                <circle key={day.date} cx={x(day.date)} cy={y(day.kcal)} r={size} {...common} />
              )
            })}
        </g>

        {days.length === 0 && (
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
          <p className="text-muted-foreground text-xs">{shortDay(selected.date)}</p>
          <p className="text-sm font-medium tabular-nums">
            {kcal(selected.kcal)} kcal{selected.holding ? ` · ${selected.status}` : ''}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            Flux {kcal(selected.low)} – {kcal(selected.high)}
          </p>
        </div>
      )}
    </div>
  )
}
