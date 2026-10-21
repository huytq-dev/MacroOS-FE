'use client'

import { useState } from 'react'
import { entryDayLabel, metricScale, type MetricPoint } from '../../body-metric.utils'
import { ChartAxes, PlotClip } from '@/features/dashboard/chart/ChartAxes'
import { PAD, PLOT_W, WIDTH, agoOf, visibleAgo, xOfAgo } from '@/features/dashboard/chart/geometry'
import type { useChartPan } from '@/features/dashboard/chart/use-chart-pan'
import { useTween } from '@/features/dashboard/chart/use-tween'
import { cn } from '@/lib/utils'

/** Từng này ô trở xuống thì vẽ vòng tròn rỗng mỗi điểm đo, nhiều hơn chỉ vẽ đường. */
const MARKER_SLOTS_MAX = 45

interface MetricChartProps {
  /** TOÀN BỘ điểm đã ghi (cũ → mới, đã gộp D/W/M), biểu đồ tự lấy phần đang hiện. */
  readonly points: readonly MetricPoint[]
  readonly today: string
  /** Số ô ngày trải trên vùng vẽ (số thực: chạy mượt khi đổi kỳ). */
  readonly slots: number
  /** Số ngày đã kéo lùi về quá khứ (số thực khi đang kéo). */
  readonly pos: number
  readonly unit: string
  readonly label: string
  /** Chiều cao biểu đồ (số thực: chạy mượt khi bấm nút phóng to). */
  readonly height: number
  /** Số khoảng chia trục y mong muốn (thu gọn 3, phóng to 4). */
  readonly tickCount: number
  /** Trục y vừa dữ liệu thay vì từ 0. */
  readonly fit: boolean
  readonly pan: ReturnType<typeof useChartPan>
  readonly className?: string
}

/**
 * Biểu đồ số đo kiểu MacroFactor: vạch ngang đứt, nhãn bên phải, đường xanh có vòng rỗng. Kéo ngang để xem các ngày trước (quán
 * tính, bám theo ngày); đổi kỳ thì trục x giãn / co mượt, đổi chế độ trục hoặc phóng to thì trục y và chiều cao chạy mượt. Chạm
 * một điểm để xem giá trị và ngày.
 */
export function MetricChart({
  points,
  today,
  slots,
  pos,
  unit,
  label,
  height,
  tickCount,
  fit,
  pan,
  className,
}: MetricChartProps) {
  const [picked, setPicked] = useState<string | null>(null)
  const plotH = height - PAD.top - PAD.bottom
  const { min: lo, max: hi } = visibleAgo(slots, pos)

  const shown = points.filter((point) => {
    const ago = agoOf(today, point.date)
    return ago >= lo && ago <= hi
  })
  const inFrame = points.filter((point) => {
    const ago = agoOf(today, point.date)
    return ago >= pos - 0.5 && ago <= pos + slots - 0.5
  })
  const axis = metricScale(
    inFrame.map((point) => point.value),
    tickCount,
    fit
  )
  const min = useTween(axis.min)
  const max = useTween(axis.max)
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min || 1)) * plotH
  const x = (date: string) => xOfAgo(agoOf(today, date), slots, pos)
  const line = shown.map((point) => `${x(point.date)},${y(point.value)}`).join(' ')

  const pick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pan.wasDragged() || inFrame.length === 0) return
    const box = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    let nearest = inFrame[0]
    for (const point of inFrame)
      if (Math.abs(x(point.date) - px) < Math.abs(x(nearest.date) - px)) nearest = point
    setPicked(nearest.date)
  }
  const selected = picked === null ? null : points.find((point) => point.date === picked)
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
        aria-label={`${label} chart`}
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
          {shown.length > 1 && (
            <polyline
              points={line}
              fill="none"
              pathLength={1}
              className="stroke-mf-green motion-safe:animate-chart-draw"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}
          {slots <= MARKER_SLOTS_MAX &&
            shown.map((point) => (
              <circle
                key={point.date}
                cx={x(point.date)}
                cy={y(point.value)}
                r={point.date === picked ? 5 : 3.5}
                className="fill-card stroke-mf-green transition-[r] duration-200"
                strokeWidth="1.5"
              />
            ))}
        </g>

        {points.length === 0 && (
          <text
            x={(WIDTH - PAD.right) / 2}
            y={height / 2}
            textAnchor="middle"
            className="fill-muted-foreground text-sm"
          >
            No entries yet
          </text>
        )}
      </svg>

      {selected && selectedVisible && (
        <div
          role="status"
          style={{ left: `${Math.min(78, Math.max(22, (selectedX / WIDTH) * 100))}%` }}
          className="bg-popover border-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-200 pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border px-3 py-2 text-center whitespace-nowrap shadow-md"
        >
          <p className="text-muted-foreground text-xs">{entryDayLabel(selected.date)}</p>
          <p className="text-sm font-medium tabular-nums">
            {selected.value.toFixed(1)} {unit}
          </p>
        </div>
      )}
    </div>
  )
}
