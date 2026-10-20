'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { MONTH_NAMES, monthGrid } from '@/features/habits/habits.utils'
import { addDaysIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { SlidingSwitch } from './SlidingSwitch'

type PickMode = 'dates' | 'ranges'

const MODES = [
  { value: 'dates', label: 'Dates' },
  { value: 'ranges', label: 'Ranges' },
] as const

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const
/** Giới hạn số ngày một lần dán (khoảng chọn dài hơn bị cắt). */
const MAX_DATES = 62

/** Các ngày từ `start` tới `end` (gồm cả hai đầu), thứ tự tăng dần. */
const spanOf = (start: string, end: string) => {
  const [from, to] = start <= end ? [start, end] : [end, start]
  const days: string[] = []
  for (let day = from; day <= to && days.length < MAX_DATES; day = addDaysIso(day, 1))
    days.push(day)
  return days
}

interface SelectDatesSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Hôm nay (yyyy-MM-dd): vòng tròn viền; cũng là tháng mở sẵn. */
  readonly today: string
  readonly isPending: boolean
  /** "Paste to Dates": danh sách ngày đã chọn, tăng dần. */
  readonly onConfirm: (dates: string[]) => void
}

/**
 * Bảng "Select Dates" của Copy → To Dates (kiểu MacroFactor): công tắc Dates | Ranges, lịch tháng M → S với ‹ ›, nút trắng
 * "Paste to Dates". Dates: bấm để chọn / bỏ nhiều ngày; Ranges: bấm ngày đầu rồi ngày cuối, đoạn giữa tô nền nhạt (bấm lần
 * thứ ba bắt đầu đoạn mới). Mount mới mỗi lần mở (parent chỉ render khi mở).
 */
export function SelectDatesSheet({
  open,
  onOpenChange,
  today,
  isPending,
  onConfirm,
}: SelectDatesSheetProps) {
  const [mode, setMode] = useState<PickMode>('dates')
  const [picked, setPicked] = useState<readonly string[]>([])
  const [range, setRange] = useState<{ start: string; end: string | null } | null>(null)
  const [view, setView] = useState({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)) - 1,
  })
  const grid = monthGrid(view.year, view.month)

  const selected =
    mode === 'dates'
      ? [...picked].sort()
      : range
        ? range.end
          ? spanOf(range.start, range.end)
          : [range.start]
        : []
  const chosen = new Set(selected)
  const edges = range?.end ? [range.start, range.end].sort() : range ? [range.start] : []

  const tap = (iso: string) => {
    if (mode === 'dates')
      setPicked((current) =>
        current.includes(iso) ? current.filter((day) => day !== iso) : [...current, iso]
      )
    else if (!range || range.end) setRange({ start: iso, end: null })
    else setRange({ start: range.start, end: iso })
  }
  const go = (delta: number) =>
    setView(({ year, month }) => {
      const next = year * 12 + month + delta
      return { year: Math.floor(next / 12), month: next % 12 }
    })

  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="Select Dates" showDone={false} tall>
      <div className="flex min-h-full flex-col gap-5 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Selection Mode</h2>
          <SlidingSwitch
            options={MODES}
            value={mode}
            onChange={setMode}
            label="Selection mode"
            className="bg-secondary"
          />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-xl">
            {MONTH_NAMES[view.month]} {view.year}
          </h3>
          <div className="flex gap-1">
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
              onClick={() => go(1)}
              className="focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full transition-transform focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
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
            {WEEKDAY_INITIALS.map((initial, index) => (
              <span key={index}>{initial}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {grid.map(({ iso, day, inMonth }) => {
              const isChosen = chosen.has(iso)
              const isEdge = mode === 'ranges' ? edges.includes(iso) : isChosen
              const between = mode === 'ranges' && isChosen && !edges.includes(iso)
              const bandStart = mode === 'ranges' && edges.length === 2 && iso === edges[0]
              const bandEnd = mode === 'ranges' && edges.length === 2 && iso === edges[1]
              return (
                <div key={iso} className="relative flex justify-center">
                  {(between || bandStart || bandEnd) && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'bg-foreground/15 absolute inset-y-0.5',
                        between && 'inset-x-0',
                        bandStart && 'right-0 left-1/2',
                        bandEnd && 'right-1/2 left-0'
                      )}
                    />
                  )}
                  <button
                    type="button"
                    aria-pressed={isChosen}
                    aria-label={new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                    onClick={() => tap(iso)}
                    className={cn(
                      'focus-visible:ring-ring/50 relative flex size-11 items-center justify-center rounded-full text-lg tabular-nums transition-[background-color,color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100',
                      !inMonth && 'text-muted-foreground/40',
                      isEdge && 'bg-foreground text-background font-medium',
                      !isEdge && iso === today && 'ring-foreground ring-2'
                    )}
                  >
                    {day}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-auto">
          <Button
            className="bg-foreground text-background h-14 w-full rounded-lg text-base"
            disabled={selected.length === 0 || isPending}
            aria-busy={isPending}
            onClick={() => onConfirm(selected)}
          >
            {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            Paste to Dates
          </Button>
        </div>
      </div>
    </SheetFrame>
  )
}
