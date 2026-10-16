'use client'

import { useRouter } from 'next/navigation'
import { TodayMeals, TodaySummary } from '../components/DashboardPage'
import { useDayLog } from '@/features/food-log/hooks/use-food-log'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { useIsClient } from '@/hooks/use-is-client'
import { formatDateVi, todayIso } from '@/lib/date'
import { useUiStore } from '@/stores/ui.store'

/** "Thứ Sáu, 16/10/2026" theo ngày iso; chỉ gọi sau khi mount để không lệch hydration. */
const dayLabel = (iso: string) => {
  const weekday = new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long' })
  return `${weekday}, ${formatDateVi(iso)}`
}

export function DashboardPage() {
  const router = useRouter()
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const day = useDayLog(today)
  const setAddFoodOpen = useUiStore((state) => state.setAddFoodOpen)

  const addFood = () => {
    setAddFoodOpen(true)
    router.push(routePath.foodLog)
  }

  if (day.isError) return <ErrorState error={day.error} onRetry={() => void day.refetch()} />

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader title="Hôm nay" eyebrow={today ? dayLabel(today) : undefined} />
      {!today || day.isLoading || !day.data ? (
        <div className="space-y-5" aria-busy="true">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <>
          <TodaySummary totals={day.data.totals} target={day.data.target} />
          <TodayMeals entries={day.data.entries} onAddFood={addFood} />
        </>
      )}
    </div>
  )
}
