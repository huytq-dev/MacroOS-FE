'use client'

import { useEffect, useRef } from 'react'
import { addDaysIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { DayPill, WEEKDAYS, mondayOf } from './WeekStrip'

/** Số tuần hiển thị trước/sau tuần hiện tại. */
const WEEKS_EACH_SIDE = 26
const COLUMNS = 7

interface CalendarSheetProps {
  readonly date: string
  readonly today: string | null
  readonly onSelect: (date: string) => void
}

const monthName = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })

/** Số tháng (1–12) của ngày iso; tháng chẵn nền sáng, tháng lẻ nền tối nên ranh giới tháng hiện rõ như MacroFactor. */
const monthOf = (iso: string) => Number(iso.slice(5, 7))

/**
 * Lịch cuộn theo tuần phủ kín phần dưới header: mỗi hàng là một tuần Mo→Su (±26 tuần quanh hôm nay), mở ra thì tuần của ngày
 * đang chọn nằm ở đầu. Mỗi tháng là một mảng nền riêng (xen kẽ sáng/tối, góc bo ở chỗ đổi tháng) và nhãn tháng nằm trên ngày
 * mùng 1. Chọn một ngày thì chuyển ngày và đóng lịch (trang cha lo phần đóng).
 */
export function CalendarSheet({ date, today, onSelect }: CalendarSheetProps) {
  const selectedRow = useRef<HTMLLIElement>(null)
  const anchor = mondayOf(today ?? date)
  const weeks = Array.from({ length: WEEKS_EACH_SIDE * 2 + 1 }, (_, index) =>
    addDaysIso(anchor, (index - WEEKS_EACH_SIDE) * 7)
  )
  const selectedWeek = mondayOf(date)

  useEffect(() => {
    selectedRow.current?.scrollIntoView({ block: 'start' })
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
      className="bg-background motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.25rem)] bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 overflow-y-auto overscroll-contain motion-safe:duration-200"
    >
      <ol>
        {weeks.map((monday) => (
          <li
            key={monday}
            ref={monday === selectedWeek ? selectedRow : undefined}
            className="grid grid-cols-7"
          >
            {WEEKDAYS.map((weekday, column) => {
              const day = addDaysIso(monday, column)
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
                      {monthName(day)}
                    </span>
                  )}
                  <DayPill
                    day={day}
                    weekday={weekday}
                    selected={day === date}
                    isToday={day === today}
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
