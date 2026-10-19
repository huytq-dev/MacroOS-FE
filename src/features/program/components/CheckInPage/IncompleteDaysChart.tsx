'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { CheckInDay } from '../../types/check-in.types'
import { dayLetterOf } from '../../utils/check-in.utils'

interface IncompleteDaysChartProps {
  /** Bảy ngày cũ → mới của tuần đang review. */
  readonly days: readonly CheckInDay[]
  /** Các ngày (yyyy-MM-dd) đang được chọn là chưa log đủ. */
  readonly selected: ReadonlySet<string>
  readonly onToggle: (date: string) => void
}

/**
 * Biểu đồ cột chọn ngày "log chưa đủ": cao theo calo đã ăn so với mục tiêu (vạch đứt = mục tiêu của ngày đó), calo ghi trên đầu cột.
 * Bấm cột để chọn / bỏ chọn (cột chọn có viền trắng + gạch chéo); ngày chưa log là cột rỗng, không chọn được. Cột mọc lên khi vào
 * màn và đổi chiều cao mượt khi dữ liệu đổi.
 */
export function IncompleteDaysChart({ days, selected, onToggle }: IncompleteDaysChartProps) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  const scale = Math.max(...days.map((day) => Math.max(day.kcal ?? 0, day.targetKcal ?? 0)), 1)
  const percent = (value: number) => `${Math.min((value / scale) * 100, 100)}%`

  return (
    <ul aria-label="Calories logged each day" className="flex gap-2">
      {days.map((day) => {
        const on = selected.has(day.date)
        const logged = day.kcal !== null
        return (
          <li key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-muted-foreground h-5 text-sm tabular-nums">
              {logged ? Math.round(day.kcal ?? 0) : '—'}
            </span>
            <button
              type="button"
              aria-pressed={on}
              disabled={!logged}
              aria-label={`${day.date}: ${logged ? `${Math.round(day.kcal ?? 0)} kcal` : 'not logged'}`}
              onClick={() => onToggle(day.date)}
              className={cn(
                'focus-visible:ring-ring/50 relative flex h-56 w-full items-end overflow-hidden rounded-lg border-2 transition-[border-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none enabled:active:scale-95 motion-reduce:enabled:active:scale-100',
                on ? 'border-foreground' : 'border-transparent',
                !logged && 'border-border border-dashed'
              )}
            >
              {logged && (
                <span
                  style={{ height: ready ? percent(day.kcal ?? 0) : '0%' }}
                  className="relative w-full rounded-md bg-[var(--mf-tile-calories)] transition-[height] duration-500 ease-out motion-reduce:transition-none"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-0 transition-opacity duration-300',
                      'bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(0_0_0/0.28)_6px_9px)]',
                      on ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </span>
              )}
              {day.targetKcal !== null && (
                <span
                  aria-hidden="true"
                  style={{ bottom: percent(day.targetKcal) }}
                  className="border-foreground/60 absolute inset-x-0 border-t-2 border-dashed"
                />
              )}
            </button>
            <span className="text-muted-foreground text-base">{dayLetterOf(day.date)}</span>
          </li>
        )
      })}
    </ul>
  )
}
