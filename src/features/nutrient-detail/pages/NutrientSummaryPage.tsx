'use client'

import { NutrientTiming } from '../components/NutrientTiming'
import { useNutrientDay } from '../hooks/use-nutrient-detail'
import { displayNutrient, scaleDayResponse, type NutrientInfo } from '../nutrient-detail.utils'
import type { NutrientDayResponse } from '../types/nutrient-detail.types'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { NutrientGoalBar } from '@/features/nutrition/NutrientGoalBar'
import { GoalPercent } from '@/features/nutrition/GoalPercent'
import { hasGoal, primaryGoal, type NutrientGoal } from '@/features/nutrition/goal-progress'
import { UNKNOWN_AMOUNT, formatAmount } from '@/features/nutrition/nutrient-display'
import { useUnits } from '@/features/users/hooks/use-units'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { UNVERIFIED_TARGET_NOTE, isUnverifiedTarget } from '@/features/nutrition/target-provenance'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

/** Một hàng Today / Past Week / Past Month: tên, "lượng / mục tiêu đơn vị", %, thanh mảnh có vạch target. */
function SummaryRow({
  info,
  label,
  amount,
  goal,
}: {
  readonly info: NutrientInfo
  readonly label: string
  readonly amount: number | null
  readonly goal: NutrientGoal
}) {
  const { nutrient, tone } = info
  const known = amount !== null
  const reference = primaryGoal(goal)
  return (
    <li className="px-4 py-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-base">
        <span className="min-w-0 truncate">{label}</span>
        <span className="text-center tabular-nums">
          {known ? formatAmount(amount, nutrient.unit) : UNKNOWN_AMOUNT}
          {reference !== null && ` / ${formatAmount(reference, nutrient.unit)}`} {nutrient.unit}
        </span>
        <GoalPercent
          goal={goal}
          consumed={amount}
          fallback={reference === null ? 'No Target' : ''}
          className="text-right"
        />
      </div>
      {hasGoal(goal) && (
        <div className="mt-3">
          <NutrientGoalBar goal={goal} consumed={amount} tone={tone} layout="row" />
        </div>
      )}
    </li>
  )
}

const GOAL_TITLE = { Strategy: 'Target', Custom: 'Custom Goal', Default: 'Default Goal' } as const
const GOAL_NOTE = {
  Strategy: 'Set by your strategy',
  Custom: 'Set by you',
  Default: 'Recommended for your profile',
} as const

/** "Active Goal": calo / macro theo strategy chỉ có target; Custom / Default liệt kê floor / target / ceiling hiện có; None = chưa có mục tiêu. */
function ActiveGoal({
  info,
  day,
}: {
  readonly info: NutrientInfo
  readonly day: NutrientDayResponse
}) {
  const { unit, name } = info.nutrient
  if (day.targetSource === 'None')
    return (
      <p className="bg-card text-muted-foreground rounded-xl p-4 text-base">
        No goal is set for {name}.
      </p>
    )
  // Target của ngày LEGACY_UNVERIFIED (cờ BE): chỉ để tham khảo, không hiện như mục tiêu đang áp
  if (isUnverifiedTarget(day.targetProvenance))
    return (
      <p className="bg-card text-muted-foreground rounded-xl p-4 text-base">
        {UNVERIFIED_TARGET_NOTE}
      </p>
    )
  const strategy = day.targetSource === 'Strategy'
  const rows: readonly (readonly [string, number | null])[] = strategy
    ? [['Target', day.target]]
    : [
        ['Floor', day.floor],
        ['Target', day.target],
        ['Ceiling', day.ceiling],
      ]
  return (
    <div className="bg-card rounded-xl p-4">
      <p className="text-lg">{GOAL_TITLE[day.targetSource]}</p>
      <p className="text-muted-foreground text-base">{GOAL_NOTE[day.targetSource]}</p>
      <ul className="mt-3 space-y-1 text-lg tabular-nums">
        {rows.map(([label, value]) =>
          value === null ? null : (
            <li key={label} className="flex justify-between gap-3">
              {!strategy && <span className="text-muted-foreground">{label}</span>}
              <span>
                {formatAmount(value, info.nutrient.unit)} {unit}
              </span>
            </li>
          )
        )}
      </ul>
    </div>
  )
}

const SECTION =
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 space-y-3 [animation-fill-mode:backwards]'

/**
 * Trang tóm tắt một chất (bấm thẻ "<Nutrient> Today"): Today / Past Week / Past Month so với mục tiêu, Active Goal (nguồn mục tiêu +
 * floor / target / ceiling), All Contributors của hôm nay (trượt vào lần lượt) và Nutrient Timing (24 giờ). Các phần hiện lần lượt.
 */
export function NutrientSummaryPage({ info: catalogInfo }: { readonly info: NutrientInfo }) {
  // Calo hiện theo kcal / kJ của user: mọi số của ngày đổi bằng `factor`; `info` mang đơn vị hiển thị
  const { energy } = useUnits()
  const { info, factor } = displayNutrient(catalogInfo, energy)
  const { nutrient } = info
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const query = useNutrientDay(info.code, today)
  const header = <SubPageHeader title={nutrient.name} />

  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  if (!today || !query.data)
    return (
      <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5">
        {header}
        <Skeleton className="h-40 rounded-xl" aria-busy="true" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )

  const day = scaleDayResponse(query.data, factor)
  const goal: NutrientGoal = day

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-8 md:pb-0">
      {header}

      <ul className="bg-card divide-foreground/10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-400 divide-y overflow-hidden rounded-xl">
        <SummaryRow info={info} label="Today" amount={day.amount} goal={goal} />
        <SummaryRow info={info} label="Past Week" amount={day.pastWeekAverage} goal={goal} />
        <SummaryRow info={info} label="Past Month" amount={day.pastMonthAverage} goal={goal} />
      </ul>

      <section
        aria-labelledby="goal-heading"
        className={SECTION}
        style={{ animationDelay: '70ms' }}
      >
        <h2 id="goal-heading" className="text-xl font-bold">
          Active Goal
        </h2>
        <ActiveGoal info={info} day={day} />
      </section>

      <section
        aria-labelledby="contributors-heading"
        className={SECTION}
        style={{ animationDelay: '140ms' }}
      >
        <div>
          <h2 id="contributors-heading" className="text-xl font-bold">
            All Contributors
          </h2>
          <p className="text-muted-foreground text-base">Contributors for Today</p>
        </div>
        {day.contributors.length === 0 ? (
          <p className="bg-card text-muted-foreground rounded-xl p-4 text-base">
            No contributors present
          </p>
        ) : (
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {day.contributors.map((item, index) => (
              <li
                key={item.entryId ?? `${item.name}-${index}`}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-3 motion-safe:animation-duration-300 flex items-center justify-between gap-3 px-4 py-3 text-base [animation-fill-mode:backwards]"
                style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
              >
                <span className="min-w-0 truncate">{item.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatAmount(item.amount, nutrient.unit)} {nutrient.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="timing-heading"
        className={SECTION}
        style={{ animationDelay: '210ms' }}
      >
        <div>
          <h2 id="timing-heading" className="text-xl font-bold">
            Nutrient Timing
          </h2>
          <p className="text-muted-foreground text-base">
            Distribution of {nutrient.name} throughout Today
          </p>
        </div>
        <NutrientTiming info={info} timing={day.timing} />
      </section>
    </div>
  )
}
