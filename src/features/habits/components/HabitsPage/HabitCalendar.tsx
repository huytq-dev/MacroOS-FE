'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import { WEEKDAY_LABELS, type CalendarDay } from '../../habits.utils'

/** Quãng vuốt ngang tối thiểu (px) để tính là chuyển tháng. */
const SWIPE_MIN_PX = 48

interface HabitCalendarProps {
  /** Lưới 6 × 7 của tháng đang xem. */
  readonly grid: readonly CalendarDay[]
  /** Đổi theo tháng: dựng lại lưới để chạy hoạt ảnh trượt. */
  readonly monthKey: string
  /** Hướng chuyển tháng (next = trượt từ phải vào, prev = từ trái vào); null = lần đầu, không trượt. */
  readonly direction: 'next' | 'prev' | null
  readonly tracked: ReadonlySet<string>
  readonly today: string
  readonly onSelect: (iso: string) => void
  /** Lớp viền của ngày đã thực hiện (mặc định xanh lá của Habits; Period dùng màu riêng). */
  readonly trackedBorder?: string
  /** Vuốt ngang trên lịch: -1 = sang trái (tháng sau), 1 = sang phải (tháng trước). Không có thì không bắt vuốt. */
  readonly onSwipe?: (direction: 'next' | 'prev') => void
}

/**
 * Lịch tháng kiểu MacroFactor: mỗi ngày một vòng tròn mảnh; ngày đã thực hiện có vòng xanh dày (hiện ra bằng fade + phóng nhẹ), hôm
 * nay có chấm nhỏ dưới số, ngày tương lai trong tháng vẫn đủ vòng như MacroOS (chỉ không bấm được), ngày của tháng kề mờ và không vòng. Hàng Mon → Sun nằm dưới lưới.
 */
export function HabitCalendar({
  grid,
  monthKey,
  direction,
  tracked,
  today,
  onSelect,
  trackedBorder = 'border-mf-tile-carbs',
  onSwipe,
}: HabitCalendarProps) {
  const start = useRef<{ x: number; y: number } | null>(null)
  return (
    <div
      // Vuốt ngang đổi tháng; touch-pan-y giữ cuộn dọc của trang
      className={cn(onSwipe && 'touch-pan-y')}
      onPointerDown={(event) => {
        if (onSwipe) start.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerUp={(event) => {
        const origin = start.current
        start.current = null
        if (!origin || !onSwipe) return
        const dx = event.clientX - origin.x
        const dy = event.clientY - origin.y
        if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5)
          onSwipe(dx < 0 ? 'next' : 'prev')
      }}
      onPointerCancel={() => {
        start.current = null
      }}
    >
      <div
        key={monthKey}
        className={cn(
          'grid grid-cols-7 gap-y-2.5',
          direction === 'next' &&
            'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-6 motion-safe:animation-duration-300',
          direction === 'prev' &&
            'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-6 motion-safe:animation-duration-300'
        )}
      >
        {grid.map(({ iso, day, inMonth }, index) => {
          const done = tracked.has(iso)
          const future = iso > today
          const isToday = iso === today
          const label = `${formatDate(iso)}${done ? ', tracked' : ''}${isToday ? ', today' : ''}`
          const face = cn(
            'relative mx-auto flex size-11 items-center justify-center rounded-full text-base tabular-nums transition-colors duration-300',
            !inMonth && 'text-muted-foreground/40',
            inMonth && !done && 'text-foreground',
            inMonth && !done && 'border-border/60 border',
            inMonth &&
              done &&
              `${trackedBorder} motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:fade-in-0 motion-safe:animation-duration-300 border-2`
          )
          const content = (
            <>
              {day}
              {isToday && (
                <span
                  aria-hidden="true"
                  className="bg-foreground absolute bottom-1.5 size-1 rounded-full"
                />
              )}
            </>
          )
          return inMonth && !future ? (
            <button
              key={iso}
              type="button"
              aria-label={label}
              onClick={() => onSelect(iso)}
              // Ô đã thực hiện hiện lần lượt từng ô (so le 12ms) cho cảm giác lan ra
              style={done ? { animationDelay: `${index * 12}ms` } : undefined}
              className={cn(
                face,
                'active:bg-foreground/10 focus-visible:ring-ring/50 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100'
              )}
            >
              {content}
            </button>
          ) : (
            <span
              key={iso}
              aria-hidden={!inMonth}
              aria-label={inMonth ? label : undefined}
              className={face}
            >
              {content}
            </span>
          )
        })}
      </div>
      <div className="text-muted-foreground mt-3 grid grid-cols-7 text-center text-sm">
        {WEEKDAY_LABELS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
    </div>
  )
}
