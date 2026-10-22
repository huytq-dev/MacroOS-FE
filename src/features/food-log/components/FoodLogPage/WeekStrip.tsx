'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUnits } from '@/features/users/hooks/use-units'
import { addDaysIso, daysBetween } from '@/lib/date'
import { DAYS_PER_WEEK, dayOfWeekOf, weekDates, weekdayIndex, weekStartOf } from '@/lib/week'
import { cn } from '@/lib/utils'
import type { WeekDay } from '../../types/food-log.types'

/** Số tuần trước/sau tuần hôm nay mà thanh tuần và lịch dựng sẵn. */
const WEEKS_EACH_SIDE = 26

const weeksBetween = (fromStart: string, toStart: string) =>
  Math.round(daysBetween(fromStart, toStart) / DAYS_PER_WEEK)

/** Ngày đầu tuần từ 26 tuần trước tới 26 tuần sau `anchor`, nới thêm nếu tuần `include` nằm ngoài khoảng đó (cả hai là ngày đầu tuần). */
export const weeksAround = (anchor: string, include: string) => {
  const offset = weeksBetween(anchor, include)
  const first = Math.min(-WEEKS_EACH_SIDE, offset)
  const last = Math.max(WEEKS_EACH_SIDE, offset)
  return Array.from({ length: last - first + 1 }, (_, index) =>
    addDaysIso(anchor, (first + index) * DAYS_PER_WEEK)
  )
}

