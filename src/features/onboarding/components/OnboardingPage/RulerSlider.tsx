'use client'

import { useEffect, useMemo, useRef } from 'react'
import { roundTo } from '@/lib/units'

const TICK_WIDTH = 10
const STEPS_PER_UNIT = 10

interface RulerSliderProps {
  readonly value: number
  readonly min: number
  readonly max: number
  /** Bước 0.1; mỗi vạch dài = 1 đơn vị. */
  readonly onChange: (value: number) => void
  readonly unit: string
  readonly ariaLabel: string
  /** Tô vùng từ `highlightFrom` tới giá trị hiện tại (màn chọn cân mục tiêu). */
  readonly highlightFrom?: number
}

/**
 * Thước kéo ngang kiểu MacroFactor: cuộn để chọn, vạch giữa là giá trị; vạch vẽ bằng gradient nên
 * không tạo hàng nghìn phần tử. Bàn phím: ←/→ ±0.1, PageUp/PageDown ±1.
 */
export function RulerSlider({
  value,
  min,
  max,
  onChange,
  unit,
  ariaLabel,
  highlightFrom,
}: RulerSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const totalSteps = Math.round((max - min) * STEPS_PER_UNIT)
  const labels = useMemo(
    () =>
      Array.from(
        { length: Math.floor(max - min) + 1 },
        (_, index) => Math.ceil(min) + index
      ).filter((n) => n <= max),
    [min, max]
  )

  // Đưa thước về đúng vị trí khi giá trị đổi từ ngoài (đổi đơn vị, nhập tay)
  useEffect(() => {
    const element = scrollRef.current
    const target = (value - min) * STEPS_PER_UNIT * TICK_WIDTH
    if (element && Math.abs(element.scrollLeft - target) > TICK_WIDTH / 2)
      element.scrollLeft = target
  }, [value, min])

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    },
    []
  )

  const onScroll = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      const element = scrollRef.current
      if (!element) return
      const steps = Math.min(totalSteps, Math.max(0, Math.round(element.scrollLeft / TICK_WIDTH)))
      const next = roundTo(min + steps / STEPS_PER_UNIT, 1)
      if (next !== roundTo(value, 1)) onChange(next)
    })
  }

  const nudge = (delta: number) => onChange(roundTo(Math.min(max, Math.max(min, value + delta)), 1))

  const onKeyDown = (event: React.KeyboardEvent) => {
    const delta =
      event.key === 'ArrowRight'
        ? 0.1
        : event.key === 'ArrowLeft'
          ? -0.1
          : event.key === 'PageUp'
            ? 1
            : event.key === 'PageDown'
              ? -1
              : 0
    if (!delta) return
    event.preventDefault()
    nudge(delta)
  }

  const ruler = {
    width: totalSteps * TICK_WIDTH,
    backgroundImage:
      'linear-gradient(to right, var(--muted-foreground) 1px, transparent 1px), linear-gradient(to right, var(--muted-foreground) 1px, transparent 1px)',
    backgroundSize: `${TICK_WIDTH}px 14px, ${TICK_WIDTH * STEPS_PER_UNIT}px 28px`,
    backgroundPosition: 'left bottom, left bottom',
    backgroundRepeat: 'repeat-x, repeat-x',
  } as const

  const highlight =
    highlightFrom !== undefined
      ? {
          left: Math.min(value, highlightFrom) - min,
          width: Math.abs(value - highlightFrom),
        }
      : null

  return (
    <div className="space-y-3">
      <p className="text-center text-3xl font-bold tabular-nums" aria-hidden="true">
        {value.toFixed(1)} <span className="text-lg font-medium">{unit}</span>
      </p>
      <div className="relative">
        <div
          ref={scrollRef}
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value.toFixed(1)} ${unit}`}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          className="focus-visible:ring-ring/50 h-20 [scrollbar-width:none] overflow-x-auto overscroll-x-contain rounded-xl focus-visible:ring-1 focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
        >
          <div className="relative flex h-full items-end" style={{ paddingInline: '50%' }}>
            <div className="relative h-8 shrink-0" style={ruler}>
              {highlight && (
                <div
                  aria-hidden="true"
                  className="bg-mf-pastel-green absolute inset-y-0"
                  style={{
                    left: highlight.left * STEPS_PER_UNIT * TICK_WIDTH,
                    width: highlight.width * STEPS_PER_UNIT * TICK_WIDTH,
                    opacity: 0.55,
                  }}
                />
              )}
              {labels.map((label) => (
                <span
                  key={label}
                  aria-hidden="true"
                  className="text-muted-foreground absolute -top-6 -translate-x-1/2 text-xs tabular-nums"
                  style={{ left: (label - min) * STEPS_PER_UNIT * TICK_WIDTH }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="bg-mf-carbs pointer-events-none absolute bottom-0 left-1/2 h-14 w-0.5 -translate-x-1/2 rounded-full"
        />
      </div>
    </div>
  )
}
