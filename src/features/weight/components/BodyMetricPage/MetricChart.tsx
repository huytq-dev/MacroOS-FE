'use client'

import { useState } from 'react'
import {
  daysBetween,
  entryDayLabel,
  xAxisLabels,
  metricScale,
  type MetricPoint,
} from '../../body-metric.utils'

const WIDTH = 360
const PAD = { left: 4, right: 36, top: 30, bottom: 28 }
/** Nhiều điểm hơn thì chỉ vẽ đường, không vẽ vòng tròn từng điểm. */
const MARKER_MAX = 40

interface MetricChartProps {
  readonly points: readonly MetricPoint[]
  readonly from: string
  readonly to: string
  readonly unit: string
  readonly label: string
  readonly height: number
  /** Số khoảng chia trục y mong muốn (thu gọn 3, phóng to 6). */
  readonly tickCount: number
  /** Trục y vừa dữ liệu thay vì từ 0. */
  readonly fit: boolean
}

/**
 * Biểu đồ số đo kiểu MacroFactor: vạch ngang đứt, nhãn bên phải, trục y từ 0, đường xanh có vòng rỗng, tự vẽ khi xuất hiện;
 * chạm/kéo ngang để xem giá trị của điểm gần nhất. Trang đặt `key` theo kỳ + gộp để vẽ lại và bỏ điểm đang chọn.
 */
export function MetricChart({
  points,
  from,
  to,
  unit,
  label,
  height,
  tickCount,
  fit,
}: MetricChartProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const { ticks, min, max } = metricScale(
    points.map((point) => point.value),
    tickCount,
    fit
  )
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const slots = daysBetween(from, to) + 1
  const slotW = plotW / slots
  const xOf = (date: string) => PAD.left + slotW * (daysBetween(from, date) + 0.5)
  const yOf = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * plotH
  const line = points.map((point) => `${xOf(point.date)},${yOf(point.value)}`).join(' ')
  const active = selected === null ? null : points[selected]

  const pick = (event: React.PointerEvent<SVGSVGElement>) => {
    if (points.length === 0) return
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * WIDTH
    let nearest = 0
    points.forEach((point, index) => {
      if (Math.abs(xOf(point.date) - x) < Math.abs(xOf(points[nearest].date) - x)) nearest = index
    })
    setSelected(nearest)
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label={`${label} chart`}
      onPointerDown={pick}
      onPointerMove={(event) => event.buttons > 0 && pick(event)}
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 w-full touch-pan-y select-none"
    >
      {ticks.map((tick) => (
        <g key={tick}>
          {tick > min && (
            <line
              x1="0"
              x2={WIDTH - PAD.right + 6}
              y1={yOf(tick)}
              y2={yOf(tick)}
              className="stroke-foreground/25"
              strokeDasharray="3 3"
            />
          )}
          <text
            x={WIDTH - 2}
            y={yOf(tick) + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[12px] tabular-nums"
          >
            {tick}
          </text>
        </g>
      ))}
      <line
        x1="0"
        x2={WIDTH - PAD.right + 6}
        y1={yOf(min)}
        y2={yOf(min)}
        className="stroke-foreground/50"
      />
      {xAxisLabels(from, to).map(({ date, text }) => (
        <g key={date}>
          <line
            x1={xOf(date)}
            x2={xOf(date)}
            y1={yOf(min)}
            y2={yOf(min) + 5}
            className="stroke-foreground/50"
          />
          <text
            x={Math.min(Math.max(xOf(date), 20), WIDTH - PAD.right - 4)}
            y={height - 6}
            textAnchor="middle"
            className="fill-muted-foreground text-[12px]"
          >
            {text}
          </text>
        </g>
      ))}

      <g>
        {points.length > 1 && (
          <polyline
            points={line}
            fill="none"
            pathLength={1}
            className="stroke-mf-green motion-safe:animate-chart-draw"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
        {points.length <= MARKER_MAX &&
          points.map((point) => (
            <circle
              key={point.date}
              cx={xOf(point.date)}
              cy={yOf(point.value)}
              r="3.5"
              className="fill-card stroke-mf-green motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-500"
              strokeWidth="1.5"
            />
          ))}
      </g>

      {active && (
        <g
          key={active.date}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-150 pointer-events-none"
        >
          <line
            x1={xOf(active.date)}
            x2={xOf(active.date)}
            y1={PAD.top - 4}
            y2={yOf(min)}
            className="stroke-foreground/60"
            strokeDasharray="2 2"
          />
          <circle
            cx={xOf(active.date)}
            cy={yOf(active.value)}
            r="4.5"
            className="fill-mf-green stroke-card"
            strokeWidth="1.5"
          />
          <text
            x={Math.min(Math.max(xOf(active.date), 48), WIDTH - PAD.right - 48)}
            y={PAD.top - 12}
            textAnchor="middle"
            className="fill-foreground text-[13px] font-medium tabular-nums"
          >
            {active.value.toFixed(1)} {unit} · {entryDayLabel(active.date)}
          </text>
        </g>
      )}

      {points.length === 0 && (
        <text
          x={(WIDTH - PAD.right) / 2}
          y={height / 2}
          textAnchor="middle"
          className="fill-muted-foreground text-sm"
        >
          No entries in this range
        </text>
      )}
    </svg>
  )
}
