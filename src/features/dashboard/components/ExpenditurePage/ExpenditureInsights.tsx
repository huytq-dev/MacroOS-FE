import { Database, Scale, TrendingUp } from 'lucide-react'
import { DETAIL_CARD, SourceRow, StatBox, WaitingIcon } from '../DetailPage'
import { CHANGE_DAYS, changeOver, type ChartPoint } from '../../expenditure.utils'
import type { ExpenditureChange } from '../../types/dashboard.types'
import { routePath } from '@/config/route-path'

interface InsightsProps {
  readonly all: readonly ChartPoint[]
  readonly today: string
  readonly current: number | null
  readonly holding: boolean
  readonly holdingReason: string | null
  /** Biến thiên do BE tính; null thì suy từ `all`. */
  readonly changes: readonly ExpenditureChange[] | null
}

const STRATEGY_TEXT = {
  holding:
    'Holding safeguards your expenditure estimate against insufficient data. Updating requires at least 4 days of nutrition data and 1 day of weight data per 7-day period.',
  updating:
    'Updating keeps your expenditure in step with your weight trend and the calories you log. Keep logging to stay in this mode.',
}

/**
 * "Insights & Data": Expenditure Changes (3/7/14/30/90-day, "Waiting" khi chưa đủ dữ liệu), Current Expenditure,
 * Current Strategy (Holding/Updating + giải thích) và Data Sources.
 */
export function ExpenditureInsights({
  all,
  today,
  current,
  holding,
  holdingReason,
  changes,
}: InsightsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Insights & Data</h2>

      <section aria-labelledby="changes-heading" className={`${DETAIL_CARD} p-4`}>
        <h3 id="changes-heading" className="text-lg">
          Expenditure Changes
        </h3>
        <ul className="mt-3 space-y-3.5">
          {CHANGE_DAYS.map((days) => {
            const fromApi = changes?.find((item) => item.days === days)
            const delta = fromApi ? fromApi.deltaKcal : changeOver(all, days, today)
            return (
              <li
                key={days}
                className="grid grid-cols-[4.5rem_1fr_1fr_auto] items-center gap-3 text-base"
              >
                <span className="text-muted-foreground">{days}-day</span>
                <span aria-hidden="true" className="bg-mf-tile-protein h-0.5 w-14" />
                <span className="tabular-nums">
                  {delta === null ? '-- kcal' : `${delta > 0 ? '+' : ''}${delta} kcal`}
                </span>
                <span className="flex items-center gap-2">
                  {delta === null ? (
                    <>
                      <WaitingIcon className="text-mf-tile-protein size-5" />
                      <span className="text-muted-foreground">Waiting</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp aria-hidden="true" className="text-mf-tile-protein size-5" />
                      <span className="text-muted-foreground">
                        {delta === 0 ? 'Steady' : delta > 0 ? 'Up' : 'Down'}
                      </span>
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={`${DETAIL_CARD} space-y-5 p-4`}>
        <div className="flex items-start gap-4">
          <StatBox>
            <span className="text-2xl font-semibold tabular-nums">
              {current === null ? '---' : Math.round(current)}
            </span>
            <span className="text-muted-foreground text-base">kcal</span>
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
            <span className="text-xl font-semibold">{holding ? 'Holding' : 'Updating'}</span>
          </StatBox>
          <div>
            <h3 className="text-lg">Current Strategy</h3>
            <p className="text-muted-foreground text-base leading-snug">
              {holding ? STRATEGY_TEXT.holding : STRATEGY_TEXT.updating}
            </p>
            {holding && holdingReason && (
              <p className="text-muted-foreground/80 mt-1 text-sm">{holdingReason}</p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="sources-heading" className="space-y-3">
        <h2 id="sources-heading" className="text-lg font-bold">
          Data Sources
        </h2>
        <div className={`${DETAIL_CARD} divide-foreground/10 divide-y`}>
          <SourceRow icon={Database} title="Nutrition Data Manager" href={routePath.foodLog} />
          <SourceRow icon={Scale} title="Scale Weight" href={routePath.weight} />
        </div>
      </section>
    </div>
  )
}
