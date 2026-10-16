'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DashboardSearchBar,
  InsightCard,
  SetupChecklist,
  WeekMatrix,
  type SetupStep,
} from '../components/DashboardPage'
import { useExpenditureSeries } from '../hooks/use-dashboard'
import { useWeekLog } from '@/features/food-log/hooks/use-food-log'
import { useCurrentProgram } from '@/features/program/hooks/use-program'
import { useProfile } from '@/features/users/hooks/use-profile'
import { useWeights } from '@/features/weight/hooks/use-weights'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { useIsClient } from '@/hooks/use-is-client'
import { addDaysIso, formatDateVi, todayIso } from '@/lib/date'
import { useUiStore } from '@/stores/ui.store'

const TREND_DAYS = 13
const WEIGHT_LOOKBACK_DAYS = 365
const SPARK_POINTS = 8

/** "Thứ Sáu, 16/10/2026" theo ngày iso; chỉ gọi sau khi mount để không lệch hydration. */
const dayLabel = (iso: string) => {
  const weekday = new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long' })
  return `${weekday}, ${formatDateVi(iso)}`
}

export function DashboardPage() {
  const router = useRouter()
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const trendFrom = today ? addDaysIso(today, -TREND_DAYS) : null
  // Tuần đang xem (mốc là một ngày bất kỳ trong tuần); undefined = ngày chọn mặc định.
  const [weekAnchor, setWeekAnchor] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null | undefined>(undefined)
  const anchor = weekAnchor ?? today

  const program = useCurrentProgram()
  const profile = useProfile()
  const weights = useWeights(today ? addDaysIso(today, -WEIGHT_LOOKBACK_DAYS) : null, today)
  const hasProgram = Boolean(program.data)
  // Lazy: dữ liệu theo dõi chỉ tải khi đã có program (chưa có target thì không có gì để so sánh).
  const week = useWeekLog(hasProgram ? anchor : null)
  const expenditure = useExpenditureSeries(hasProgram ? trendFrom : null, today)
  const setAddFoodOpen = useUiStore((state) => state.setAddFoodOpen)

  const searchFood = () => {
    setAddFoodOpen(true)
    router.push(routePath.foodLog)
  }

  if (program.isError)
    return <ErrorState error={program.error} onRetry={() => void program.refetch()} />
  if (week.isError) return <ErrorState error={week.error} onRetry={() => void week.refetch()} />

  const header = <PageHeader title="Tổng quan" eyebrow={today ? dayLabel(today) : undefined} />
  const isSetupLoading =
    !today || program.isLoading || (!hasProgram && (profile.isLoading || weights.isLoading))

  if (isSetupLoading)
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        {header}
        <Skeleton className="h-72 rounded-2xl" aria-busy="true" />
      </div>
    )

  if (!hasProgram) {
    const steps: SetupStep[] = [
      {
        key: 'profile',
        label: 'Hồ sơ của bạn',
        hint: 'Ngày sinh, chiều cao, mức vận động',
        done: Boolean(profile.data?.dateOfBirth && profile.data?.heightCm),
        href: routePath.profile,
      },
      {
        key: 'weight',
        label: 'Cân nặng hôm nay',
        hint: 'Làm điểm bắt đầu cho xu hướng cân nặng',
        done: weights.data?.latestWeightKg != null,
        href: routePath.weight,
      },
      {
        key: 'program',
        label: 'Mục tiêu và program',
        hint: 'Giảm, giữ hay tăng cân; tốc độ mỗi tuần',
        done: false,
        href: routePath.programNew,
      },
    ]
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        {header}
        <SetupChecklist steps={steps} />
      </div>
    )
  }

  const days = week.data?.days
  const weekIncludesToday = days?.some((day) => day.logDate === today) ?? false
  const selected =
    selectedDate === undefined ||
    (selectedDate !== null && !days?.some((day) => day.logDate === selectedDate))
      ? weekIncludesToday
        ? today
        : null
      : selectedDate
  const changeWeek = (offsetDays: number) => {
    setWeekAnchor(addDaysIso(anchor ?? today, offsetDays))
    setSelectedDate(undefined)
  }
  const canGoNext = days ? days[days.length - 1].logDate < today : false

  const tdeePoints = expenditure.data?.points.slice(-SPARK_POINTS) ?? []
  const tdee = expenditure.data?.current?.estimatedTdeeKcal
  const weightPoints = (weights.data?.items ?? [])
    .slice(-SPARK_POINTS)
    .map((entry) => entry.trendWeightKg ?? entry.weightKg)
  const latestWeight = weights.data?.latestTrendKg ?? weights.data?.latestWeightKg
  const range = trendFrom ? `${formatDateVi(trendFrom).slice(0, 5)} - nay` : ''

  return (
    <div className="flex max-w-2xl flex-col gap-6 pb-16 md:pb-0">
      {header}

      <section aria-labelledby="nutrition-heading" className="space-y-3">
        <h2 id="nutrition-heading" className="text-xl font-bold md:text-base">
          Dinh dưỡng & mục tiêu
        </h2>
        {week.isLoading || !days ? (
          <Skeleton className="h-72 rounded-2xl" aria-busy="true" />
        ) : (
          <WeekMatrix
            days={days}
            selected={selected}
            onSelect={setSelectedDate}
            onPreviousWeek={() => changeWeek(-7)}
            onNextWeek={canGoNext ? () => changeWeek(7) : undefined}
          />
        )}
      </section>

      <section aria-labelledby="insights-heading" className="space-y-3">
        <h2 id="insights-heading" className="text-xl font-bold md:text-base">
          Phân tích
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <InsightCard
            title="Chi tiêu"
            subtitle={range}
            href={routePath.program}
            values={tdeePoints.map((point) => point.estimatedTdeeKcal)}
            value={tdee ? String(Math.round(tdee)) : '—'}
            unit="kcal"
            tone="text-mf-calories"
          />
          <InsightCard
            title="Cân nặng"
            subtitle={range}
            href={routePath.weight}
            values={weightPoints}
            value={latestWeight ? latestWeight.toFixed(1) : '—'}
            unit="kg"
            tone="text-mf-trend"
          />
        </div>
      </section>

      <DashboardSearchBar onSearch={searchFood} />
    </div>
  )
}
