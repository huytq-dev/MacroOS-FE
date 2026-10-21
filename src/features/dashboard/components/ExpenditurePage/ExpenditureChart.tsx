'use client'

import { useRef, useState } from 'react'
import { smoothPath } from '../WeightTrendPage/WeightTrendChart'
import { expAxis, type ExpDay } from '../../expenditure-series'
import { shortDay } from '../../expenditure.utils'
import { slotOf, windowDays } from '../../weight-trend-series'
import { cn } from '@/lib/utils'

const WIDTH = 360
const PAD = { left: 4, right: 40, top: 14, bottom: 28 }
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** Từng này điểm trở xuống thì vẽ marker từng ngày (ô vuông = Holding, vòng tròn = Updating), nhiều hơn chỉ vẽ dải và đường. */
const MARKER_MODE_MAX = 14

interface ExpenditureChartProps {
  readonly days: readonly ExpDay[]
  readonly span: { readonly from: string; readonly to: string }
  /** false = trục từ 0; true = vừa khít dải Flux. */
  readonly fit: boolean
  readonly height?: number
  readonly className?: string
}

const kcal = (value: number) => Math.round(value).toLocaleString('en-US')

/**
 * Biểu đồ Expenditure kiểu MacroFactor: Flux Range là MỘT vùng cam mờ liền (mép trên / dưới cong mượt, hai đầu thẳng đứng), đường
 * Expenditure màu cam có marker mỗi ngày (ô vuông rỗng = Holding, vòng tròn rỗng = Updating). Kỳ nào cũng kết thúc hôm nay (1W: 7 ô,
 * nhãn thứ từng ngày); trục kcal bên phải với vạch đứt; chạm / rê vào một ngày để xem giá trị. Vùng và đường tự vẽ khi vào và khi đổi
 * kỳ hay chế độ trục.
 */
export function ExpenditureChart({
  days,
  span,
  fit,
  height = 300,
  className,
}: ExpenditureChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const { ticks, min, max } = expAxis(days, fit)
  const count = windowDays(span)
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const slotW = plotW / count
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * plotH
  const x = (date: string) => PAD.left + slotW * (slotOf(span, date) + 0.5)
  const markers = days.length <= MARKER_MODE_MAX

  const labelEvery = Math.max(1, Math.round(count / 5))
  const xLabels = Array.from({ length: count }, (_, slot) => slot)
    .filter((slot) => count <= 7 || slot % labelEvery === 0)
    .map((slot) => {
      const date = new Date(`${span.from}T00:00:00`)
      date.setDate(date.getDate() + slot)
      const text =
        count <= 7
          ? WEEKDAYS[date.getDay()]
          : `${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}`
      return { x: PAD.left + slotW * (slot + 0.5), text }
    })

  const top = days.map((day) => ({ x: x(day.date), y: y(day.high) }))
  const bottom = days.map((day) => ({ x: x(day.date), y: y(day.low) })).reverse()
  const band =
    days.length > 1
      ? `${smoothPath(top)} L ${bottom[0].x} ${bottom[0].y} ${smoothPath(bottom, false)} Z`
      : ''
  const line = days.map((day) => `${x(day.date)},${y(day.kcal)}`).join(' ')

  const pick = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = wrapper.current?.getBoundingClientRect()
    if (!box) return
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    const slot = Math.floor((px - PAD.left) / slotW)
    const index = days.findIndex((day) => slotOf(span, day.date) === slot)
    setActive(index >= 0 ? index : null)
  }
  const selected = active === null ? null : days[active]

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
        aria-label="Expenditure chart"
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
              {Math.round(tick)}
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

        <g key={`${fit}-${span.from}-${span.to}-${days.length}`}>
          {band && (
            <path
              d={band}
              className="fill-mf-tile-protein/30 motion-safe:animate-chart-grow origin-left"
            />
          )}
          {days.length > 1 && (
            <polyline
              points={line}
              fill="none"
              pathLength={1}
              strokeWidth="2"
              strokeLinejoin="round"
              className="stroke-mf-tile-protein motion-safe:animate-chart-draw"
            />
          )}
          {days.length === 1 && (
            <rect
              x={x(days[0].date) - slotW * 0.35}
              y={y(days[0].high)}
              width={slotW * 0.7}
              height={Math.max(2, y(days[0].low) - y(days[0].high))}
              className="fill-mf-tile-protein/30"
            />
          )}
          {markers &&
            days.map((day, index) => {
              const size = index === active ? 7 : 5.5
              const props = {
                strokeWidth: 1.8,
                className:
                  'fill-background stroke-mf-tile-protein transition-[r,width,height] duration-200 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500',
              }
              return day.holding ? (
                <rect
                  key={day.date}
                  x={x(day.date) - size}
                  y={y(day.kcal) - size}
                  width={size * 2}
                  height={size * 2}
                  {...props}
                />
              ) : (
                <circle key={day.date} cx={x(day.date)} cy={y(day.kcal)} r={size} {...props} />
              )
            })}
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

      {selected && (
        <div
          role="status"
          style={{
            left: `${Math.min(78, Math.max(22, (x(selected.date) / WIDTH) * 100))}%`,
          }}
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
