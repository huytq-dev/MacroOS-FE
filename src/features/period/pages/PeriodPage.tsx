'use client'

import { useState } from 'react'
import { PeriodDaySheet } from '../components/PeriodDaySheet'
import { PeriodHistoryList } from '../components/PeriodHistoryList'
import { usePeriodHistory, useSetPeriodDay } from '../hooks/use-period'
import { lastPeriodLength, periodDaySet, trackedDaysDesc } from '../period.utils'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { StatBlock } from '@/features/dashboard/components/DetailPage'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { HabitCalendar } from '@/features/habits/components/HabitsPage/HabitCalendar'
import { HabitControls } from '@/features/habits/components/HabitsPage/HabitControls'
import { HabitLegend } from '@/features/habits/components/HabitsPage/HabitSummary'
import { monthGrid } from '@/features/habits/habits.utils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsClient } from '@/hooks/use-is-client'
import { useSheet } from '@/hooks/use-sheet'
import { formatDate, todayIso } from '@/lib/date'

const TONE = 'border-mf-tile-protein'

interface View {
  readonly year: number
  readonly month: number
  readonly direction: 'next' | 'prev' | null
}

function PeriodContent({ today }: { readonly today: string }) {
  const history = usePeriodHistory(today)
  const setDay = useSetPeriodDay()
  const sheet = useSheet<string>()
  const [confirmDate, setConfirmDate] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const currentYear = Number(today.slice(0, 4))
  const currentMonth = Number(today.slice(5, 7)) - 1
  const [picked, setPicked] = useState<View | null>(null)
  const view = picked ?? { year: currentYear, month: currentMonth, direction: null }

  if (history.isError)
    return <ErrorState error={history.error} onRetry={() => void history.refetch()} />

  const tracked = periodDaySet(history.data?.items)
  const length = lastPeriodLength(history.data ?? undefined)

  const goTo = (year: number, month: number) =>
    setPicked({
      year,
      month,
      direction: year * 12 + month > view.year * 12 + view.month ? 'next' : 'prev',
    })
  const step = (direction: 'next' | 'prev') => {
    const index = view.year * 12 + view.month + (direction === 'next' ? 1 : -1)
    goTo(Math.floor(index / 12), index % 12)
  }

  const open = (date: string) => {
    setSaveError(null)
    sheet.show(date)
  }

  const save = (date: string, isOnPeriod: boolean) =>
    setDay.mutate(
      { date, isOnPeriod },
      {
        onSuccess: sheet.hide,
        onError: (error) => setSaveError(getFormErrorMessage(error)),
      }
    )

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 pb-24 md:pb-0">
      <SubPageHeader title="Period" />
      <StatBlock
        label="Last Period Duration"
        value={length === null ? null : String(length)}
        unit={length === 1 ? 'day' : 'days'}
      />
      {history.isLoading ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <HabitCalendar
          grid={monthGrid(view.year, view.month)}
          monthKey={`${view.year}-${view.month}`}
          direction={view.direction}
          tracked={tracked}
          today={today}
          trackedBorder={TONE}
          onSwipe={step}
          onSelect={open}
        />
      )}
      <HabitControls
        year={view.year}
        month={view.month}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onChange={goTo}
      />
      <HabitLegend trackedBorder={TONE} />
      <PeriodHistoryList days={trackedDaysDesc(tracked)} onEdit={open} />

      {sheet.value !== undefined && (
        <PeriodDaySheet
          key={`${sheet.id}-${history.dataUpdatedAt}`}
          open={sheet.open}
          onOpenChange={sheet.onOpenChange}
          date={sheet.value}
          tracked={tracked.has(sheet.value)}
          isPending={setDay.isPending}
          error={saveError}
          onSave={(isOnPeriod) => save(sheet.value as string, isOnPeriod)}
          onDelete={
            tracked.has(sheet.value) ? () => setConfirmDate(sheet.value as string) : undefined
          }
        />
      )}

      <ConfirmDialog
        open={confirmDate !== null}
        onOpenChange={(isOpen) => !isOpen && setConfirmDate(null)}
        title="Delete this period day?"
        description={confirmDate ? `Unmark ${formatDate(confirmDate)} as a period day.` : ''}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        isPending={setDay.isPending}
        onConfirm={() =>
          confirmDate &&
          setDay.mutate(
            { date: confirmDate, isOnPeriod: false },
            {
              onSuccess: () => {
                setConfirmDate(null)
                sheet.hide()
              },
            }
          )
        }
      />
    </div>
  )
}

/**
 * Trang Period (bấm ô Period ở Dashboard) kiểu MacroFactor: "Last Period Duration", lịch tháng (vuốt hoặc ‹ › / chọn tháng-năm đổi
 * tháng, ngày hành kinh viền hồng), chú giải Tracked / Untracked và lịch sử theo tháng. Bấm một ngày (hoặc bút chì ở lịch sử) mở bảng
 * "Are you on your period?" → BE đặt cờ của ngày đó; lịch, danh sách và ô Dashboard làm mới ngay. Ngày tương lai không bấm được.
 * "Hôm nay" chỉ tính sau khi mount (tránh lệch hydration).
 */
export function PeriodPage() {
  const isClient = useIsClient()
  if (!isClient)
    return (
      <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5" aria-busy="true">
        <SubPageHeader title="Period" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  return <PeriodContent today={todayIso()} />
}
