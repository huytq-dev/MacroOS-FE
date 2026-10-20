'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { cn } from '@/lib/utils'

const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleDateString('en-US', { month: 'short' })
)

/** Ô năm hiện 12 năm: thập kỷ đang xem + 2 năm đầu thập kỷ sau (như MacroFactor). */
const YEAR_CELLS = 12

const CELL =
  'focus-visible:ring-ring/50 flex h-11 w-full items-center justify-center rounded-full text-[15px] tabular-nums transition-colors duration-200 focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none'

interface MonthYearPickerSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly mode: 'month' | 'year'
  readonly year: number
  /** Tháng 0–11. */
  readonly month: number
  /** Hôm nay: tháng/năm sau đó bị mờ, không chọn được; "Go to Today" nhảy về đây. */
  readonly todayYear: number
  readonly todayMonth: number
  /** Chọn xong bảng tự đóng; đổi năm thì tháng bị chặn ở tháng hiện tại nếu vượt quá. */
  readonly onSelect: (year: number, month: number) => void
}

/**
 * Bảng chọn tháng / năm kiểu MacroFactor (thay dropdown): "Select Month" = nhãn năm + lưới 3×4 Jan…Dec, "Select Year" =
 * "2020 - 2029" có ‹ › lật thập kỷ (lưới trượt 300ms) + lưới 3 cột 12 năm (năm ngoài thập kỷ mờ). Ô đang chọn là viên trắng,
 * tương lai mờ và tắt; nút "Go to Today" xám rộng ở đáy.
 */
export function MonthYearPickerSheet({
  open,
  onOpenChange,
  mode,
  year,
  month,
  todayYear,
  todayMonth,
  onSelect,
}: MonthYearPickerSheetProps) {
  const pick = (nextYear: number, nextMonth: number) => {
    onSelect(nextYear, nextYear === todayYear ? Math.min(nextMonth, todayMonth) : nextMonth)
    onOpenChange(false)
  }
  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'month' ? 'Select Month' : 'Select Year'}
      showDone={false}
    >
      <div className="px-4 pt-4">
        {mode === 'month' ? (
          <>
            <p className="text-muted-foreground px-2 text-lg tabular-nums">{year}</p>
            <div
              role="radiogroup"
              aria-label={`Months of ${year}`}
              className="grid grid-cols-3 gap-x-3 gap-y-4 py-6"
            >
              {MONTHS.map((label, index) => {
                const selected = index === month
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={year * 12 + index > todayYear * 12 + todayMonth}
                    onClick={() => pick(year, index)}
                    className={cn(
                      CELL,
                      selected ? 'bg-foreground text-background' : 'disabled:text-foreground/25'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <YearGrid year={year} todayYear={todayYear} onPick={(next) => pick(next, month)} />
        )}
      </div>
      <div className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => pick(todayYear, todayMonth)}
          className="bg-secondary active:bg-secondary/70 focus-visible:ring-ring/50 h-12 w-full rounded-lg text-lg transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          Go to Today
        </button>
      </div>
    </SheetFrame>
  )
}

interface YearGridProps {
  readonly year: number
  readonly todayYear: number
  readonly onPick: (year: number) => void
}

/** Lưới năm theo thập kỷ; nằm trong nội dung bảng nên mỗi lần mở bảng lại bắt đầu ở thập kỷ của năm đang chọn. */
function YearGrid({ year, todayYear, onPick }: YearGridProps) {
  const [decade, setDecade] = useState(Math.floor(year / 10) * 10)
  const [direction, setDirection] = useState<'back' | 'forward' | null>(null)
  const page = (step: -1 | 1) => {
    setDirection(step < 0 ? 'back' : 'forward')
    setDecade((current) => current + step * 10)
  }
  const pager =
    'focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full transition-opacity focus-visible:ring-1 focus-visible:outline-none disabled:opacity-30'
  return (
    <>
      <div className="flex items-center justify-between pl-2">
        <p className="text-muted-foreground text-lg tabular-nums" aria-live="polite">
          {decade} - {decade + 9}
        </p>
        <div className="flex">
          <button
            type="button"
            aria-label="Previous decade"
            onClick={() => page(-1)}
            className={pager}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next decade"
            disabled={decade + 10 > todayYear}
            onClick={() => page(1)}
            className={pager}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
      <div className="overflow-hidden">
        <div
          key={decade}
          role="radiogroup"
          aria-label={`Years ${decade} to ${decade + 9}`}
          className={cn(
            'grid grid-cols-3 gap-x-3 gap-y-4 py-6 motion-safe:duration-300',
            direction && 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:ease-out',
            direction === 'forward' && 'motion-safe:slide-in-from-right-8',
            direction === 'back' && 'motion-safe:slide-in-from-left-8'
          )}
        >
          {Array.from({ length: YEAR_CELLS }, (_, index) => {
            const value = decade + index
            const selected = value === year
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={value > todayYear}
                onClick={() => onPick(value)}
                className={cn(
                  CELL,
                  selected
                    ? 'bg-foreground text-background'
                    : index >= 10
                      ? 'text-foreground/40 disabled:text-foreground/25'
                      : 'disabled:text-foreground/25'
                )}
              >
                {value}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
