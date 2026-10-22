'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { monthGrid } from '@/features/habits/habits.utils'
import { useUnits } from '@/features/users/hooks/use-units'
import { MONTH_NAMES } from '@/lib/date'
import { dayLetterOfDate, formatLongDate } from '@/lib/week'
import { cn } from '@/lib/utils'

const NAV =
  'focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full transition-transform focus-visible:ring-1 focus-visible:outline-none active:scale-90 disabled:opacity-30 motion-reduce:active:scale-100'

interface SelectDateSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Ngày đang chọn (yyyy-MM-dd): vòng tròn trắng; cũng là tháng mở sẵn. */
  readonly value: string
  /** Hôm nay: ngày sau đó mờ và không chọn được. */
  readonly today: string
  readonly onSelect: (date: string) => void
  /** Thêm điều kiện chọn được (vd. chỉ ngày có dữ liệu); ngày tương lai luôn tắt. */
  readonly isDateEnabled?: (iso: string) => boolean
}

const monthOf = (iso: string) => {
  const [year, month] = iso.split('-').map(Number)
  return { year, month: month - 1 }
}

/** Bảng "Select Date" kiểu MacroFactor: lưới tháng bắt đầu từ ngày đầu tuần của user, ‹ › đổi tháng, ngày tương lai tắt, "Go to Today". */
export function SelectDateSheet({
  open,
  onOpenChange,
  value,
  today,
  onSelect,
  isDateEnabled,
}: SelectDateSheetProps) {
  const [view, setView] = useState(() => monthOf(value))
  const { weekStartDay } = useUnits()
  const grid = monthGrid(view.year, view.month, weekStartDay)
  const current = monthOf(today)
  const atLatest = view.year === current.year && view.month === current.month
  const go = (delta: number) =>
    setView(({ year, month }) => {
      const next = year * 12 + month + delta
      return { year: Math.floor(next / 12), month: next % 12 }
    })
  const pick = (date: string) => {
    onSelect(date)
    onOpenChange(false)
  }

  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="Select Date" showDone={false}>
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl">
            {MONTH_NAMES[view.month]} {view.year}
          </h3>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => go(-1)}
              className={NAV}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              disabled={atLatest}
              onClick={() => go(1)}
              className={NAV}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>

        <div
          key={`${view.year}-${view.month}`}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-200"
        >
          <div className="text-muted-foreground mb-1 grid grid-cols-7 text-center text-base">
            {grid.slice(0, 7).map(({ iso }) => (
              <span key={iso}>{dayLetterOfDate(iso)}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {grid.map(({ iso, day, inMonth }) => {
              const isDisabled = iso > today || (isDateEnabled ? !isDateEnabled(iso) : false)
              const isSelected = iso === value
              return (
                <div key={iso} className="flex justify-center">
                  <button
                    type="button"
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                    aria-label={formatLongDate(iso)}
                    onClick={() => pick(iso)}
                    className={cn(
                      'focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full text-lg tabular-nums transition-[background-color,color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-90 disabled:active:scale-100 motion-reduce:active:scale-100',
                      (!inMonth || isDisabled) && 'text-muted-foreground/40',
                      isSelected && 'bg-foreground text-background font-medium'
                    )}
                  >
                    {day}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => pick(today)}
          className="bg-secondary active:bg-secondary/70 focus-visible:ring-ring/50 h-12 w-full rounded-lg text-lg transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          Go to Today
        </button>
      </div>
    </SheetFrame>
  )
}
