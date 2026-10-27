'use client'

import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { SubPageHeader } from '../DashboardPage'
import { AboutExpenditure } from './AboutExpenditure'
import { ExpenditureChart } from './ExpenditureChart'
import { ExpenditureInsights } from './ExpenditureInsights'
import { ExpenditureLegend } from './ExpenditureLegend'
import { HoldingNotice } from './HoldingNotice'
import { MonthlyList } from './MonthlyList'
import { RangeBar, StatBlock, TutorialCard } from '../DetailPage'
import { EXPENDITURE_TUTORIAL } from './expenditure-tutorial-steps'
import { slotsOf, viewWindow } from '../../chart/geometry'
import { useChartPan } from '../../chart/use-chart-pan'
import {
  ExpandableChart,
  ExpandButton,
  ExpandFooter,
  useChartExpand,
} from '../../chart/use-chart-expand'
import { useTween } from '../../chart/use-tween'
import { usePersistedChoice } from '../../hooks/use-dashboard'
import type { useExpenditureDetail } from '../../hooks/use-expenditure-detail'
import { rangeLabel, type Averaging, type RangeKey } from '../../expenditure.utils'
import { expLegend, fluxEmptyNote } from '../../expenditure-series'
import { FLUX_PREVIEW_LABEL } from '../../expenditure-preview'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import type { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import type { useUnits } from '@/features/users/hooks/use-units'
import { cn } from '@/lib/utils'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/** Nguồn dữ liệu của màn: trang thật (BE) hoặc màn xem trước (mô phỏng, có nhãn). Cùng một hình dạng nên hai nơi vẽ cùng một thứ. */
export interface ExpenditureSource {
  readonly data: ReturnType<typeof useExpenditureDetail>
  readonly derived: ReturnType<typeof useDerivedGate>
  readonly energy: ReturnType<typeof useUnits>['energy']
  /** Nhãn "Preview — …" hiện đầu màn (chỉ đường xem trước, build có bật cờ); null = màn bình thường. */
  readonly previewLabel: string | null
  /** Insights & lịch sử gọi API riêng nên màn xem trước (không có API) bỏ chúng. */
  readonly showInsights: boolean
}

/** Average / Difference của khung do BE tính (summary của `GET /expenditure/series?from&to`); null = chưa có / không có ngày nào trong khung. */
export interface WindowSummary {
  readonly average: number | null
  readonly difference: number | null
}

interface ExpenditureScreenProps {
  /** Hook cung cấp dữ liệu (cùng một hàm ở mọi lần render). */
  readonly useSource: (averaging: Averaging) => ExpenditureSource
  /** Hook cung cấp Average / Difference của khung đang xem (BE; màn xem trước dùng bản mô phỏng có nhãn). */
  readonly useSummary: (from: string | null, to: string | null) => WindowSummary | null | undefined
}

/**
 * Màn "Expenditure" kiểu MacroFactor V3: header (back, tiêu đề giữa, tutorial), Average / Difference + khoảng ngày của KHUNG ĐANG XEM (tính từ chuỗi BE, không số cứng) và nút phóng to, biểu đồ
 * (đường cam, dải Flux của BE nếu có, marker, lưới mảnh, trục phải) KÉO NGANG được, chọn kỳ 1W…All + D/W/M, chú giải, About Expenditure, hướng dẫn, Insights & Data, Data Sources và lịch
 * sử theo tháng. Có thẻ lý do khi Holding / Calibrating. Nhãn "Preview" hiện đầu màn khi dữ liệu là bản xem trước.
 */
export function ExpenditureScreen({ useSource, useSummary }: ExpenditureScreenProps) {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const expand = useChartExpand()
  const [tutorial, setTutorial] = usePersistedChoice(
    'expenditure.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const { data, derived, energy, previewLabel, showInsights } = useSource(averaging)
  const total = data.ready ? data.daily.length : 0
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })

  const win = data.ready ? viewWindow(data.today, target, pan.view.snapped) : null
  // Average / Difference do BE tính cho đúng khung đang xem (không cộng trừ ở FE)
  const summary = useSummary(win?.from ?? null, win?.to ?? null)

  if (data.isError)
    return (
      <ErrorState
        error={new Error('Could not load Expenditure')}
        onRetry={data.refetch}
        isRetrying={data.isFetching}
      />
    )

  const inView =
    data.ready && win ? data.daily.filter((day) => day.date >= win.from && day.date <= win.to) : []
  const legend = expLegend(inView)
  // Số của BE, chỉ đổi sang kcal / kJ của user rồi làm tròn để hiện
  const average = summary?.average == null ? null : Math.round(energy.convert(summary.average))
  const difference =
    summary?.difference == null ? null : Math.round(energy.convert(summary.difference))
  // Biểu đồ vẽ theo đơn vị của user để vạch trục và chú thích đúng đơn vị đó
  const factor = energy.convert(1)
  const chartDays = data.ready
    ? data.days.map((day) => ({
        ...day,
        kcal: day.kcal * factor,
        fluxLow: day.fluxLow === null ? null : day.fluxLow * factor,
        fluxHigh: day.fluxHigh === null ? null : day.fluxHigh * factor,
      }))
    : []
  // Bản xem trước của BE mà BE không trả dải nào: nói rõ thay vì để user tưởng dải bị lỗi
  const noBandInPreview =
    previewLabel !== null && data.ready && !data.days.some((day) => day.fluxLow !== null)

  return (
    <div
      aria-busy={derived.gate === 'updating'}
      className={cn(
        'flex w-full max-w-2xl min-w-0 flex-col gap-5 transition-opacity md:pb-0',
        // BE đang dựng lại: giữ nguyên biểu đồ và số cũ (làm mờ, không thay bằng khung xám làm trang co lại); số mới tự thay khi xong
        derived.gate === 'updating' && 'opacity-60'
      )}
    >
      <SubPageHeader
        title="Expenditure"
        action={
          <IconButton
            icon={GraduationCap}
            label={tutorial === 'show' ? 'Hide tutorial' : 'Show tutorial'}
            className="size-11"
            onClick={() => setTutorial(tutorial === 'show' ? 'hidden' : 'show')}
          />
        }
      />

      {previewLabel !== null && (
        <p
          role="note"
          data-preview-label=""
          className="border-mf-tile-fat-text/60 text-mf-tile-fat-text rounded-xl border border-dashed px-3 py-2 text-sm leading-snug"
        >
          {previewLabel}
          {noBandInPreview && ' The API returned no Flux for these days, so no band is drawn.'}
        </p>
      )}

      {derived.gate === 'failed' ? (
        <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
      ) : !data.ready || data.isLoading || !win ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div
              role="group"
              aria-label="Average and Difference of the Expenditure line"
              title="Average and Difference of the Expenditure line over the dates shown"
              className="flex min-w-0 gap-6 min-[360px]:gap-10 max-[359px]:[&_.text-4xl]:text-3xl"
            >
              <StatBlock label="Average" value={average?.toString() ?? null} unit={energy.unit} />
              <StatBlock
                label="Difference"
                value={difference?.toString() ?? null}
                unit={energy.unit}
              />
            </div>
            <ExpandButton expand={expand} />
          </div>
          <p className="text-muted-foreground -mt-3 text-lg">{rangeLabel(win.from, win.to)}</p>

          {data.holdingNotice && <HoldingNotice notice={data.holdingNotice} />}

          <ExpandableChart expand={expand}>
            <ExpenditureChart
              // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
              key={averaging}
              className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
              days={chartDays}
              unit={energy.unit}
              today={data.today}
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
            <ExpenditureLegend
              legend={legend}
              fluxLabel={data.flux.isPreview ? FLUX_PREVIEW_LABEL : undefined}
            />
            {/* Đang ở đường xem trước mà khung không có dải: nói vì sao (mã của BE), không dựng số */}
            {previewLabel !== null && !legend.flux && (
              <p data-flux-empty="" className="text-muted-foreground -mt-2 px-1 text-sm">
                {fluxEmptyNote(data.flux.reason)}
              </p>
            )}
            <AboutExpenditure showFlux={legend.flux} />
            {tutorial === 'show' && (
              <TutorialCard
                steps={EXPENDITURE_TUTORIAL}
                tone="brown"
                onDismiss={() => setTutorial('hidden')}
              />
            )}
            {showInsights && (
              <>
                <ExpenditureInsights
                  changes={data.changes}
                  current={data.current}
                  strategy={data.strategy}
                  holdingReasons={data.holdingReasons}
                />
                <MonthlyList history={data.history} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
