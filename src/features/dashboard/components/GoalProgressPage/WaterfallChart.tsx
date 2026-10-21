'use client'

import { useState } from 'react'
import { PlotClip } from '../../chart/ChartAxes'
import { PAD, PLOT_W, WIDTH, xOfAgo } from '../../chart/geometry'
import { useChartPan } from '../../chart/use-chart-pan'
import { useTween } from '../../chart/use-tween'
import { niceAxis, type WaterfallBar } from '../../goal-progress.utils'
import { cn } from '@/lib/utils'

/** Nhiều cột hơn thế này thì kéo ngang để xem các tuần trước thay vì ép tất cả vào một màn hình. */
const MAX_VISIBLE_BARS = 7

interface WaterfallChartProps {
  readonly bars: readonly WaterfallBar[]
  /** Chiều cao đích (thu gọn / phóng to): biểu đồ tự chạy mượt tới đó. */
  readonly height: number
  readonly className?: string
}

/** Màu từng loại cột: "away"/"toward" lấy từ biến CSS của trang để đổi dần giữa tab xanh lá và tab tím. */
const FILL: Record<WaterfallBar['kind'], string> = {
  start: 'var(--goal-away)',
  away: 'var(--goal-away)',
  toward: 'var(--goal-toward)',
  status: 'var(--goal-status)',
}

/**
 * Biểu đồ thác nước Goal Progress: cột "Day 0" (khoảng cách ban đầu), các cột tuần nổi (nhạt = đi xa, đậm = lại gần) và
 * cột "Status" xám (khoảng cách hiện tại, neo sát mép phải). Nhiều tuần thì KÉO NGANG để xem các tuần trước (quán tính, bám theo
 * cột, cột cuối không bị cắt); đổi tab hoặc số cột thì cột giãn / co mượt, trục y và chiều cao chạy mượt. Chạm một cột để xem chú
 * thích; vạch nối ngang giữa các cột.
 */
export function WaterfallChart({ bars, height: targetHeight, className }: WaterfallChartProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const count = bars.length
  const target = Math.max(1, Math.min(count, MAX_VISIBLE_BARS))
  const slots = useTween(target)
  const height = useTween(targetHeight)
  const pan = useChartPan({ maxPos: Math.max(0, count - target), slots })
  const pos = pan.view.pos

  const plotH = height - PAD.top - PAD.bottom
  // `ago` = số cột tính từ cột cuối (Status = 0); chỉ tính trục theo các cột nằm trong khung
  const agoOfIndex = (index: number) => count - 1 - index
  const inFrame = bars.filter((_, index) => {
    const ago = agoOfIndex(index)
    return ago >= pos - 0.5 && ago <= pos + slots - 0.5
  })
  const axis = niceAxis(Math.max(0, ...inFrame.map((bar) => bar.high)))
  const max = useTween(axis.max)
  const y = (value: number) => PAD.top + (1 - value / (max || 1)) * plotH
  const cx = (index: number) => xOfAgo(agoOfIndex(index), slots, pos)
  const barW = Math.min((PLOT_W / slots) * 0.7, 80)
  const active = bars.findIndex((bar) => bar.key === selected)
  const activeBar = active >= 0 ? bars[active] : null
  const activeX = active >= 0 ? cx(active) : 0
  const activeVisible = activeBar !== null && activeX >= PAD.left && activeX <= PAD.left + PLOT_W

  const toggle = (key: string) => {
    if (!pan.wasDragged()) setSelected(key === selected ? null : key)
  }
  const visible = (index: number) => {
    const ago = agoOfIndex(index)
    return ago >= Math.floor(pos) - 1 && ago <= Math.ceil(pos + slots) + 1
  }

  return (
    <div
      className={cn(
        'relative touch-pan-y select-none',
        pan.view.dragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      {...pan.bind}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="group"
        aria-label="Goal progress waterfall chart"
        className="w-full"
      >
        <PlotClip height={height} />
        {axis.ticks.map((tick) => (
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
              {tick}
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

        <g clipPath="url(#plot-clip)">
          {bars.slice(0, -1).map((bar, index) => {
            if (!visible(index)) return null
            const level = bar.kind === 'toward' ? bar.low : bar.high
            return (
              <line
                key={`link-${bar.key}`}
                x1={cx(index) + barW / 2}
                x2={cx(index + 1) - barW / 2}
                y1={y(level)}
                y2={y(level)}
                className="stroke-foreground/30"
                strokeWidth="1"
              />
            )
          })}

          {bars.map((bar, index) =>
            visible(index) ? (
              <g
                key={bar.key}
                role="button"
                tabIndex={0}
                aria-label={bar.tip}
                aria-pressed={bar.key === selected}
                onClick={() => toggle(bar.key)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelected(bar.key === selected ? null : bar.key)
                  }
                }}
                className="cursor-pointer focus-visible:outline-none"
              >
                <rect
                  x={cx(index) - barW / 2}
                  y={y(bar.high)}
                  width={barW}
                  height={Math.max(1, y(bar.low) - y(bar.high))}
                  style={{ fill: FILL[bar.kind] }}
                  className="transition-[fill] duration-500"
                />
              </g>
            ) : null
          )}
        </g>

        <g clipPath="url(#plot-clip-x)">
          {bars.map((bar, index) =>
            visible(index) ? (
              <text
                key={`label-${bar.key}`}
                x={cx(index)}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {bar.label}
              </text>
            ) : null
          )}
        </g>
      </svg>

      {activeBar && activeVisible && (
        <div
          role="status"
          style={{
            left: `${Math.min(80, Math.max(20, (activeX / WIDTH) * 100))}%`,
            top: `${(y(activeBar.high) / height) * 100}%`,
          }}
          className="bg-foreground text-background absolute z-10 mt-2 flex -translate-x-1/2 items-center gap-2 rounded-xl px-3 py-2 text-base whitespace-nowrap shadow-lg"
        >
          <span
            aria-hidden="true"
            style={
              activeBar.kind === 'status' ? undefined : { backgroundColor: FILL[activeBar.kind] }
            }
            className={cn(
              'size-4 rounded-full border-2',
              activeBar.kind === 'status' ? 'border-background' : 'border-transparent'
            )}
          />
          {activeBar.tip}
        </div>
      )}
    </div>
  )
}
