'use client'

import { useState } from 'react'
import { ChartAxes, PlotClip } from '../../chart/ChartAxes'
import { PAD, PLOT_W, WIDTH, agoOf, showMarkers, visibleAgo, xOfAgo } from '../../chart/geometry'
import type { useChartPan } from '../../chart/use-chart-pan'
import { bandPath } from '../../chart/smooth-path'
import { useTween } from '../../chart/use-tween'
import { expAxis, fluxSegments, type ExpDay } from '../../expenditure-series'
import { bucketLabel } from '../../expenditure.utils'
import { cn } from '@/lib/utils'

interface ExpenditureChartProps {
  /** TOÀN BỘ chuỗi từng ngày (cũ → mới), biểu đồ tự lấy phần đang hiện. */
  readonly days: readonly ExpDay[]
  /** Đơn vị của kcal trong `days` (kcal hoặc kJ): chuỗi đã đổi sẵn sang đơn vị này. */
  readonly unit: string
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

/** Trạng thái của điểm bằng chữ: Calibrating = ước tính ban đầu (Initial), đóng băng theo thiết kế; nhóm W / M lẫn trạng thái = Mixed. */
export const statusLabel = (
  status: ExpDay['status'],
  activeSource: ExpDay['activeSource'] = null
) =>
  activeSource === 'Static'
    ? 'Static (set by you)'
    : status === 'Calibrating'
      ? 'Initial estimate (calibrating)'
      : status

const DIRECTION: Record<'Up' | 'Down' | 'Stable', string> = {
  Up: 'rising',
  Down: 'falling',
  Stable: 'stable',
}

/** Độ dày tối thiểu (đơn vị viewBox) của dải: Stable = độ rộng ≤ 1 kcal nên vẽ như một đường mảnh nhìn thấy được (chỉ là nét vẽ, số của BE giữ nguyên). */
const MIN_BAND_THICKNESS = 2

/** Nửa bề rộng (đơn vị viewBox) của dải khi một đoạn chỉ có MỘT nhóm: vẫn thấy được thay vì mất hẳn. */
const LONE_BAND_HALF_WIDTH = 3

/**
 * Biểu đồ Expenditure kiểu MacroFactor: dải Flux Range cam mờ của BE (chỉ ở ngày BE trả dải, không nối qua chỗ thiếu; vẽ DƯỚI đường), đường
 * Expenditure màu cam (từ ước lượng từng ngày của BE) có marker mỗi ngày (ô vuông rỗng = Holding / Calibrating, vòng tròn rỗng = Updating, theo
 * trạng thái của BE). Dải là "ước lượng bất đồng giữa các độ nhạy" của MacroOS, KHÔNG phải khoảng tin cậy (tooltip ghi rõ).
 * Kéo ngang để xem các ngày trước (quán tính, bám theo ngày); đổi kỳ thì trục x giãn / co mượt, trục y luôn vừa khít đường VÀ dải trong khung (chạy mượt khi
 * kéo / đổi kỳ); chạm một ngày để xem kcal, Flux Lower / Upper và trạng thái.
 */
export function ExpenditureChart({
  days,
  unit,
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
  // Marker từng ngày (ô vuông = Holding / Calibrating, vòng tròn = Updating) ở kỳ ngắn, hoặc khi chỉ có MỘT điểm (không có đường / dải)
  const markers = showMarkers(slots, shown.length)

  const line = shown.map((day) => `${x(day.date)},${y(day.kcal)}`).join(' ')
  // Mỗi đoạn liên tục có dải là MỘT path khép kín; mép trên / dưới là đường cong mượt đi qua ĐÚNG fluxHigh / fluxLow của BE ở từng điểm (không có hình chữ nhật hay ±N cố định)
  const bands = fluxSegments(shown).map((segment) => ({
    key: segment[0].date,
    d: bandPath(
      segment.map((day) => ({
        x: x(day.date),
        y: Math.min(y(day.fluxHigh ?? day.kcal), y(day.kcal) - MIN_BAND_THICKNESS / 2),
      })),
      segment.map((day) => ({
        x: x(day.date),
        y: Math.max(y(day.fluxLow ?? day.kcal), y(day.kcal) + MIN_BAND_THICKNESS / 2),
      })),
      LONE_BAND_HALF_WIDTH
    ),
  }))

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
          {bands.map((band) => (
            <path
              key={band.key}
              d={band.d}
              data-flux-band=""
              className="fill-mf-flux-band/30 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-500"
            />
          ))}
          {shown.length > 1 && (
            <polyline
              points={line}
              fill="none"
              strokeWidth="2"
              strokeLinejoin="round"
              pathLength={1}
              className="stroke-mf-tile-protein motion-safe:animate-chart-draw"
            />
          )}
          {markers &&
            shown.map((day) => {
              if (day.marker === null) return null
              const size = picked !== null && agoOf(today, day.date) === picked ? 5.5 : 4
              const common = {
                strokeWidth: 1.5,
                className: 'fill-background stroke-mf-tile-protein',
              }
              return day.marker === 'square' ? (
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
          style={{ left: `${Math.min(74, Math.max(26, (selectedX / WIDTH) * 100))}%` }}
          className="bg-popover border-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-200 pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border px-3 py-2 text-center whitespace-nowrap shadow-md"
        >
          <p className="text-muted-foreground text-xs">
            {bucketLabel(selected.date, selected.end, selected.days)}
          </p>
          <p className="text-sm font-medium tabular-nums">
            {kcal(selected.kcal)} {unit}
          </p>
          <p className="text-muted-foreground text-xs">
            {statusLabel(selected.status, selected.activeSource)}
          </p>
          {selected.fluxLow !== null && selected.fluxHigh !== null && (
            <>
              <p className="text-muted-foreground text-xs tabular-nums">
                MacroOS Flux
                {selected.fluxDirection ? ` · ${DIRECTION[selected.fluxDirection]}` : ''}
                <br />
                {kcal(selected.fluxLow)} – {kcal(selected.fluxHigh)} {unit}
              </p>
              <p className="text-muted-foreground/80 text-[11px]">Not a confidence interval.</p>
            </>
          )}
          {selected.status === 'Mixed' && (
            <p className="text-muted-foreground text-xs tabular-nums">
              {selected.updatingDays} Updating · {selected.otherDays} Holding / Calibrating
            </p>
          )}
        </div>
      )}
    </div>
  )
}
