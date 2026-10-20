'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { MetricChart } from './MetricChart'
import { MetricHistoryList } from './MetricHistoryList'
import {
  averageMetric,
  metricWindow,
  summarizeMetric,
  type MetricPoint,
} from '../../body-metric.utils'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import {
  CollapseChartIcon,
  ExpandChartIcon,
  RangeBar,
  StatBlock,
  TutorialCard,
  type TutorialStep,
} from '@/features/dashboard/components/DetailPage'
import { rangeLabel, type Averaging, type RangeKey } from '@/features/dashboard/expenditure.utils'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface BodyMetricViewProps {
  readonly title: string
  readonly unit: string
  /** Mọi điểm đã ghi, tăng dần theo ngày (đã đổi sang đơn vị hiển thị). */
  readonly points: readonly MetricPoint[]
  /** null khi chưa mount (hôm nay tính ở client). */
  readonly today: string | null
  readonly isLoading: boolean
  readonly tutorial: readonly TutorialStep[] | null
  readonly onDismissTutorial: () => void
  readonly historyIcon?: React.ReactNode
  readonly onAdd: () => void
  readonly onEdit: (date: string) => void
}

/**
 * Bố cục chung của Scale Weight / Visual Body Fat (kiểu MacroFactor): ‹ tiêu đề +, Average / Difference / khoảng ngày,
 * nút phóng to biểu đồ, biểu đồ, 1W…All + D/W/M (bảng), chú thích, hướng dẫn và lịch sử theo tháng.
 */
export function BodyMetricView({
  title,
  unit,
  points,
  today,
  isLoading,
  tutorial,
  onDismissTutorial,
  historyIcon,
  onAdd,
  onEdit,
}: BodyMetricViewProps) {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const [expanded, setExpanded] = useState(false)

  const header = (
    <SubPageHeader
      title={title}
      action={<IconButton icon={Plus} label={`Add ${title}`} className="size-11" onClick={onAdd} />}
    />
  )
  if (!today || isLoading)
    return (
      <div className="flex max-w-2xl flex-col gap-5">
        {header}
        <Skeleton className="h-24 rounded-xl" aria-busy="true" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-12 rounded-full" />
      </div>
    )

  const win = metricWindow(range, today, points[0]?.date ?? null)
  const inWindow = points.filter((point) => point.date >= win.from && point.date <= win.to)
  const { average, difference } = summarizeMetric(inWindow)
  const shown = averageMetric(inWindow, averaging)

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {header}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-10">
          <StatBlock label="Average" value={average?.toFixed(1) ?? null} unit={unit} />
          <StatBlock label="Difference" value={difference?.toFixed(1) ?? null} unit={unit} />
        </div>
        <IconButton
          icon={expanded ? CollapseChartIcon : ExpandChartIcon}
          label={expanded ? 'Shrink chart' : 'Expand chart'}
          variant="secondary"
          aria-pressed={expanded}
          className={cn(
            'size-14 rounded-full transition-colors duration-200',
            expanded && 'bg-foreground text-background hover:bg-foreground/90'
          )}
          onClick={() => setExpanded((value) => !value)}
        />
      </div>
      <p className="text-muted-foreground -mt-4 text-lg">{rangeLabel(win.from, win.to)}</p>

      <MetricChart
        key={`${range}-${averaging}`}
        points={shown}
        from={win.from}
        to={win.to}
        unit={unit}
        label={title}
        height={expanded ? 460 : 300}
        tickCount={expanded ? 6 : 3}
      />
      <RangeBar
        range={range}
        onRangeChange={setRange}
        averaging={averaging}
        onAveragingChange={setAveraging}
      />

      {!expanded && (
        <>
          <div className="bg-card flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-base">
            <span aria-hidden="true" className="relative flex h-4 w-6 items-center">
              <span className="bg-mf-green h-0.5 w-full" />
              <span className="border-mf-green bg-card absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2" />
            </span>
            {title}
          </div>
          {tutorial && <TutorialCard steps={tutorial} tone="green" onDismiss={onDismissTutorial} />}
          <MetricHistoryList points={points} unit={unit} icon={historyIcon} onEdit={onEdit} />
        </>
      )}
    </div>
  )
}
