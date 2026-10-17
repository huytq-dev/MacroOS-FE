'use client'

import { useState } from 'react'
import { niceAxis, type WaterfallBar } from '../../goal-progress.utils'
import { cn } from '@/lib/utils'

const WIDTH = 360
const PAD = { left: 4, right: 52, top: 14, bottom: 28 }
const MAX_LABELS = 8

interface WaterfallChartProps {
  readonly bars: readonly WaterfallBar[]
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
 * cột "Status" xám (khoảng cách hiện tại). Chạm một cột để xem chú thích; vạch nối ngang giữa các cột.
 */
export function WaterfallChart({ bars, height, className }: WaterfallChartProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const top = Math.max(...bars.map((bar) => bar.high))
  const { ticks, max } = niceAxis(top)
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const y = (value: number) => PAD.top + (1 - value / max) * plotH
  const slotW = plotW / bars.length
  const barW = Math.min(slotW * 0.7, 80)
  const cx = (index: number) => PAD.left + slotW * (index + 0.5)
  const labelEvery = Math.ceil(bars.length / MAX_LABELS)
  const active = bars.findIndex((bar) => bar.key === selected)
  const activeBar = active >= 0 ? bars[active] : null

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="group"
        aria-label="Goal progress waterfall chart"
        className="w-full"
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

        {bars.slice(0, -1).map((bar, index) => {
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

        {bars.map((bar, index) => (
          <g
            key={bar.key}
            role="button"
            tabIndex={0}
            aria-label={bar.tip}
            aria-pressed={bar.key === selected}
            onClick={() => setSelected(bar.key === selected ? null : bar.key)}
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
        ))}

        {bars.map((bar, index) =>
          index % labelEvery === 0 || index === bars.length - 1 ? (
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
      </svg>

      {activeBar && (
        <div
          role="status"
          style={{
            left: `${Math.min(80, Math.max(20, (cx(active) / WIDTH) * 100))}%`,
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
