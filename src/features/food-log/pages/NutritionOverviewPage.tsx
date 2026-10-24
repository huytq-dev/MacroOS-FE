'use client'

import { useState } from 'react'
import { NutrientCard, RangeTabs } from '../components/NutritionOverviewPage'
import { UNVERIFIED_TARGET_NOTE } from '@/features/nutrition/target-provenance'
import { useNutritionOverview } from '../hooks/use-nutrition-overview'
import {
  OVERVIEW_GROUPS,
  OVERVIEW_RANGE_LABEL,
  UNKNOWN_OVERVIEW,
  type ContributorKey,
  type OverviewRange,
} from '../nutrition-overview.utils'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { cn } from '@/lib/utils'

const CONTRIBUTOR_GROUPS = new Set(['calories', 'macros'])

/**
 * "Nutrition Overview" (Food Log → More → Nutrition Overview): tab kỳ Today / 1 Week / 1 Month / 3 Months / 1 Year, mỗi chất một
 * thẻ có thanh tiến độ theo mục tiêu. Công tắc Contributors (chỉ có ở Today) mở danh sách ba món đóng góp nhiều nhất dưới
 * Calories và các macro. Dữ liệu từng kỳ do BE tổng hợp (`GET /nutrition/overview`); lỗi thì hiện ErrorState có nút Thử lại, không
 * thay bằng target suy từ chương trình.
 */
export function NutritionOverviewPage() {
  const [range, setRange] = useState<OverviewRange>('today')
  const [contributorsOn, setContributorsOn] = useState(false)
  const data = useNutritionOverview(range)
  // Kỳ Month / Quarter / Year đọc tổng hợp dẫn xuất của BE: đang dựng lại thì mờ (không phải số cuối), Ready thì DERIVED_KEYS làm mới một lần
  const derived = useDerivedGate()
  const isToday = range === 'today'

  if (data.isError) return <ErrorState error={data.error} onRetry={() => void data.refetch()} />

  return (
    <div aria-busy={derived.gate === 'updating'} className="flex max-w-2xl flex-col gap-8 pb-8">
      <div className="bg-card sticky top-0 z-30 [contain:inline-size] max-md:-mx-4 max-md:-mt-[calc(env(safe-area-inset-top)+1.25rem)] max-md:pt-[calc(env(safe-area-inset-top)+0.5rem)] md:rounded-2xl md:pt-2">
        <div className="px-4">
          <SubPageHeader title="Nutrition Overview" />
        </div>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      {derived.gate === 'failed' && (
        <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
      )}
      {data.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div
          key={range}
          className={cn(
            'motion-safe:animate-in motion-safe:fade-in-0 flex flex-col gap-8 transition-opacity motion-safe:duration-300',
            derived.gate !== 'ready' && 'opacity-60'
          )}
        >
          {OVERVIEW_GROUPS.map((group) => {
            const hasContributors = isToday && CONTRIBUTOR_GROUPS.has(group.key)
            return (
              <section
                key={group.key}
                aria-labelledby={`overview-${group.key}`}
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 id={`overview-${group.key}`} className="text-xl font-bold">
                    {group.title}
                  </h2>
                  {isToday && group.key === 'calories' && (
                    <label className="flex items-center gap-3 text-base">
                      Contributors
                      <Switch
                        checked={contributorsOn}
                        onCheckedChange={setContributorsOn}
                        className="h-8! w-14! data-[state=checked]:bg-white! data-[state=unchecked]:bg-zinc-600! [&>span]:size-7! [&>span]:bg-black! [&>span]:data-[state=checked]:translate-x-[26px]!"
                      />
                    </label>
                  )}
                </div>
                {group.nutrients.some(
                  (nutrient) => data.values[nutrient.key]?.targetUnverified
                ) && (
                  <p className="text-muted-foreground -mt-1 text-sm">{UNVERIFIED_TARGET_NOTE}</p>
                )}
                <ul className="grid grid-cols-2 gap-3">
                  {group.nutrients.map((nutrient) => {
                    const { value, goal } = data.values[nutrient.key] ?? UNKNOWN_OVERVIEW
                    return (
                      <NutrientCard
                        key={nutrient.key}
                        layout="tile"
                        period={OVERVIEW_RANGE_LABEL[range]}
                        wide={group.nutrients.length === 1}
                        nutrient={nutrient}
                        value={value}
                        goal={goal}
                        tone={group.tone}
                        contributors={
                          hasContributors
                            ? contributorsOn
                              ? (data.contributors?.[nutrient.key as ContributorKey] ?? [])
                              : null
                            : undefined
                        }
                      />
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
