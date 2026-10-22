'use client'

import { useEffect, useRef } from 'react'
import { useUnits } from '@/features/users/hooks/use-units'
import { MONTH_SHORT, addDaysIso } from '@/lib/date'
import { dayOfWeekOf, weekDates, weekStartOf } from '@/lib/week'
import { cn } from '@/lib/utils'
import type { WeekDay } from '../../types/food-log.types'
import { DayPill, kcalPercent, weeksAround } from './WeekStrip'

const COLUMNS = 7

interface CalendarSheetProps {
  readonly date: string
  readonly today: string | null
  readonly onSelect: (date: string) => void
  /** false = đang đóng: mờ và trượt lên 200ms rồi gọi `onExited` để cha gỡ lịch khỏi cây. */
  readonly open: boolean
  readonly onExited: () => void
  /** Tổng theo ngày (map iso → WeekDay) cho vòng kcal. */
  readonly days: Readonly<Record<string, WeekDay>>
  /** Báo các tuần (ngày đầu tuần theo cài đặt của user) đang thấy để trang cha tải số liệu vòng kcal. */
  readonly onWeeksView: (weekStarts: readonly string[]) => void
}

/** Thời gian hoạt ảnh đóng, khớp `duration-200` bên dưới. */
const EXIT_MS = 200

/** Số tháng (1–12) của ngày iso; tháng chẵn nền sáng, tháng lẻ nền tối nên ranh giới tháng hiện rõ như MacroFactor. */
const monthOf = (iso: string) => Number(iso.slice(5, 7))

/** Các hàng tuần đang nằm trong khung cuộn (mọi hàng cao bằng nhau). */
const visibleWeeks = (element: HTMLElement, weeks: readonly string[]) => {
  const rowHeight = element.querySelector('li')?.offsetHeight ?? 0
  if (rowHeight === 0) return []
  const first = Math.floor(element.scrollTop / rowHeight)
  return weeks.slice(first, Math.ceil((element.scrollTop + element.clientHeight) / rowHeight) + 1)
}

/**
 * Lịch cuộn theo tuần phủ kín phần dưới header: mỗi hàng là một tuần bắt đầu từ ngày đầu tuần của user (±26 tuần quanh hôm nay), mở ra thì tuần của ngày
 * đang chọn nằm ở đầu. Mỗi tháng là một mảng nền riêng (xen kẽ sáng/tối, góc bo ở chỗ đổi tháng) và nhãn tháng nằm trên ngày
 * mùng 1, mỗi viên ngày có vòng kcal như thanh tuần (chỉ tải số liệu của các tuần đang thấy). Chọn một ngày thì chuyển ngày và đóng lịch (trang cha lo phần đóng).
 */
export function CalendarSheet({
  date,
  today,
  onSelect,
  open,
  onExited,
  days,
  onWeeksView,
}: CalendarSheetProps) {
  useEffect(() => {
    if (open) return
    const timer = setTimeout(onExited, EXIT_MS)
    return () => clearTimeout(timer)
  }, [open, onExited])
  const selectedRow = useRef<HTMLLIElement>(null)
  const { weekStartDay } = useUnits()
  const weeks = weeksAround(
    weekStartOf(today ?? date, weekStartDay),
    weekStartOf(date, weekStartDay)
  )
  const selectedWeek = weekStartOf(date, weekStartDay)

  useEffect(() => {
    const row = selectedRow.current
    row?.scrollIntoView({ block: 'start' })
    if (row?.parentElement?.parentElement)
      onWeeksView(visibleWeeks(row.parentElement.parentElement, weeks))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ cuộn tới tuần đang chọn lúc mở
  }, [])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-label="Calendar"
      inert={!open}
      onScroll={(event) => onWeeksView(visibleWeeks(event.currentTarget, weeks))}
      className={cn(
        'bg-background motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.25rem)] bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 overflow-y-auto overscroll-contain transition-[opacity,translate] duration-200 ease-in motion-reduce:transition-none',
        !open && 'pointer-events-none -translate-y-2 opacity-0'
      )}
    >
      <ol>
        {weeks.map((weekStart) => (
          <li
            key={weekStart}
            ref={weekStart === selectedWeek ? selectedRow : undefined}
            className="grid grid-cols-7"
          >
            {weekDates(weekStart).map((day, column) => {
              const month = monthOf(day)
              // Góc ngoài của mảng tháng bo tròn khi cả hai cạnh kề đều thuộc tháng khác (mép màn hình không tính).
              const otherAbove = monthOf(addDaysIso(day, -COLUMNS)) !== month
              const otherBelow = monthOf(addDaysIso(day, COLUMNS)) !== month
              const otherLeft = column > 0 && monthOf(addDaysIso(day, -1)) !== month
              const otherRight = column < COLUMNS - 1 && monthOf(addDaysIso(day, 1)) !== month
              return (
                <div
                  key={day}
                  className={cn(
                    'relative flex justify-center py-4',
                    month % 2 === 0 ? 'bg-card' : 'bg-background',
                    otherAbove && otherLeft && 'rounded-tl-3xl',
                    otherAbove && otherRight && 'rounded-tr-3xl',
                    otherBelow && otherLeft && 'rounded-bl-3xl',
                    otherBelow && otherRight && 'rounded-br-3xl'
                  )}
                >
                  {day.endsWith('-01') && (
                    <span className="border-foreground/30 bg-background absolute top-0.5 left-1/2 z-10 -translate-x-1/2 rounded-full border px-3 text-sm leading-4">
                      {MONTH_SHORT[month - 1]}
                    </span>
                  )}
                  <DayPill
                    day={day}
                    weekday={dayOfWeekOf(day).slice(0, 2)}
                    selected={day === date}
                    isToday={day === today}
                    percent={kcalPercent(days[day], today)}
                    onSelect={onSelect}
                  />
                </div>
              )
            })}
          </li>
        ))}
      </ol>
    </div>
  )
}
