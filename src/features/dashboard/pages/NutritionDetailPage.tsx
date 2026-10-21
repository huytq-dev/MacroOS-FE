'use client'

import { NutrientGroupSection, SubPageHeader } from '../components/DashboardPage'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { NUTRIENT_GROUPS } from '../nutrient-catalog'
import { useCurrentProgram } from '@/features/program/hooks/use-program'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

/** "Dinh dưỡng" (Xem tất cả): cuộn dọc qua Calo & Macro, chi tiết carb/béo/protein, vitamin, khoáng chất, khác. */
export function NutritionDetailPage() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const program = useCurrentProgram()
  const data = useDashboardData(today, Boolean(program.data))
  const loading = !today || program.isLoading || data.isLoading

  return (
    <div className="flex max-w-2xl flex-col gap-8 md:pb-0">
      <SubPageHeader title="Nutrition" />
      {loading ? (
        <div className="grid grid-cols-2 gap-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        NUTRIENT_GROUPS.map((group, index) => (
          <NutrientGroupSection
            key={group.key}
            group={group}
            values={data.nutrientsToday}
            macrosWeek={data.macrosWeek}
            index={index}
          />
        ))
      )}
    </div>
  )
}
