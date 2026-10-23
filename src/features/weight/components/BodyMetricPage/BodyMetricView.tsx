'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { MetricChart } from './MetricChart'
import { MetricHistoryList } from './MetricHistoryList'
import { averageMetric, summarizeMetric, type MetricPoint } from '../../body-metric.utils'
import { slotsOf, viewWindow } from '@/features/dashboard/chart/geometry'
import { useChartPan } from '@/features/dashboard/chart/use-chart-pan'
import {
  ExpandableChart,
  ExpandButton,
  ExpandFooter,
  useChartExpand,
} from '@/features/dashboard/chart/use-chart-expand'
import { useTween } from '@/features/dashboard/chart/use-tween'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import {
  RangeBar,
  StatBlock,
  TutorialCard,
  type TutorialStep,
} from '@/features/dashboard/components/DetailPage'
import { rangeLabel, type Averaging, type RangeKey } from '@/features/dashboard/expenditure.utils'
import { useUnits } from '@/features/users/hooks/use-units'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { daysBetween } from '@/lib/date'

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
 * nút phóng to biểu đồ (cao hơn, trục y vừa dữ liệu), biểu đồ, 1W…All + D/W/M (bảng), chú thích, hướng dẫn và lịch sử theo tháng.
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
  const { weekStartDay } = useUnits()
  const expand = useChartExpand()
  const total = today && points.length > 0 ? daysBetween(points[0].date, today) + 1 : 0
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })

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

  const win = viewWindow(today, target, pan.view.snapped)
  const inWindow = points.filter((point) => point.date >= win.from && point.date <= win.to)
  const { average, difference } = summarizeMetric(inWindow)

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {header}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-10">
          <StatBlock label="Average" value={average?.toFixed(1) ?? null} unit={unit} />
          <StatBlock
            label="Difference"
            value={
              difference === null ? null : `${difference > 0 ? '+' : ''}${difference.toFixed(1)}`
            }
            unit={unit}
          />
        </div>
        <ExpandButton expand={expand} />
      </div>
      <p className="text-muted-foreground -mt-4 text-lg">{rangeLabel(win.from, win.to)}</p>

      <ExpandableChart expand={expand}>
        <MetricChart
          // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
          key={averaging}
          className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
          points={averageMetric(points, averaging, weekStartDay)}
          today={today}
          slots={slots}
          pos={pan.view.pos}
          unit={unit}
          label={title}
          height={expand.height}
          // Trục y luôn vừa dữ liệu (không bắt đầu từ 0), vạch ở số tròn: user chốt, khớp ảnh MF Scale Weight 1W (78–82 kg) và Neck 1W (17–20 cm)
          tickCount={4}
          fit
          pan={pan}
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
        <div className="bg-card flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-base">
          <span aria-hidden="true" className="relative flex h-4 w-6 items-center">
            <span className="bg-mf-green h-0.5 w-full" />
            <span className="border-mf-green bg-card absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2" />
          </span>
          {title}
        </div>
        {tutorial && <TutorialCard steps={tutorial} tone="green" onDismiss={onDismissTutorial} />}
        <MetricHistoryList points={points} unit={unit} icon={historyIcon} onEdit={onEdit} />
      </div>
    </div>
  )
}
