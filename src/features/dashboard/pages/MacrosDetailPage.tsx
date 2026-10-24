'use client'

import { useState } from 'react'
import { MacrosBreakdownList, MacrosLegend } from '../components/MacrosPage/MacrosBreakdownList'
import { MacrosChart } from '../components/MacrosPage/MacrosChart'
import { SubPageHeader } from '../components/DashboardPage'
import { RangeBar, StatBlock } from '../components/DetailPage'
import { slotsOf, viewWindow } from '../chart/geometry'
import { useChartPan } from '../chart/use-chart-pan'
import {
  ExpandableChart,
  ExpandButton,
  ExpandFooter,
  useChartExpand,
} from '../chart/use-chart-expand'
import { useTween } from '../chart/use-tween'
import { rangeLabel, type Averaging, type RangeKey } from '../expenditure.utils'
import { useMacrosSeries } from '../hooks/use-dashboard'
import { gramText, historyDayCount, macroBarsOf } from '../macros-detail'
import type { MacroGranularity } from '../types/macros-series.types'
import { useUnits } from '@/features/users/hooks/use-units'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

const GRANULARITY: Readonly<Record<Averaging, MacroGranularity | undefined>> = {
  daily: undefined,
  weekly: 'Week',
  monthly: 'Month',
}

/**
 * Chi tiết Macros (bấm ô Macros ở Dashboard) theo MacroFactor: ‹ "Macros", Protein / Fat / Carbs (gram trung bình mỗi ngày ĐÃ LOG trong kỳ đang xem) + khoảng
 * ngày + nút tròn phóng to, biểu đồ cột chồng năng lượng mỗi ngày đã log KÉO NGANG được (trục y kcal bên phải), chọn kỳ 1W…All và D/W/M, chú giải và lịch sử
 * từng ngày theo tháng. MỌI số (kcal từng phần, % calo, trung bình, bucket W / M) do BE tính: `GET /nutrients/macros/series`; FE chỉ vẽ, đổi đơn vị và định dạng.
 */
export function MacrosDetailPage() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const { energy } = useUnits()
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const expand = useChartExpand()

  // Toàn lịch sử từ ngày log đầu tới hôm nay (ngày liên tục, ngày chưa log có giá trị null); bucket W / M là truy vấn riêng chỉ khi cần
  const history = useMacrosSeries({ all: true }, Boolean(today))
  const buckets = useMacrosSeries(
    { all: true, granularity: GRANULARITY[averaging] },
    Boolean(today) && averaging !== 'daily'
  )
  const series = history.data
  const total = today && series ? historyDayCount(series, today) : 0
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })
  const win = today ? viewWindow(today, target, pan.view.snapped) : null
  // Tóm tắt của đúng khoảng đang xem do BE tính (kỳ All không kéo được: dùng luôn `summary` của toàn lịch sử)
  const windowSummary = useMacrosSeries(
    win ? { from: win.from, to: win.to } : {},
    Boolean(win) && range !== 'All'
  )

  const header = <SubPageHeader title="Macros" />

  if (history.isError)
    return <ErrorState error={history.error} onRetry={() => void history.refetch()} />

  if (!today || !win || !series)
    return (
      <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5">
        {header}
        <Skeleton className="h-24 rounded-xl" aria-busy="true" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-12 rounded-full" />
      </div>
    )

  const averages = (range === 'All' ? series.summary : windowSummary.data?.summary)?.averages
  const chartSeries = averaging === 'daily' ? series : (buckets.data ?? series)
  const dayBars = macroBarsOf(series, 'daily')

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 md:pb-0">
      {header}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-6 max-[360px]:gap-4 sm:gap-8 max-[360px]:[&_p:nth-child(2)]:text-3xl">
          <StatBlock label="Protein" value={gramText(averages?.proteinG)} unit="g" />
          <StatBlock label="Fat" value={gramText(averages?.fatG)} unit="g" />
          <StatBlock label="Carbs" value={gramText(averages?.carbsG)} unit="g" />
        </div>
        <ExpandButton expand={expand} />
      </div>
      <p className="text-muted-foreground -mt-4 text-lg">{rangeLabel(win.from, win.to)}</p>

      <ExpandableChart expand={expand}>
        <MacrosChart
          // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
          key={averaging}
          className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
          days={macroBarsOf(chartSeries, averaging)}
          today={today}
          energy={energy}
          slots={slots}
          pos={pan.view.pos}
          height={expand.height}
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
        <MacrosLegend />
        <MacrosBreakdownList days={dayBars} />
      </div>
    </div>
  )
}
