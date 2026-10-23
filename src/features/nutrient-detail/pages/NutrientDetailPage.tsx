'use client'

import { useState } from 'react'
import { NutrientChart } from '../components/NutrientChart'
import { NutrientHistory } from '../components/NutrientHistory'
import { NutrientLegend } from '../components/NutrientLegend'
import { NutrientTodayCard } from '../components/NutrientTodayCard'
import { useNutrientDay, useNutrientSeries } from '../hooks/use-nutrient-detail'
import { aboutText, goalKindText } from '../nutrient-copy'
import {
  averageLogged,
  averageNutrientDays,
  displayNutrient,
  scaleDayResponse,
  scaleSeriesDay,
  type NutrientInfo,
} from '../nutrient-detail.utils'
import type { NutrientSeriesPoint } from '../types/nutrient-detail.types'
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
import { useUnits } from '@/features/users/hooks/use-units'
import { Skeleton } from '@/components/ui/skeleton'
import {
  UNVERIFIED_TARGET_NOTE,
  isHistoricalUnverified,
} from '@/features/nutrition/target-provenance'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

/**
 * Trang chi tiết một nutrient (bấm ô Calories / Protein / … ở Dashboard hoặc trang Nutrition): Average của các ngày ĐÃ LOG trong khoảng
 * đang xem, biểu đồ cột màu của chất kèm đường target và dải Range KÉO NGANG được, chọn kỳ 1W…All và D/W/M (đổi kỳ thì giãn / co mượt),
 * nút phóng to (biểu đồ cao gần hết màn hình, phần dưới ẩn, chiều cao chạy mượt), chú giải + ⓘ, "About", thẻ "Today" và lịch sử theo tháng.
 */
export function NutrientDetailPage({ info: catalogInfo }: { readonly info: NutrientInfo }) {
  // Calo hiện theo kcal / kJ của user: mọi số (chuỗi, hôm nay) đổi bằng `factor` trước khi vẽ; `info` mang đơn vị hiển thị
  const { energy, weekStartDay } = useUnits()
  const { info, factor } = displayNutrient(catalogInfo, energy)
  const { nutrient } = info
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const series = useNutrientSeries(info.code, today)
  const day = useNutrientDay(info.code, today)
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const expand = useChartExpand()

  const data = series.data
  const kind = data?.goalKind
  // BE chỉ trả loại mục tiêu ở cấp chuỗi: gắn vào từng ngày để thanh / biểu đồ đọc đủ bộ mục tiêu
  // Ngày có target LEGACY_UNVERIFIED (cờ của BE, calo / macro) chỉ để tham khảo: không mốc, không loại mục tiêu → không vẽ đạt / không đạt cho ngày đó
  const days: NutrientSeriesPoint[] = data
    ? data.days.map((item) => {
        const day = scaleSeriesDay(item, factor)
        return isHistoricalUnverified(item.targetProvenance, item.date, today)
          ? { ...day, floor: null, target: null, ceiling: null, goalKind: 'None' as const }
          : { ...day, goalKind: data.goalKind }
      })
    : []
  const targetUnverified =
    !!data &&
    (data.days.some((item) => isHistoricalUnverified(item.targetProvenance, item.date, today)) ||
      (data.summary.unverifiedTargetDays ?? 0) > 0)
  const total = days.length
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })

  const goalLine = goalKindText(catalogInfo, kind)
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
      {targetUnverified && (
        <p className="text-muted-foreground -mt-3 text-sm">{UNVERIFIED_TARGET_NOTE}</p>
      )}

      <ExpandableChart expand={expand}>
        <NutrientChart
          // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
          key={averaging}
          className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
          info={info}
          days={averageNutrientDays(days, averaging, weekStartDay)}
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
          <div className={`${DETAIL_CARD} text-foreground space-y-3 p-4 text-lg leading-snug`}>
            <p>{aboutText(catalogInfo)}</p>
            {goalLine && <p className="text-muted-foreground">{goalLine}</p>}
          </div>
        </section>

        <section aria-labelledby="today-heading" className="space-y-3">
          <h2 id="today-heading" className="text-xl font-bold">
            {nutrient.name} Today
          </h2>
          <NutrientTodayCard
            info={info}
            day={day.data ? scaleDayResponse(day.data, factor) : undefined}
            loading={day.isPending}
          />
        </section>

        <NutrientHistory
          info={info}
          days={[...days].sort((a, b) => b.date.localeCompare(a.date))}
        />
      </div>
    </div>
  )
}
