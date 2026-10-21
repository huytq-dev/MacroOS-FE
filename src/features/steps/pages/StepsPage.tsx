'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { StepsChart } from '../components/StepsChart'
import { StepsHistoryList } from '../components/StepsHistoryList'
import { useDeleteSteps, useStepsHistory, useUpsertSteps } from '../hooks/use-steps'
import {
  averageSteps,
  formatSteps,
  stepsValueSchema,
  summarizeSteps,
  type StepsDay,
} from '../steps.utils'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import {
  CollapseChartIcon,
  DETAIL_CARD,
  ExpandChartIcon,
  MetricRow,
  RangeBar,
  StatBlock,
} from '@/features/dashboard/components/DetailPage'
import { daysBetween, slotsOf, viewWindow } from '@/features/dashboard/chart/geometry'
import { useChartPan } from '@/features/dashboard/chart/use-chart-pan'
import { useTween } from '@/features/dashboard/chart/use-tween'
import {
  rangeLabel,
  shortDay,
  type Averaging,
  type RangeKey,
} from '@/features/dashboard/expenditure.utils'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { MetricEntrySheet } from '@/features/weight/components/BodyMetricPage'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsClient } from '@/hooks/use-is-client'
import { addDaysIso, formatDate, todayIso } from '@/lib/date'
import { cn } from '@/lib/utils'

/**
 * Trang Steps (bấm ô Steps ở Dashboard): Average / Total của khoảng đang xem, biểu đồ cột mỗi ngày KÉO NGANG được, chọn kỳ 1W…All và
 * D/W/M (đổi kỳ thì biểu đồ giãn / co mượt), nút phóng to, Insights (trung bình 7 / 30 ngày, ngày nhiều nhất) và lịch sử theo tháng;
 * dấu + hoặc bút chì mở bảng nhập (Select Date, số nguyên ≥ 0, thùng rác khi đang sửa). Bản ghi cùng ngày được ghi đè.
 */
export function StepsPage() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const history = useStepsHistory(today)
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const [expanded, setExpanded] = useState(false)
  // Ngày giữ nguyên khi đóng để bảng không đổi nội dung lúc đang trượt xuống
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmDate, setConfirmDate] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const upsert = useUpsertSteps()
  const remove = useDeleteSteps()

  const items = history.data?.items ?? []
  const days: StepsDay[] = [...items]
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .map((item) => ({ date: item.logDate, steps: item.steps }))
  const total = today && days.length > 0 ? daysBetween(days[0].date, today) + 1 : 0
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const height = useTween(expanded ? 460 : 300)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })
  const entry = items.find((item) => item.logDate === sheetDate)

  const openSheet = (date: string) => {
    setSaveError(null)
    setSheetDate(date)
    setSheetOpen(true)
  }

  const header = (
    <SubPageHeader
      title="Steps"
      action={
        <IconButton
          icon={Plus}
          label="Add steps"
          className="size-11"
          onClick={() => today && openSheet(today)}
        />
      }
    />
  )

  if (history.isError)
    return <ErrorState error={history.error} onRetry={() => void history.refetch()} />

  if (!today || history.isLoading)
    return (
      <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5">
        {header}
        <Skeleton className="h-24 rounded-xl" aria-busy="true" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-12 rounded-full" />
      </div>
    )

  const win = viewWindow(today, target, pan.view.snapped)
  const inView = days.filter((day) => day.date >= win.from && day.date <= win.to)
  const { average, total: sum } = summarizeSteps(inView)
  const last30 = summarizeSteps(days.filter((day) => day.date > addDaysIso(today, -30)))
  const best = days.reduce<StepsDay | null>(
    (top, day) => (top === null || day.steps > top.steps ? day : top),
    null
  )
  const last7 = history.data?.last7DayAverage ?? null

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 md:pb-0">
      {header}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-6">
          <StatBlock
            label="Avg / Day"
            value={average === null ? null : formatSteps(average)}
            unit=""
          />
          <StatBlock label="Total" value={sum === null ? null : formatSteps(sum)} unit="" />
        </div>
        <IconButton
          icon={expanded ? CollapseChartIcon : ExpandChartIcon}
          label={expanded ? 'Shrink chart' : 'Expand chart'}
          variant="secondary"
          aria-pressed={expanded}
          className={cn(
            'size-14 shrink-0 rounded-full transition-colors duration-200',
            expanded && 'bg-foreground text-background hover:bg-foreground/90'
          )}
          onClick={() => setExpanded((value) => !value)}
        />
      </div>
      <p className="text-muted-foreground -mt-4 text-lg">{rangeLabel(win.from, win.to)}</p>

      <StepsChart
        // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
        key={averaging}
        className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
        days={averageSteps(days, averaging)}
        today={today}
        slots={slots}
        pos={pan.view.pos}
        height={height}
        pan={pan}
      />
      <RangeBar
        range={range}
        onRangeChange={setRange}
        averaging={averaging}
        onAveragingChange={setAveraging}
      />

      {days.length === 0 && (
        <p className="bg-card text-muted-foreground rounded-xl p-4 text-base">
          No steps logged yet. Tap + to add today&apos;s steps.
        </p>
      )}

      {!expanded && days.length > 0 && (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:animation-duration-300 flex flex-col gap-5">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Insights & Data</h2>
            <section aria-label="Steps insights" className={`${DETAIL_CARD} space-y-5 p-4`}>
              <MetricRow
                value={last7 === null ? '---' : formatSteps(Math.round(last7))}
                unit="steps"
                title="7-Day Average"
                text="Average steps per logged day over the last 7 days."
              />
              <MetricRow
                value={last30.average === null ? '---' : formatSteps(last30.average)}
                unit="steps"
                title="30-Day Average"
                text="Average steps per logged day over the last 30 days."
              />
              {best && (
                <MetricRow
                  value={formatSteps(best.steps)}
                  unit="steps"
                  title="Best Day"
                  text={`Your highest day so far, ${shortDay(best.date)}.`}
                />
              )}
            </section>
          </div>
          <StepsHistoryList days={days} onEdit={openSheet} />
        </div>
      )}

      <MetricEntrySheet
        key={`${sheetDate}-${history.dataUpdatedAt}`}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        metric="Steps"
        date={sheetDate ?? today}
        today={today}
        onDateChange={openSheet}
        integer
        fields={[
          {
            key: 'steps',
            label: 'Steps',
            unit: 'steps',
            initial: entry?.steps ?? null,
            schema: stepsValueSchema,
          },
        ]}
        onDelete={entry ? () => setConfirmDate(entry.logDate) : undefined}
        isPending={upsert.isPending}
        error={saveError}
        onSave={(values) =>
          sheetDate &&
          values.steps !== null &&
          upsert.mutate(
            { logDate: sheetDate, steps: values.steps },
            {
              onSuccess: () => setSheetOpen(false),
              onError: (error) => setSaveError(getFormErrorMessage(error)),
            }
          )
        }
      />

      <ConfirmDialog
        open={confirmDate !== null}
        onOpenChange={(open) => !open && setConfirmDate(null)}
        title="Delete this day's steps?"
        description={confirmDate ? `Delete the steps logged on ${formatDate(confirmDate)}.` : ''}
        confirmLabel="Delete steps"
        pendingLabel="Deleting..."
        isPending={remove.isPending}
        onConfirm={() =>
          confirmDate &&
          remove.mutate(confirmDate, {
            onSuccess: () => {
              setConfirmDate(null)
              setSheetOpen(false)
            },
          })
        }
      />
    </div>
  )
}
