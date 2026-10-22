'use client'

import { useState } from 'react'
import { formatSteps, type StepsDay } from '../steps.utils'
import { ChartAxes, PlotClip } from '@/features/dashboard/chart/ChartAxes'
import { PAD, PLOT_W, WIDTH, agoOf, visibleAgo, xOfAgo } from '@/features/dashboard/chart/geometry'
import type { useChartPan } from '@/features/dashboard/chart/use-chart-pan'
import { useTween } from '@/features/dashboard/chart/use-tween'
import { bucketLabel } from '@/features/dashboard/expenditure.utils'
import { niceAxis } from '@/features/dashboard/goal-progress.utils'
import { cn } from '@/lib/utils'

/** Khung chưa có số nào: trục nhỏ 0 / 2 / 4 (thu gọn) hoặc 0–5 (phóng to) và không có chữ, như MacroFactor. */
const EMPTY_AXIS = {
  compact: { ticks: [0, 2, 4], max: 4 },
  expanded: { ticks: [0, 1, 2, 3, 4, 5], max: 5 },
} as const

interface StepsChartProps {
  /** TOÀN BỘ ngày đã ghi (cũ → mới, đã gộp D/W/M), biểu đồ tự lấy phần đang hiện. */
  readonly days: readonly StepsDay[]
  readonly today: string
  /** Số ô ngày trải trên vùng vẽ (số thực: chạy mượt khi đổi kỳ). */
  readonly slots: number
  /** Số ngày đã kéo lùi về quá khứ (số thực khi đang kéo). */
  readonly pos: number
  /** Chiều cao biểu đồ (số thực: chạy mượt khi bấm nút phóng to). */
  readonly height: number
  readonly pan: ReturnType<typeof useChartPan>
  /** Đang phóng to: chỉ ảnh hưởng trục mẫu của khung trống. */
  readonly expanded?: boolean
  readonly className?: string
}

/**
 * Biểu đồ bước chân: mỗi ngày một cột cam, trục từ 0 bên phải. Kéo ngang để xem các ngày trước (quán tính, bám theo ngày, hiện ĐỦ cột
 * cuối); đổi kỳ thì cột giãn / co mượt, trục y và chiều cao chạy mượt. Chạm một cột để xem số bước của ngày đó.
 */
export function StepsChart({
  days,
  today,
  slots,
  pos,
  height,
  pan,
  expanded = false,
  className,
}: StepsChartProps) {
  const [picked, setPicked] = useState<string | null>(null)
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
  const top = Math.max(0, ...inFrame.map((day) => day.steps))
  const axis = top > 0 ? niceAxis(top) : EMPTY_AXIS[expanded ? 'expanded' : 'compact']
  const max = useTween(axis.max)
  const y = (value: number) => PAD.top + (1 - value / (max || 1)) * plotH
  const x = (date: string) => xOfAgo(agoOf(today, date), slots, pos)
  const barWidth = Math.min(22, (PLOT_W / slots) * 0.6)

  const pick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pan.wasDragged()) return
    const box = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    const ago = Math.round(pos + (PAD.left + PLOT_W - px) / (PLOT_W / slots) - 0.5)
    setPicked(days.find((day) => agoOf(today, day.date) === ago)?.date ?? null)
  }
  const selected = picked === null ? null : days.find((day) => day.date === picked)
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
        aria-label="Steps chart"
        className="w-full"
      >
        <PlotClip height={height} />
        <ChartAxes
          ticks={axis.ticks}
          min={0}
          y={y}
          height={height}
          today={today}
          slots={slots}
          pos={pos}
          integerTicks
        />

        <g clipPath="url(#plot-clip)">
          {shown.map((day) => (
            <rect
              key={day.date}
              x={x(day.date) - barWidth / 2}
              y={y(day.steps)}
              width={barWidth}
              height={Math.max(1, y(0) - y(day.steps))}
              rx="2"
              className={cn('fill-mf-tile-protein', day.date === picked && 'opacity-80')}
            />
          ))}
        </g>
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
          <p className="text-sm font-medium tabular-nums">{formatSteps(selected.steps)} steps</p>
        </div>
      )}
    </div>
  )
}
