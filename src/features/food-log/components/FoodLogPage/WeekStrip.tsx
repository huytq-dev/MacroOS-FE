import { useRef } from 'react'
import { addDaysIso } from '@/lib/date'
import { cn } from '@/lib/utils'

export const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

interface WeekStripProps {
  readonly date: string
  readonly today: string | null
  readonly onSelect: (date: string) => void
  /** Cài đặt Calendar Scrolling: daily = vuốt theo số ngày tương ứng quãng kéo, weekly = mỗi lần vuốt một tuần. */
  readonly scrolling: 'Daily' | 'Weekly'
}

/** Quãng kéo tối thiểu để tính là vuốt, và quãng kéo ứng với một ngày ở chế độ Daily Scroll. */
const SWIPE_MIN_PX = 40
const DAY_PX = 56

/** Thứ Hai của tuần chứa `iso`. */
export const mondayOf = (iso: string) => {
  const day = new Date(`${iso}T00:00:00`).getDay()
  return addDaysIso(iso, -((day + 6) % 7))
}

interface DayPillProps {
  readonly day: string
  readonly weekday: string
  readonly selected: boolean
  readonly isToday: boolean
  readonly onSelect: (date: string) => void
}

/** Viên thuốc dọc của một ngày (số ngày + thứ): chọn thì tô xám đặc, hôm nay có chấm nhỏ bên dưới. */
export function DayPill({ day, weekday, selected, isToday, onSelect }: DayPillProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${weekday} ${Number(day.slice(8))}${isToday ? ', today' : ''}`}
      onClick={() => onSelect(day)}
      className={cn(
        'focus-visible:ring-ring/50 flex h-[3.75rem] w-11 flex-col items-center justify-center rounded-full border-2 transition-colors duration-200 focus-visible:ring-1 focus-visible:outline-none',
        selected ? 'bg-foreground/20 border-transparent' : 'border-foreground/25'
      )}
    >
      <span className="text-lg leading-none tabular-nums">{Number(day.slice(8))}</span>
      <span className="text-muted-foreground mt-1 text-sm leading-none">{weekday}</span>
      <span
        aria-hidden="true"
        className={cn('mt-0.5 size-1 rounded-full', isToday ? 'bg-foreground' : 'bg-transparent')}
      />
    </button>
  )
}

/**
 * Thanh tuần (Thứ Hai → Chủ nhật) của ngày đang xem. Vuốt ngang để đổi ngày: Daily Scroll nhảy theo quãng kéo
 * (mỗi ~56px một ngày), Weekly Swipe mỗi lần vuốt đúng một tuần; vuốt sang trái là đi tới.
 */
export function WeekStrip({ date, today, onSelect, scrolling }: WeekStripProps) {
  const monday = mondayOf(date)
  const startX = useRef<number | null>(null)
  const swiped = useRef(false)
  return (
    <div
      role="group"
      aria-label="Week"
      className="flex touch-pan-y justify-between"
      onPointerDown={(event) => {
        startX.current = event.clientX
        swiped.current = false
      }}
      onPointerUp={(event) => {
        if (startX.current === null) return
        const delta = event.clientX - startX.current
        startX.current = null
        if (Math.abs(delta) < SWIPE_MIN_PX) return
        swiped.current = true
        const direction = delta < 0 ? 1 : -1
        const days = scrolling === 'Weekly' ? 7 : Math.max(1, Math.round(Math.abs(delta) / DAY_PX))
        onSelect(addDaysIso(date, direction * days))
      }}
      onPointerCancel={() => {
        startX.current = null
      }}
      onClickCapture={(event) => {
        if (!swiped.current) return
        swiped.current = false
        event.stopPropagation()
        event.preventDefault()
      }}
    >
      {WEEKDAYS.map((label, index) => {
        const day = addDaysIso(monday, index)
        return (
          <DayPill
            key={day}
            day={day}
            weekday={label}
            selected={day === date}
            isToday={day === today}
            onSelect={onSelect}
          />
        )
      })}
    </div>
  )
}
