'use client'

import { useState } from 'react'
import {
  MACRO_PARTS,
  MACRO_PART_STYLE,
  drawnKcal,
  stackTotal,
  type MacroBar,
} from '../../macros-detail'
import { ChartAxes, PlotClip } from '../../chart/ChartAxes'
import { PAD, PLOT_W, WIDTH, agoOf, visibleAgo, xOfAgo } from '../../chart/geometry'
import type { useChartPan } from '../../chart/use-chart-pan'
import { useTween } from '../../chart/use-tween'
import { bucketLabel } from '../../expenditure.utils'
import { niceAxis } from '../../goal-progress.utils'
import type { Measure, EnergyUnit } from '@/lib/units'
import { cn } from '@/lib/utils'

/** Khung chưa có ngày nào đã ghi: trục 0 – 4000 như MacroFactor, không cột. */
const EMPTY_AXIS = { ticks: [0, 1000, 2000, 3000, 4000], max: 4000 } as const

interface MacrosChartProps {
  /** TOÀN BỘ ngày đã ghi (cũ → mới, kcal của BE, đã gộp D/W/M); biểu đồ tự lấy phần đang hiện. */
  readonly days: readonly MacroBar[]
  readonly today: string
  readonly energy: Measure<EnergyUnit>
  /** Số ô ngày trải trên vùng vẽ (số thực: chạy mượt khi đổi kỳ). */
  readonly slots: number
  /** Số ngày đã kéo lùi về quá khứ (số thực khi đang kéo). */
  readonly pos: number
  /** Chiều cao biểu đồ (số thực: chạy mượt khi bấm nút phóng to). */
  readonly height: number
  readonly pan: ReturnType<typeof useChartPan>
  readonly className?: string
}

/**
 * Biểu đồ Macros kiểu MacroFactor: mỗi ngày ĐÃ GHI một cột chồng năng lượng (Carbs xanh lá dưới cùng, Fat vàng, Protein cam, Other xanh dương trên cùng),
 * ngày chưa ghi không có cột; trục y là năng lượng (đơn vị user chọn) từ 0 bên phải. Thang chỉ theo dữ liệu trong khung nên phóng to / thu nhỏ (chỉ đổi
 * chiều cao) không đổi thang. Kéo ngang xem các ngày trước, chạm một cột xem tổng.
 */
export function MacrosChart({
  days,
  today,
  energy,
  slots,
  pos,
  height,
  pan,
  className,
}: MacrosChartProps) {
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
  const top = Math.max(0, ...inFrame.map((day) => energy.convert(stackTotal(day))))
  const axis = top > 0 ? niceAxis(top) : EMPTY_AXIS
  const max = useTween(axis.max)
  const y = (value: number) => PAD.top + (1 - value / (max || 1)) * plotH
  const x = (date: string) => xOfAgo(agoOf(today, date), slots, pos)
  const barWidth = Math.min(34, (PLOT_W / slots) * 0.68)

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
        aria-label="Macros chart"
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
          {shown.map((day) => {
            let filled = 0
            return MACRO_PARTS.map((part) => {
              const value = energy.convert(drawnKcal(day, part))
              if (value <= 0) return null
              const base = filled
              filled += value
              return (
                <rect
                  key={`${day.date}-${part}`}
                  x={x(day.date) - barWidth / 2}
                  y={y(filled)}
                  width={barWidth}
                  height={Math.max(0.5, y(base) - y(filled))}
                  className={cn(MACRO_PART_STYLE[part].fill, day.date === picked && 'opacity-80')}
                />
              )
            })
          })}
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
          <p className="text-sm font-medium tabular-nums">{energy.text(selected.total)}</p>
        </div>
      )}
    </div>
  )
}
