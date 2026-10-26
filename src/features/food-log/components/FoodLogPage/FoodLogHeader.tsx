'use client'

import { EllipsisVertical, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { Button } from '@/components/ui/button'
import { routePath } from '@/config/route-path'
import { relativeDayLabel } from '@/lib/week'
import { cn } from '@/lib/utils'
import type { FoodLogSettings } from '../../food-log-settings'
import type { ShownTotals, WeekDay } from '../../types/food-log.types'
import { UNVERIFIED_TARGET_NOTE } from '@/features/nutrition/target-provenance'
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

const CIRCLE =
  'bg-foreground/12 active:bg-foreground/20 focus-visible:ring-ring/50 size-11 rounded-full p-0 transition-colors focus-visible:ring-1'

interface FoodLogHeaderProps {
  readonly date: string
  readonly today: string | null
  readonly onDateChange: (date: string) => void
  readonly totals: ShownTotals
  /** Ngày có số nhập tay (BE `hasOverride`): chú thích nhỏ "Manual entry · Food Log N kcal" dưới tóm tắt macro; null = không có override. */
  readonly overrideCaption?: string | null
  readonly target: ProgramWeek | null
  /** BE đánh dấu target của ngày LEGACY_UNVERIFIED: `target` đã bỏ (không đạt / không đạt), hiện câu "Historical target not verified". */
  readonly targetUnverified?: boolean
  readonly showOverages: boolean
  /** Nhật ký của ngày chưa về: tóm tắt macro hiện khung xám. */
  readonly summaryPending: boolean
  /** Calendar Week Banner: Show và ShowAndPin = luôn hiện, Hide = ẩn thanh tuần. */
  readonly weekBanner: FoodLogSettings['weekBanner']
  readonly calendarScrolling: FoodLogSettings['calendarScrolling']
  /** Tổng theo ngày cho vòng kcal của thanh tuần và báo tuần đang thấy để tải thêm. */
  readonly weekDays: Readonly<Record<string, WeekDay>>
  readonly onWeeksView: (weekStarts: readonly string[]) => void
  /** Lịch cuộn đang mở: ẩn thanh tuần và macro, nút lịch sáng trắng. */
  readonly calendarOpen: boolean
  readonly onCalendarToggle: () => void
  /** Mở bảng More (Nutrition Overview, Copy Day, Clear Day, đánh dấu ngày…). */
  readonly onMore: () => void
}

/**
 * Đầu trang Food Log kiểu MacroFactor, dính trên cùng: tiêu đề ngày (chữ hoa rộng) + ba nút tròn (lịch, tuỳ chỉnh, menu),
 * thanh tuần Mo→Su và tóm tắt macro vuốt 2 trang. Không bao giờ co lại khi cuộn; chỉ lịch mở (calendarOpen) mới ẩn thanh tuần và macro.
 */
export function FoodLogHeader({
  date,
  today,
  onDateChange,
  totals,
  overrideCaption = null,
  target,
  targetUnverified = false,
  showOverages,
  summaryPending,
  weekBanner,
  calendarScrolling,
  weekDays,
  onWeeksView,
  calendarOpen,
  onCalendarToggle,
  onMore,
}: FoodLogHeaderProps) {
  const stripShown = weekBanner !== 'Hide'
  return (
    <header className="bg-card sticky top-0 z-30 px-4 pb-3 max-md:-mx-4 max-md:-mt-[calc(env(safe-area-inset-top)+1.25rem)] max-md:pt-[calc(env(safe-area-inset-top)+0.75rem)] md:rounded-2xl md:pt-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl leading-tight font-extrabold tracking-wide uppercase [font-stretch:125%] max-[359px]:text-2xl">
          {relativeDayLabel(date, today)}
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
          <Button variant="ghost" aria-label="More options" className={CIRCLE} onClick={onMore}>
            <EllipsisVertical aria-hidden="true" className="size-5" />
          </Button>
        </div>
      </div>

      {stripShown && (
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
            calendarOpen ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
          )}
        >
          <div className="overflow-hidden" inert={calendarOpen}>
            <div className="pt-3">
              <WeekStrip
                date={date}
                today={today}
                onSelect={onDateChange}
                scrolling={calendarScrolling}
                days={weekDays}
                onWeeksView={onWeeksView}
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
            <MacroSummary
              date={date}
              totals={totals}
              target={target}
              showOverages={showOverages}
              pending={summaryPending}
            />
            {overrideCaption && !summaryPending && (
              <p className="text-muted-foreground pt-2 text-center text-xs">{overrideCaption}</p>
            )}
            {targetUnverified && !summaryPending && (
              <p className="text-muted-foreground pt-2 text-center text-xs">
                {UNVERIFIED_TARGET_NOTE}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
