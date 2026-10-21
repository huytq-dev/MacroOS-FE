'use client'

import { useState } from 'react'
import { ChartAxes, PlotClip } from '../../chart/ChartAxes'
import { PAD, PLOT_W, WIDTH, agoOf, visibleAgo, xOfAgo } from '../../chart/geometry'
import type { useChartPan } from '../../chart/use-chart-pan'
import { useTween } from '../../chart/use-tween'
import type { BalanceMode } from '../../dashboard.utils'
import { balanceScale, type BalancePoint } from '../../energy-balance.utils'
import { shortDay } from '../../expenditure.utils'
import { cn } from '@/lib/utils'

interface EnergyBalanceChartProps {
  /** TOÀN BỘ chuỗi từng ngày (cũ → mới), biểu đồ tự lấy phần đang hiện. */
  readonly points: readonly BalancePoint[]
  readonly today: string
  readonly mode: BalanceMode
  /** Số ô ngày trải trên vùng vẽ (số thực: chạy mượt khi đổi kỳ). */
  readonly slots: number
  /** Số ngày đã kéo lùi về quá khứ (số thực khi đang kéo). */
  readonly pos: number
  /** Chiều cao biểu đồ (số thực: chạy mượt khi bấm nút mở rộng). */
  readonly height: number
  readonly pan: ReturnType<typeof useChartPan>
  readonly className?: string
}

const kcal = (value: number) => Math.round(value).toLocaleString('en-US')

/**
 * Biểu đồ Energy Balance kiểu MacroFactor: cột xanh là kcal đã ăn mỗi ngày (chỉ ngày có log), đường chấm là mốc so sánh (cam =
 * Expenditure, vàng = Targets), trục kcal từ 0 bên phải. Kéo ngang để xem các ngày trước (quán tính, bám theo ngày, hiện ĐỦ cột
 * cuối); đổi kỳ thì cột và đường giãn / co mượt theo trục x, trục y chạy mượt theo dữ liệu đang hiện. Chạm một ngày để xem số liệu.
 */
export function EnergyBalanceChart({
  points,
  today,
  mode,
  slots,
  pos,
  height,
  pan,
  className,
}: EnergyBalanceChartProps) {
  const [picked, setPicked] = useState<number | null>(null)
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
  const axis = balanceScale(inFrame)
  const max = useTween(axis.max)
  const y = (value: number) => PAD.top + (1 - value / (max || 1)) * plotH
  const x = (date: string) => xOfAgo(agoOf(today, date), slots, pos)
  const barWidth = Math.min(22, (PLOT_W / slots) * 0.6)

  const baseline = shown
    .filter((point) => point.baseline !== null)
    .map((point) => `${x(point.date)},${y(point.baseline ?? 0)}`)
    .join(' ')

  const pick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pan.wasDragged()) return
    const box = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    const ago = Math.round(pos + (PAD.left + PLOT_W - px) / (PLOT_W / slots) - 0.5)
    setPicked(points.some((point) => agoOf(today, point.date) === ago) ? ago : null)
  }
  const selected =
    picked === null ? null : points.find((point) => agoOf(today, point.date) === picked)
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
        aria-label="Energy balance chart"
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
          {shown.map((point) =>
            point.consumed === null ? null : (
              <rect
                key={point.date}
                x={x(point.date) - barWidth / 2}
                y={y(point.consumed)}
                width={barWidth}
                height={Math.max(1, y(0) - y(point.consumed))}
                rx="2"
                className={cn(
                  'fill-mf-tile-calories',
                  point.incomplete && 'opacity-40',
                  picked !== null && agoOf(today, point.date) === picked && 'opacity-80'
                )}
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
        </g>
      </svg>

      {selected && selectedVisible && (
        <div
          role="status"
          style={{ left: `${Math.min(78, Math.max(22, (selectedX / WIDTH) * 100))}%` }}
          className="bg-popover border-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-200 pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border px-3 py-2 text-center whitespace-nowrap shadow-md"
        >
          <p className="text-muted-foreground text-xs">{shortDay(selected.date)}</p>
          <p className="text-sm font-medium tabular-nums">
            {selected.consumed === null ? 'Not logged' : `${kcal(selected.consumed)} kcal`}
            {selected.incomplete ? ' · Incomplete' : ''}
          </p>
          {selected.baseline !== null && (
            <p className="text-muted-foreground text-xs tabular-nums">
              {mode === 'targets' ? 'Target' : 'Expenditure'} {kcal(selected.baseline)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
