'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { formatMonthDay } from '@/lib/date'
import { cn } from '@/lib/utils'

interface MetricDateTabsProps {
  /** Ngày có số đo, cũ → mới (trái → phải như MacroFactor). */
  readonly dates: readonly string[]
  readonly value: string
  readonly onChange: (date: string) => void
}

/**
 * Hàng tab ngày cuộn ngang ("Oct 16", "Oct 20"): vạch trắng dưới tab đang chọn trượt sang tab mới (300ms) trên đường xám kín
 * bề ngang; tab đang chọn luôn được cuộn vào giữa.
 */
export function MetricDateTabs({ dates, value, onChange }: MetricDateTabsProps) {
  const tabs = useRef(new Map<string, HTMLButtonElement>())
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const tab = tabs.current.get(value)
    if (!tab) return
    setBar({ left: tab.offsetLeft, width: tab.offsetWidth })
    tab.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  }, [value, dates])

  return (
    <div className="relative -mx-4 [contain:inline-size] md:mx-0">
      <span
        aria-hidden="true"
        className="bg-foreground/20 pointer-events-none absolute inset-x-0 bottom-0 h-0.5"
      />
      <div
        role="tablist"
        aria-label="Dates"
        className="relative flex [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {dates.map((date) => {
          const selected = date === value
          return (
            <button
              key={date}
              ref={(element) => {
                if (element) tabs.current.set(date, element)
                else tabs.current.delete(date)
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(date)}
              className={cn(
                'focus-visible:ring-ring/50 h-12 w-[40%] max-w-40 min-w-28 shrink-0 px-5 text-left text-base whitespace-nowrap transition-colors duration-200 focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset',
                selected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {formatMonthDay(date)}
            </button>
          )
        })}
        {bar && (
          <span
            aria-hidden="true"
            style={{ transform: `translateX(${bar.left}px)`, width: bar.width }}
            className="bg-foreground pointer-events-none absolute bottom-0 left-0 h-1 transition-[transform,width] duration-300 ease-out motion-reduce:transition-none"
          />
        )}
      </div>
    </div>
  )
}
