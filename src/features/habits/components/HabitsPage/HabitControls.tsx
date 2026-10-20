'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MONTH_NAMES } from '../../habits.utils'

/** Số năm hiện trong ô chọn năm (năm nay lùi lại). */
const YEARS_BACK = 5

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
  'bg-secondary h-12 w-auto gap-2 rounded-full border-0 px-5 text-base shadow-none data-[size=default]:h-12'

/** Hàng điều khiển dưới lịch: ‹ › đổi tháng, ô chọn tháng (tên đầy đủ tiếng Anh) và ô chọn năm. */
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
  const years = Array.from({ length: YEARS_BACK }, (_, offset) => currentYear - offset)
  // Năm hiện tại: chỉ chọn được các tháng tới hết tháng này
  const lastMonth = year === currentYear ? currentMonth : 11

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
        <Select value={String(month)} onValueChange={(next) => onChange(year, Number(next))}>
          <SelectTrigger aria-label="Month" className={TRIGGER}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.slice(0, lastMonth + 1).map((name, value) => (
              <SelectItem key={name} value={String(value)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(year)}
          onValueChange={(next) => {
            const nextYear = Number(next)
            onChange(nextYear, nextYear === currentYear ? Math.min(month, currentMonth) : month)
          }}
        >
          <SelectTrigger aria-label="Year" className={TRIGGER}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
