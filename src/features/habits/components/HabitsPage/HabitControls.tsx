'use client'

import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { MonthYearPickerSheet } from '@/components/shared/MonthYearPickerSheet'
import { MONTH_NAMES } from '@/lib/date'

interface HabitControlsProps {
  readonly year: number
  /** Tháng 0–11. */
  readonly month: number
  /** Tháng/năm của hôm nay: không cho đi tới tháng chưa tới. */
  readonly currentYear: number
  readonly currentMonth: number
  readonly onChange: (year: number, month: number) => void
}

const TRIGGER =
  'bg-secondary active:bg-secondary/70 focus-visible:ring-ring/50 flex h-12 items-center gap-2 rounded-full px-5 text-base tabular-nums transition-colors focus-visible:ring-1 focus-visible:outline-none'

/**
 * Hàng điều khiển dưới lịch: ‹ › đổi tháng, nút tháng (tên đầy đủ tiếng Anh) và nút năm; hai nút mở bảng Select Month /
 * Select Year kiểu MacroFactor (`MonthYearPickerSheet`), không dùng dropdown.
 */
export function HabitControls({
  year,
  month,
  currentYear,
  currentMonth,
  onChange,
}: HabitControlsProps) {
  const index = year * 12 + month
  const limit = currentYear * 12 + currentMonth
  const go = (delta: number) => {
    const next = index + delta
    onChange(Math.floor(next / 12), next % 12)
  }
  const [picker, setPicker] = useState<{ mode: 'month' | 'year'; open: boolean }>({
    mode: 'month',
    open: false,
  })

  return (
    <div className="flex items-center gap-2">
      <div className="bg-secondary flex h-12 shrink-0 items-center rounded-full px-1">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => go(-1)}
          className="focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full transition-transform focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          disabled={index >= limit}
          onClick={() => go(1)}
          className="focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full transition-[transform,opacity] focus-visible:ring-1 focus-visible:outline-none active:scale-90 disabled:opacity-30 motion-reduce:active:scale-100"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="flex min-w-0 flex-1 justify-end gap-2">
        {(['month', 'year'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-haspopup="dialog"
            aria-label={mode === 'month' ? `Month, ${MONTH_NAMES[month]}` : `Year, ${year}`}
            onClick={() => setPicker({ mode, open: true })}
            className={TRIGGER}
          >
            {mode === 'month' ? MONTH_NAMES[month] : year}
            <ChevronDown aria-hidden="true" className="text-muted-foreground size-4" />
          </button>
        ))}
      </div>
      <MonthYearPickerSheet
        open={picker.open}
        onOpenChange={(open) => setPicker((current) => ({ ...current, open }))}
        mode={picker.mode}
        year={year}
        month={month}
        todayYear={currentYear}
        todayMonth={currentMonth}
        onSelect={onChange}
      />
    </div>
  )
}
