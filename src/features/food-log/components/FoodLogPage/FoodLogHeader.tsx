'use client'

import { Check, Copy, EllipsisVertical, SlidersHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { routePath } from '@/config/route-path'
import { useScrolledPast } from '@/hooks/use-scrolled-past'
import { addDaysIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { FoodLogSettings } from '../../food-log-settings'
import type { DayStatus, MacroTotals } from '../../types/food-log.types'
import { MacroSummary } from './MacroSummary'
import { WeekStrip } from './WeekStrip'

/** Biểu tượng lịch: viền khi đóng, khối đặc có ô ngày khoét ra khi lịch đang mở (như MacroFactor). */
function CalendarIcon({ filled }: { readonly filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-6"
    >
      {filled ? (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="currentColor" />
          <rect x="7" y="12.5" width="5" height="5" rx="1" className="stroke-foreground" />
        </>
      ) : (
        <>
          <rect x="4" y="5" width="16" height="15" rx="3" />
          <path d="M4 10.5h16" />
        </>
      )}
      <path d="M8.5 3v3.5M15.5 3v3.5" />
    </svg>
  )
}

const MARKS = [
  ['Complete', 'Mark as Complete'],
  ['Partial', 'Mark as Partial'],
  ['Fasting', 'Mark as Fasting'],
] as const

const CIRCLE =
  'bg-foreground/12 active:bg-foreground/20 focus-visible:ring-ring/50 size-11 rounded-full p-0 transition-colors focus-visible:ring-1'
/** Chiều cao thanh tuần khi mở (khoảng cách 0.75rem + viên thuốc 3.75rem): bù vào margin để nội dung không giật khi co lại. */
const STRIP_FOOTPRINT = 'mb-[4.5rem]'

interface FoodLogHeaderProps {
  readonly date: string
  readonly today: string | null
  readonly onDateChange: (date: string) => void
  readonly totals: MacroTotals
  readonly target: ProgramWeek | null
  readonly showOverages: boolean
  /** Calendar Week Banner: show = thanh tuần co lại khi cuộn, pin = luôn ghim, hide = ẩn. */
  readonly weekBanner: FoodLogSettings['weekBanner']
  readonly calendarScrolling: FoodLogSettings['calendarScrolling']
  /** Lịch cuộn đang mở: ẩn thanh tuần và macro, nút lịch sáng trắng. */
  readonly calendarOpen: boolean
  readonly onCalendarToggle: () => void
  readonly status: DayStatus
  readonly onStatusChange: (status: DayStatus) => void
  readonly hasEntries: boolean
  readonly onCopy: () => void
  readonly onClear: () => void
}

/** "Today" / "Yesterday" / "Tomorrow", ngày khác là "Thu, Oct 15" (hiện in hoa nhờ CSS). */
const titleOf = (date: string, today: string | null) => {
  if (date === today) return 'Today'
  if (today && date === addDaysIso(today, -1)) return 'Yesterday'
  if (today && date === addDaysIso(today, 1)) return 'Tomorrow'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Đầu trang Food Log kiểu MacroFactor, dính trên cùng: tiêu đề ngày (chữ hoa rộng) + ba nút tròn (lịch, tuỳ chỉnh, menu),
 * thanh tuần Mo→Su và tóm tắt macro vuốt 2 trang. Cuộn xuống thì thanh tuần co lại (chỉ còn tiêu đề + macro), cuộn lên mở ra.
 */
export function FoodLogHeader({
  date,
  today,
  onDateChange,
  totals,
  target,
  showOverages,
  weekBanner,
  calendarScrolling,
  calendarOpen,
  onCalendarToggle,
  status,
  onStatusChange,
  hasEntries,
  onCopy,
  onClear,
}: FoodLogHeaderProps) {
  const scrolled = useScrolledPast(90, 30)
  const stripShown = weekBanner !== 'Hide'
  const scrollCollapses = scrolled && weekBanner === 'Show'
  const collapsed = scrollCollapses || calendarOpen
  return (
    <header
      className={cn(
        'bg-card sticky top-0 z-30 px-4 pb-3 transition-[margin] duration-300 max-md:-mx-4 max-md:-mt-[calc(env(safe-area-inset-top)+1.25rem)] max-md:pt-[calc(env(safe-area-inset-top)+0.75rem)] md:rounded-2xl md:pt-4',
        scrollCollapses && !calendarOpen && STRIP_FOOTPRINT
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl leading-tight font-extrabold tracking-wide uppercase [font-stretch:125%]">
          {titleOf(date, today)}
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            aria-label="Calendar"
            aria-expanded={calendarOpen}
            className={cn(
              CIRCLE,
              calendarOpen && 'bg-foreground text-background active:bg-foreground/90'
            )}
            onClick={onCalendarToggle}
          >
            <CalendarIcon filled={calendarOpen} />
          </Button>
          <Button asChild variant="ghost" className={CIRCLE}>
            <Link href={routePath.foodLogSettings} aria-label="Customize food log">
              <SlidersHorizontal aria-hidden="true" className="size-5" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" aria-label="More options" className={CIRCLE}>
                <EllipsisVertical aria-hidden="true" className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6}>
              {MARKS.map(([value, label]) => (
                <DropdownMenuItem
                  key={value}
                  disabled={value === 'Fasting' && hasEntries}
                  onSelect={() => onStatusChange(value)}
                >
                  <Check className={status === value ? 'opacity-100' : 'opacity-0'} /> {label}
                </DropdownMenuItem>
              ))}
              {status !== 'Unmarked' && (
                <DropdownMenuItem onSelect={() => onStatusChange('Unmarked')}>
                  Remove mark
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!hasEntries} onSelect={onCopy}>
                <Copy /> Copy food log
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!hasEntries} onSelect={onClear}>
                <Trash2 /> Delete day&apos;s log
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {stripShown && (
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
            collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
          )}
        >
          <div className="overflow-hidden" inert={collapsed}>
            <div className="pt-3">
              <WeekStrip
                date={date}
                today={today}
                onSelect={onDateChange}
                scrolling={calendarScrolling}
              />
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
          calendarOpen ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        )}
      >
        <div className="overflow-hidden" inert={calendarOpen}>
          <div className="pt-3">
            <MacroSummary totals={totals} target={target} showOverages={showOverages} />
          </div>
        </div>
      </div>
    </header>
  )
}
