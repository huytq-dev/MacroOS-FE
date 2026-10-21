'use client'

import { useState } from 'react'
import { ChartColumn, Plus } from 'lucide-react'
import { StepsChart } from '../components/StepsChart'
import { StepsHistoryList } from '../components/StepsHistoryList'
import { STEPS_TUTORIAL } from '../components/steps-tutorial-steps'
import { useDeleteSteps, useStepsHistory, useUpsertSteps } from '../hooks/use-steps'
import {
  averageSteps,
  formatSteps,
  stepsValueSchema,
  summarizeSteps,
  type StepsDay,
} from '../steps.utils'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { RangeBar, StatBlock, TutorialCard } from '@/features/dashboard/components/DetailPage'
import { usePersistedChoice } from '@/features/dashboard/hooks/use-dashboard'
import { daysBetween, slotsOf, viewWindow } from '@/features/dashboard/chart/geometry'
import { useChartPan } from '@/features/dashboard/chart/use-chart-pan'
import {
  ExpandableChart,
  ExpandButton,
  ExpandFooter,
  useChartExpand,
} from '@/features/dashboard/chart/use-chart-expand'
import { useTween } from '@/features/dashboard/chart/use-tween'
import { rangeLabel, type Averaging, type RangeKey } from '@/features/dashboard/expenditure.utils'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { MetricEntrySheet } from '@/features/weight/components/BodyMetricPage'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsClient } from '@/hooks/use-is-client'
import { formatDate, todayIso } from '@/lib/date'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/**
 * Trang Steps (bấm ô Steps ở Dashboard) theo MacroFactor: "Average" (trung bình các ngày ĐÃ GHI trong khoảng đang kéo, "-- steps" khi
 * trống) + khoảng ngày + nút tròn phóng to, biểu đồ cột cam mỗi ngày KÉO NGANG được (trục nhỏ 0 / 2 / 4 khi trống, không chữ), chọn kỳ
 * 1W…All và D/W/M (đổi kỳ thì biểu đồ giãn / co mượt), thẻ chú giải "Steps", hướng dẫn 6 bước (Dismiss / Previous / Next / Done, ẩn
 * vĩnh viễn) và lịch sử theo tháng với biểu tượng nguồn; dấu + hoặc bút chì mở bảng nhập (Select Date, số nguyên ≥ 0, thùng rác khi
 * đang sửa). Bản ghi cùng ngày được ghi đè.
 */
export function StepsPage() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const history = useStepsHistory(today)
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const expand = useChartExpand()
  // Ngày giữ nguyên khi đóng để bảng không đổi nội dung lúc đang trượt xuống
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmDate, setConfirmDate] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [tutorial, setTutorial] = usePersistedChoice('steps.tutorial', 'show', TUTORIAL_CHOICES)
  const upsert = useUpsertSteps()
  const remove = useDeleteSteps()

  const items = history.data?.items ?? []
  const days: StepsDay[] = [...items]
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .map((item) => ({ date: item.logDate, steps: item.steps, source: item.source }))
  const total = today && days.length > 0 ? daysBetween(days[0].date, today) + 1 : 0
  const target = slotsOf(range, total)
  const slots = useTween(target)
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
  const { average } = summarizeSteps(inView)

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 md:pb-0">
      {header}

      <div className="flex items-start justify-between gap-3">
        <StatBlock
          label="Average"
          value={average === null ? '--' : formatSteps(average)}
          unit="steps"
        />
        <ExpandButton expand={expand} />
      </div>
      <p className="text-muted-foreground -mt-4 text-lg">{rangeLabel(win.from, win.to)}</p>

      <ExpandableChart expand={expand}>
        <StepsChart
          // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
          key={averaging}
          className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
          days={averageSteps(days, averaging)}
          today={today}
          slots={slots}
          pos={pan.view.pos}
          height={expand.height}
          pan={pan}
          expanded={expand.expanded}
        />
      </ExpandableChart>
      <ExpandFooter expand={expand}>
        <RangeBar
          range={range}
          onRangeChange={setRange}
          averaging={averaging}
          onAveragingChange={setAveraging}
        />
      </ExpandFooter>

      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:animation-duration-300 flex flex-col gap-5">
        <div className="bg-card text-foreground flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-base">
          <ChartColumn aria-hidden="true" strokeWidth={3} className="text-mf-tile-protein size-5" />
          Steps
        </div>
        {tutorial === 'show' && (
          <TutorialCard
            steps={STEPS_TUTORIAL}
            tone="brown"
            onDismiss={() => setTutorial('hidden')}
          />
        )}
        <StepsHistoryList days={days} onEdit={openSheet} />
      </div>

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
