'use client'

import { useState } from 'react'
import { NutrientChart } from '../components/NutrientChart'
import { NutrientHistory } from '../components/NutrientHistory'
import { NutrientLegend } from '../components/NutrientLegend'
import { NutrientTodayCard } from '../components/NutrientTodayCard'
import { useNutrientDay, useNutrientSeries } from '../hooks/use-nutrient-detail'
import { aboutText } from '../nutrient-copy'
import { averageLogged, averageNutrientDays, type NutrientInfo } from '../nutrient-detail.utils'
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
import { DETAIL_CARD, RangeBar, StatBlock } from '@/features/dashboard/components/DetailPage'
import { rangeLabel, type Averaging, type RangeKey } from '@/features/dashboard/expenditure.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { formatAmount } from '@/features/nutrition/nutrient-display'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

/**
 * Trang chi tiết một nutrient (bấm ô Calories / Protein / … ở Dashboard hoặc trang Nutrition): Average của các ngày ĐÃ LOG trong khoảng
 * đang xem, biểu đồ cột màu của chất kèm đường target và dải Range KÉO NGANG được, chọn kỳ 1W…All và D/W/M (đổi kỳ thì giãn / co mượt),
 * nút phóng to (biểu đồ cao gần hết màn hình, phần dưới ẩn, chiều cao chạy mượt), chú giải + ⓘ, "About", thẻ "Today" và lịch sử theo tháng.
 */
export function NutrientDetailPage({ info }: { readonly info: NutrientInfo }) {
  const { nutrient } = info
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const series = useNutrientSeries(info.code, today)
  const day = useNutrientDay(info.code, today)
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const expand = useChartExpand()

  const kind = series.data?.goalKind ?? null
  const days = (series.data?.days ?? []).map((item) => ({ ...item, goalKind: kind }))
  const total = days.length
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })

  const header = <SubPageHeader title={nutrient.name} />

  if (series.isError)
    return <ErrorState error={series.error} onRetry={() => void series.refetch()} />

  if (!today || series.isLoading)
    return (
      <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5">
        {header}
        <Skeleton className="h-24 rounded-xl" aria-busy="true" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-12 rounded-full" />
      </div>
    )

  const win = viewWindow(today, target, pan.view.snapped)
  const average = averageLogged(days.filter((item) => item.date >= win.from && item.date <= win.to))

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 md:pb-0">
      {header}

      <div className="flex items-start justify-between gap-3">
        <StatBlock
          label="Average"
          value={average === null ? null : formatAmount(average, nutrient.unit)}
          unit={nutrient.unit}
        />
        <ExpandButton expand={expand} />
      </div>
      <p className="text-muted-foreground -mt-4 text-lg">{rangeLabel(win.from, win.to)}</p>

      <ExpandableChart expand={expand}>
        <NutrientChart
          // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
          key={averaging}
          className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
          info={info}
          days={averageNutrientDays(days, averaging)}
          today={today}
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

      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:animation-duration-300 flex flex-col gap-6">
        <NutrientLegend info={info} />

        <section aria-labelledby="about-heading" className="space-y-3">
          <h2 id="about-heading" className="text-xl font-bold">
            About {nutrient.name}
          </h2>
          <p className={`${DETAIL_CARD} text-foreground p-4 text-lg leading-snug`}>
            {aboutText(info)}
          </p>
        </section>

        <section aria-labelledby="today-heading" className="space-y-3">
          <h2 id="today-heading" className="text-xl font-bold">
            {nutrient.name} Today
          </h2>
          <NutrientTodayCard info={info} day={day.data ?? undefined} />
        </section>

        <NutrientHistory
          info={info}
          days={[...days].sort((a, b) => b.date.localeCompare(a.date))}
        />
      </div>
    </div>
  )
}
