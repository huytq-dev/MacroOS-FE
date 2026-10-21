'use client'

import { useState } from 'react'
import type { NutrientInfo } from '../nutrient-detail.utils'
import type { NutrientSeriesDay } from '../types/nutrient-detail.types'
import { ChartAxes, PlotClip } from '@/features/dashboard/chart/ChartAxes'
import { PAD, PLOT_W, WIDTH, agoOf, visibleAgo, xOfAgo } from '@/features/dashboard/chart/geometry'
import type { useChartPan } from '@/features/dashboard/chart/use-chart-pan'
import { useTween } from '@/features/dashboard/chart/use-tween'
import { shortDay } from '@/features/dashboard/expenditure.utils'
import { niceAxis } from '@/features/dashboard/goal-progress.utils'
import { normalizeGoal, primaryGoal } from '@/features/nutrition/goal-progress'
import { formatAmount } from '@/features/nutrition/nutrient-display'
import { cn } from '@/lib/utils'

/** Khung chưa có số nào: trục mẫu 0–100 để vẫn thấy lưới. */
const EMPTY_TOP = 100

interface NutrientChartProps {
  readonly info: NutrientInfo
  /** TOÀN BỘ ngày (cũ → mới, đã gộp D/W/M): `amount` null = chưa log, không vẽ cột. */
  readonly days: readonly NutrientSeriesDay[]
  readonly today: string
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
 * Biểu đồ một chất kiểu MacroFactor: cột màu của chất cho từng ngày đã log, đường target liền, dải Range (floor → ceiling) mờ phía sau,
 * lưới ngang đứt và nhãn trục bên phải. Kéo ngang để xem các ngày trước (quán tính, bám theo ngày, hiện ĐỦ cột cuối); đổi kỳ thì cột
 * giãn / co mượt, trục y và chiều cao chạy mượt. Chạm một cột để xem lượng và mục tiêu của ngày đó.
 */
export function NutrientChart({
  info,
  days,
  today,
  slots,
  pos,
  height,
  pan,
  className,
}: NutrientChartProps) {
  const { nutrient, color } = info
  const [picked, setPicked] = useState<string | null>(null)
  const plotH = height - PAD.top - PAD.bottom
  const { min: lo, max: hi } = visibleAgo(slots, pos)
  const slotW = PLOT_W / slots

  const shown = days.filter((day) => {
    const ago = agoOf(today, day.date)
    return ago >= lo && ago <= hi
  })
  const inFrame = days.filter((day) => {
    const ago = agoOf(today, day.date)
    return ago >= pos - 0.5 && ago <= pos + slots - 0.5
  })
  // Trục lấy theo lượng, target và floor trong khung (trần có thể cao hơn nhiều nên không tính)
  const top = Math.max(
    0,
    ...inFrame.flatMap((day) => {
      const goal = normalizeGoal(day)
      return [day.amount ?? 0, goal.target ?? 0, goal.floor ?? 0, goal.ceiling ?? 0]
    })
  )
  const axis = niceAxis(top || EMPTY_TOP)
  const max = useTween(axis.max)
  const y = (value: number) => PAD.top + (1 - value / (max || 1)) * plotH
  const x = (date: string) => xOfAgo(agoOf(today, date), slots, pos)
  const barWidth = Math.min(26, slotW * 0.62)

  const withTarget = shown.filter((day) => normalizeGoal(day).target !== null)
  const targetLine =
    withTarget.length === 1
      ? `${x(withTarget[0].date) - slotW / 2},${y(normalizeGoal(withTarget[0]).target ?? 0)} ${x(withTarget[0].date) + slotW / 2},${y(normalizeGoal(withTarget[0]).target ?? 0)}`
      : withTarget.map((day) => `${x(day.date)},${y(normalizeGoal(day).target ?? 0)}`).join(' ')

  const pick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pan.wasDragged()) return
    const box = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    const ago = Math.round(pos + (PAD.left + PLOT_W - px) / slotW - 0.5)
    setPicked(days.find((day) => agoOf(today, day.date) === ago)?.date ?? null)
  }
  const selected = picked === null ? null : days.find((day) => day.date === picked)
  const selectedX = selected ? x(selected.date) : 0
  const selectedVisible =
    selected !== undefined && selectedX >= PAD.left && selectedX <= PAD.left + PLOT_W
  const selectedTarget = selected ? primaryGoal(selected) : null

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
        aria-label={`${nutrient.name} chart`}
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
          integerTicks={nutrient.unit === 'kcal'}
        />

        <g clipPath="url(#plot-clip)">
          {shown.map((day) => {
            const goal = normalizeGoal(day)
            if (goal.floor === null && goal.ceiling === null) return null
            const upper = Math.min(goal.ceiling ?? max, max)
            const lower = goal.floor ?? goal.target ?? 0
            return (
              <rect
                key={`range-${day.date}`}
                x={x(day.date) - slotW / 2}
                y={y(upper)}
                width={slotW}
                height={Math.max(0, y(lower) - y(upper))}
                style={{ fill: color }}
                className="opacity-15"
              />
            )
          })}
          {shown.map((day) =>
            day.amount === null ? null : (
              <rect
                key={day.date}
                x={x(day.date) - barWidth / 2}
                y={y(day.amount)}
                width={barWidth}
                height={Math.max(1, y(0) - y(day.amount))}
                rx="2"
                style={{ fill: color }}
                className={cn(
                  day.isIncomplete && 'opacity-40',
                  day.date === picked && 'opacity-80'
                )}
              />
            )
          )}
          {targetLine && (
            <polyline
              points={targetLine}
              fill="none"
              strokeWidth="1.8"
              strokeLinejoin="round"
              className="stroke-foreground/70"
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
            {selected.amount === null
              ? 'Not logged'
              : `${formatAmount(selected.amount, nutrient.unit)} ${nutrient.unit}`}
          </p>
          {selectedTarget !== null && (
            <p className="text-muted-foreground text-xs tabular-nums">
              Target {formatAmount(selectedTarget, nutrient.unit)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
