'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SlidersHorizontal } from 'lucide-react'
import {
  DailyNutritionCard,
  DashboardCarousel,
  DashboardSearchBar,
  EnergyBalanceCard,
  LayoutSection,
  MoreSection,
  SetupChecklist,
  WeekMatrix,
  type SetupStep,
} from '../components/DashboardPage'
import { usePersistedChoice } from '../hooks/use-dashboard'
import { useDashboardLayout } from '../hooks/use-dashboard-layout'
import { useDashboardData } from '../hooks/use-dashboard-data'
import type { BalanceMode } from '../dashboard.utils'
import { useWeekLog } from '@/features/food-log/hooks/use-food-log'
import type { MacroTotals } from '@/features/food-log/types/food-log.types'
import { useCurrentProgram } from '@/features/program/hooks/use-program'
import { useProfile } from '@/features/users/hooks/use-profile'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { useIsClient } from '@/hooks/use-is-client'
import { formatDateVi, todayIso } from '@/lib/date'
import { useUiStore } from '@/stores/ui.store'

// BE: ProgramResponse chưa trả cân mục tiêu; có rồi thì lấy từ program để Tiến độ mục tiêu tính thật.
const GOAL_TARGET_KG = null

const EMPTY_TOTALS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
const NUTRITION_MODES = ['consumed', 'remaining'] as const
const BALANCE_MODES = ['expenditure', 'targets'] as const

/** "Thứ Sáu, 16/10/2026" theo ngày iso; chỉ gọi sau khi mount để không lệch hydration. */
const dayLabel = (iso: string) => {
  const weekday = new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
  return `${weekday}, ${formatDateVi(iso)}`
}

export function DashboardPage() {
  const router = useRouter()
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  // Ngày đang chọn trong tuần này; undefined = hôm nay.
  const [selectedDate, setSelectedDate] = useState<string | null | undefined>(undefined)
  const [nutritionMode, setNutritionMode] = usePersistedChoice(
    'dashboard.nutritionMode',
    'consumed',
    NUTRITION_MODES
  )
  const [balanceMode, setBalanceMode] = usePersistedChoice<BalanceMode>(
    'dashboard.balanceMode',
    'expenditure',
    BALANCE_MODES
  )

  const [layout] = useDashboardLayout()
  const program = useCurrentProgram()
  const profile = useProfile()
  const hasProgram = Boolean(program.data)
  const data = useDashboardData(today, hasProgram, GOAL_TARGET_KG)
  // Lazy: dữ liệu theo dõi chỉ tải khi đã có program (chưa có target thì không có gì để so sánh).
  const week = useWeekLog(hasProgram ? today : null)
  const setAddFoodOpen = useUiStore((state) => state.setAddFoodOpen)

  const searchFood = () => {
    setAddFoodOpen(true)
    router.push(routePath.foodLog)
  }

  if (program.isError)
    return <ErrorState error={program.error} onRetry={() => void program.refetch()} />
  if (week.isError) return <ErrorState error={week.error} onRetry={() => void week.refetch()} />

  const header = (
    <PageHeader
      display
      title="Dashboard"
      eyebrow={today ? dayLabel(today) : undefined}
      action={
        hasProgram ? (
          <Link
            href={routePath.dashboardCustomize}
            aria-label="Customize Dashboard"
            className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <SlidersHorizontal aria-hidden="true" className="size-5" />
          </Link>
        ) : undefined
      }
    />
  )
  const isSetupLoading =
    !today || program.isLoading || (!hasProgram && (profile.isLoading || data.weights.isLoading))

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
        label: 'Your profile',
        hint: 'Date of birth, height, activity level',
        done: Boolean(profile.data?.dateOfBirth && profile.data?.heightCm),
        href: routePath.profile,
      },
      {
        key: 'weight',
        label: "Today's weight",
        hint: 'Sets the starting point for your weight trend',
        done: data.weights.data?.latestWeightKg != null,
        href: routePath.weight,
      },
      {
        key: 'program',
        label: 'Goal and program',
        hint: 'Lose, maintain or gain; weekly rate',
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

  const weekly =
    week.isLoading || !days ? (
      <Skeleton className="h-72 rounded-2xl" aria-busy="true" />
    ) : (
      <div className="flex flex-1 flex-col justify-between gap-3">
        <h2 className="text-xl font-bold">Weekly Nutrition</h2>
        <WeekMatrix
          mode={nutritionMode}
          onModeChange={setNutritionMode}
          days={days}
          selected={selected}
          onSelect={setSelectedDate}
        />
      </div>
    )

  const focusPages = {
    weekly: { label: 'Weekly Nutrition', node: weekly },
    energy: {
      label: 'Energy Balance',
      node: (
        <EnergyBalanceCard
          points={data.daily}
          currentTdee={data.tdee}
          currentTarget={data.todayTarget?.caloriesTarget ?? null}
          mode={balanceMode}
          onModeChange={setBalanceMode}
        />
      ),
    },
    daily: {
      label: 'Daily Nutrition',
      node: (
        <DailyNutritionCard
          totals={data.todayTotals ?? EMPTY_TOTALS}
          target={data.todayTarget}
          mode={nutritionMode}
          onModeChange={setNutritionMode}
        />
      ),
    },
  }
  const slides = layout.focus
    .filter((key) => !layout.focusHidden.includes(key))
    .map((key) => ({ key, ...focusPages[key] }))

  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-16 md:pb-0">
      {header}
      {slides.length > 0 && <DashboardCarousel slides={slides} />}
      {layout.sections.map((section, index) => (
        <LayoutSection
          key={section}
          section={section}
          tiles={layout.tiles[section]}
          display={layout.nutrientDisplay}
          data={data}
          index={index}
        />
      ))}
      <MoreSection />
      <DashboardSearchBar onSearch={searchFood} />
    </div>
  )
}