/** % kcal đã ăn / mục tiêu kcal của ngày (chặn 100); null = không vẽ vòng (ngày tương lai, chưa log, chưa có mục tiêu). */
export const kcalPercent = (day: WeekDay | undefined, today: string | null) => {
  const goal = day?.target?.caloriesTarget ?? 0
  if (!day?.isLogged || !today || day.logDate > today || goal <= 0 || day.totals.calories <= 0)
    return null
  return Math.min(100, (day.totals.calories / goal) * 100)
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface DayPillProps {
  readonly day: string
  readonly weekday: string
  readonly selected: boolean
  readonly isToday: boolean
  /** % kcal cho vòng chạy theo viền; null = chỉ viền xám. */
  readonly percent: number | null
  readonly onSelect: (date: string) => void
}

/**
 * Viên thuốc dọc của một ngày (số ngày + thứ): chọn thì tô xám đặc, hôm nay có chấm nhỏ bên dưới. Vòng kcal là rect bo bằng
 * nửa bề rộng (pathLength=100) phủ đúng lên viền nên nét bắt đầu ở giữa cạnh trên và chạy theo chiều kim đồng hồ.
 */
export function DayPill({ day, weekday, selected, isToday, percent, onSelect }: DayPillProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${weekday} ${Number(day.slice(8))}${isToday ? ', today' : ''}${
        percent === null ? '' : `, ${Math.round(percent)}% of calorie target`
      }`}
      onClick={() => onSelect(day)}
      className={cn(
        'focus-visible:ring-ring/50 relative flex h-[3.75rem] w-11 flex-col items-center justify-center rounded-full border-2 transition-colors duration-200 focus-visible:ring-1 focus-visible:outline-none',
        selected ? 'bg-foreground/20 border-transparent' : 'border-foreground/25'
      )}
    >
      {percent !== null && (
        <svg
          aria-hidden="true"
          viewBox="0 0 44 60"
          className="pointer-events-none absolute -top-0.5 -left-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)]"
        >
          <rect
            x="1"
            y="1"
            width="42"
            height="58"
            rx="21"
            pathLength={100}
            fill="none"
            strokeWidth="2"
            strokeDasharray="100"
            style={{ strokeDashoffset: 100 - percent, ['--ring-start' as string]: 100 }}
            className="stroke-mf-tile-calories motion-safe:animate-ring-fill transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>
      )}
      <span className="text-lg leading-none tabular-nums">{Number(day.slice(8))}</span>
      <span className="text-muted-foreground mt-1 text-sm leading-none">{weekday}</span>
      <span
        aria-hidden="true"
        className={cn('mt-0.5 size-1 rounded-full', isToday ? 'bg-foreground' : 'bg-transparent')}
      />
    </button>
  )
}

interface WeekStripProps {
  readonly date: string
  readonly today: string | null
  readonly onSelect: (date: string) => void
  /** Cài đặt Calendar Scrolling: Daily = dừng ở từng ngày, Weekly = dừng ở từng tuần. */
  readonly scrolling: 'Daily' | 'Weekly'
  /** Tổng theo ngày (map iso → WeekDay) cho vòng kcal. */
  readonly days: Readonly<Record<string, WeekDay>>
  /** Báo các tuần (ngày đầu tuần theo cài đặt của user) đang thấy để trang cha tải số liệu vòng kcal. */
  readonly onWeeksView: (weekStarts: readonly string[]) => void
}

/** Quãng kéo chuột tối thiểu để tính là vuốt (cảm ứng dùng cuộn gốc có quán tính). */
const SWIPE_MIN_PX = 40

type TodaySide = 'left' | 'right' | null

/**
 * Thanh tuần cuộn ngang kiểu MacroFactor: các tuần bắt đầu từ ngày đầu tuần của user (Profile) xếp liền (±26 tuần quanh hôm nay), cuộn gốc có quán tính và
 * scroll-snap theo tuần (Weekly) hoặc theo ngày (Daily). Vuốt chỉ xem tuần khác, không đổi ngày đang chọn. Khi hôm nay ra
 * khỏi khung, nút trắng ‹ / › đè lên viên đầu / cuối phía hôm nay; bấm thì cuộn mượt về tuần hôm nay.
 */
export function WeekStrip({ date, today, onSelect, scrolling, days, onWeeksView }: WeekStripProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)
  // Chuột không có cuộn ngang gốc: kéo đủ xa thì cuộn một bước, và chặn cú click ngay sau đó.
  const drag = useRef<{ x: number; swiped: boolean } | null>(null)
  const [todaySide, setTodaySide] = useState<TodaySide>(null)
  const { weekStartDay } = useUnits()
  const startOf = (iso: string) => weekStartOf(iso, weekStartDay)
  const weeks = weeksAround(startOf(today ?? date), startOf(date))
  const columnOf = (iso: string) =>
    weeks.indexOf(startOf(iso)) * 7 + weekdayIndex(iso, weekStartDay)

  const scrollToWeek = (weekStart: string, smooth: boolean) => {
    const element = scroller.current
    if (!element) return
    element.scrollTo({
      left: weeks.indexOf(weekStart) * element.clientWidth,
      behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'instant',
    })
  }

  const onScroll = () => {
    const element = scroller.current
    if (!element || element.clientWidth === 0) return
    const { scrollLeft, clientWidth } = element
    onWeeksView(
      weeks.slice(Math.floor(scrollLeft / clientWidth), Math.ceil(scrollLeft / clientWidth) + 1)
    )
    if (!today) return
    const column = clientWidth / 7
    const todayCenter = (columnOf(today) + 0.5) * column
    setTodaySide(
      todayCenter < scrollLeft ? 'left' : todayCenter > scrollLeft + clientWidth ? 'right' : null
    )
  }

  // Ngày chọn đổi (bấm lịch, Copy…) mà viên của nó đang khuất thì cuộn tới tuần đó; lần đầu nhảy thẳng, không hoạt ảnh.
  useLayoutEffect(() => {
    const element = scroller.current
    if (!element) return
    const column = element.clientWidth / 7
    const left = columnOf(date) * column
    const visible =
      left >= element.scrollLeft - 1 &&
      left + column <= element.scrollLeft + element.clientWidth + 1
    if (!mounted.current || !visible) scrollToWeek(startOf(date), mounted.current)
    mounted.current = true
    onScroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lại khi ngày chọn đổi
  }, [date])

  return (
    <div className="relative [contain:inline-size]">
      <div
        ref={scroller}
        role="group"
        aria-label="Week"
        onScroll={onScroll}
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') return
          drag.current = { x: event.clientX, swiped: false }
        }}
        onPointerUp={(event) => {
          const start = drag.current
          const element = scroller.current
          if (!start || !element) return
          const delta = event.clientX - start.x
          if (Math.abs(delta) < SWIPE_MIN_PX) {
            drag.current = null
            return
          }
          start.swiped = true
          const step = scrolling === 'Weekly' ? element.clientWidth : element.clientWidth / 7
          const steps = scrolling === 'Weekly' ? 1 : Math.max(1, Math.round(Math.abs(delta) / step))
          element.scrollBy({
            left: (delta < 0 ? 1 : -1) * steps * step,
            behavior: prefersReducedMotion() ? 'instant' : 'smooth',
          })
        }}
        onClickCapture={(event) => {
          const swiped = drag.current?.swiped
          drag.current = null
          if (!swiped) return
          event.stopPropagation()
          event.preventDefault()
        }}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
      >
        {weeks.map((weekStart) => (
          <div
            key={weekStart}
            className={cn(
              'grid w-full shrink-0 grid-cols-7',
              scrolling === 'Weekly' && 'snap-start snap-always'
            )}
          >
            {weekDates(weekStart).map((day) => (
              <div
                key={day}
                className={cn('flex justify-center', scrolling === 'Daily' && 'snap-start')}
              >
                <DayPill
                  day={day}
                  weekday={dayOfWeekOf(day).slice(0, 2)}
                  selected={day === date}
                  isToday={day === today}
                  percent={kcalPercent(days[day], today)}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      {todaySide && today && (
        <div
          key={todaySide}
          className={cn(
            'bg-card motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-90 absolute inset-y-0 flex w-[calc(100%/7)] justify-center motion-safe:duration-200',
            todaySide === 'left' ? 'left-0' : 'right-0'
          )}
        >
          <button
            type="button"
            aria-label="Back to this week"
            onClick={() => scrollToWeek(startOf(today), true)}
            className="bg-foreground text-background focus-visible:ring-ring/50 flex h-[3.75rem] w-11 items-center justify-center rounded-full transition-transform duration-150 focus-visible:ring-2 focus-visible:outline-none active:scale-95"
          >
            {todaySide === 'left' ? (
              <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2.5} />
            ) : (
              <ChevronRight aria-hidden="true" className="size-6" strokeWidth={2.5} />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
