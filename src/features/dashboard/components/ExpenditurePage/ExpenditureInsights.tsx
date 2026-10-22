import { ArrowRight, Database, TrendingDown, TrendingUp } from 'lucide-react'
import {
  DETAIL_CARD,
  MiniArea,
  ScaleIcon,
  SourceRow,
  StatBox,
  WaitingIcon,
  padWindow,
} from '../DetailPage'
import type { ExpDay } from '../../expenditure-series'
import type { ExpenditureChangeStatus } from '../../types/expenditure-series.types'
import { routePath } from '@/config/route-path'
import { useUnits } from '@/features/users/hooks/use-units'

interface ChangeRow {
  readonly days: number
  /** kcal so với N ngày trước; null = chưa đủ dữ liệu ("Waiting"). */
  readonly delta: number | null
  /** Trạng thái do BE tính: Decrease / Increase / NoChange / Waiting (chưa đủ lịch sử). */
  readonly status: ExpenditureChangeStatus
  /** N + 1 ngày cuối, vẽ vùng thu nhỏ của hàng. */
  readonly area: readonly ExpDay[]
}

interface InsightsProps {
  readonly changes: readonly ChangeRow[]
  readonly current: number | null
  readonly strategy: 'Calibrating' | 'Updating' | 'Holding' | null
  /** Lý do Holding bằng tiếng Anh dựng từ mã của BE (`holdingReasonsOf`); rỗng = chỉ hiện câu chung. */
  readonly holdingReasons: readonly string[]
}

const STRATEGY_TEXT = {
  Holding:
    'Holding safeguards your expenditure estimate against insufficient data. Updating requires at least 4 days of nutrition data and 1 day of weight data per 7-day period.',
  Updating:
    'MacroOS is actively analyzing your weight and nutrition data to update your expenditure estimate.',
  Calibrating:
    'MacroOS is calibrating your expenditure from your first weeks of weight and nutrition data.',
}

/** Giảm hiện "−4", tăng hiện "4" (không dấu +, như Weight Trend); nhãn Increase / Decrease đã báo hướng. */
const changeText = (value: number) => `${value < 0 ? '−' : ''}${Math.abs(value)}`

/** Nhãn thay đổi của một hàng Expenditure Changes: biểu tượng cam + chữ (Decrease / Increase / No Change) hoặc Waiting. */
function ChangeStatus({ status }: { readonly status: ExpenditureChangeStatus }) {
  if (status === 'Waiting')
    return (
      <span className="flex items-center gap-2">
        <WaitingIcon className="text-mf-tile-protein size-5" />
        <span className="text-muted-foreground">Waiting</span>
      </span>
    )
  const Icon =
    status === 'Decrease' ? TrendingDown : status === 'Increase' ? TrendingUp : ArrowRight
  return (
    <span className="text-muted-foreground flex items-center gap-2 whitespace-nowrap">
      <Icon aria-hidden="true" className="text-mf-tile-protein size-5 shrink-0" strokeWidth={2.5} />
      {status === 'NoChange' ? 'No Change' : status}
    </span>
  )
}

/**
 * "Insights & Data": Expenditure Changes (3/7/14/30/90-day có vùng thu nhỏ, kcal và Decrease / Increase / Waiting), Current
 * Expenditure, Current Strategy (Updating / Holding + giải thích) và Data Sources (Nutrition Data Manager, Scale Weight).
 */
export function ExpenditureInsights({ changes, current, strategy, holdingReasons }: InsightsProps) {
  const { energy } = useUnits()
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Insights & Data</h2>

      <section aria-labelledby="changes-heading" className={`${DETAIL_CARD} p-4`}>
        <h3 id="changes-heading" className="text-lg">
          Expenditure Changes
        </h3>
        <ul className="mt-3 space-y-3.5">
          {changes.map(({ days, delta, status, area }) => (
            <li
              key={days}
              className="grid grid-cols-[4rem_minmax(0,3.5rem)_1fr_auto] items-center gap-2.5 text-base max-[359px]:grid-cols-[3.25rem_minmax(0,3.5rem)_1fr_auto] max-[359px]:text-sm"
            >
              <span className="text-muted-foreground whitespace-nowrap">{days}-day</span>
              <MiniArea
                values={padWindow(
                  area.map((day) => day.kcal),
                  days
                )}
                className="text-mf-tile-protein"
              />
              <span className="whitespace-nowrap tabular-nums">
                {status === 'Waiting' || delta === null
                  ? `-- ${energy.unit}`
                  : `${changeText(Math.round(energy.convert(delta)))} ${energy.unit}`}
              </span>
              <ChangeStatus status={status} />
            </li>
          ))}
        </ul>
      </section>

      <section className={`${DETAIL_CARD} space-y-5 p-4`}>
        <div className="flex items-start gap-4">
          <StatBox>
            <span className="text-2xl font-semibold tabular-nums">
              {current === null ? '---' : energy.format(current)}
            </span>
            <span className="text-muted-foreground text-base">{energy.unit}</span>
          </StatBox>
          <div>
            <h3 className="text-lg">Current Expenditure</h3>
            <p className="text-muted-foreground text-base leading-snug">
              The latest estimate of your daily energy expenditure based on your weight trend and
              nutrition data.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <StatBox>
            <span className="text-xl font-semibold">{strategy ?? '---'}</span>
          </StatBox>
          <div>
            <h3 className="text-lg">Current Strategy</h3>
            <p className="text-muted-foreground text-base leading-snug">
              {strategy ? STRATEGY_TEXT[strategy] : STRATEGY_TEXT.Calibrating}
            </p>
            {strategy === 'Holding' &&
              holdingReasons.map((reason) => (
                <p key={reason} className="text-muted-foreground/80 mt-1 text-sm">
                  {reason}
                </p>
              ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="sources-heading" className="space-y-3">
        <h2 id="sources-heading" className="text-lg font-bold">
          Data Sources
        </h2>
        <div className={`${DETAIL_CARD} divide-foreground/10 divide-y`}>
          <SourceRow
            icon={Database}
            title="Nutrition Data Manager"
            href={routePath.nutritionData}
          />
          <SourceRow icon={ScaleIcon} title="Scale Weight" href={routePath.weight} />
        </div>
      </section>
    </div>
  )
}
