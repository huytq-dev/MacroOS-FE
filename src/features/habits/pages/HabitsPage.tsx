'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { useUnits } from '@/features/users/hooks/use-units'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { useIsClient } from '@/hooks/use-is-client'
import { useSheet } from '@/hooks/use-sheet'
import { todayIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui.store'
import { HabitCalendar } from '../components/HabitsPage/HabitCalendar'
import { HabitControls } from '../components/HabitsPage/HabitControls'
import { HabitHeatmap } from '../components/HabitsPage/HabitHeatmap'
import { HabitLegend, HabitSummary } from '../components/HabitsPage/HabitSummary'
import { ScaleWeightSheet } from '../components/HabitsPage/ScaleWeightSheet'
import { useHabitDays } from '../hooks/use-habit-days'
import { monthGrid, type HabitKind } from '../habits.utils'

const COPY: Record<HabitKind, { title: string }> = {
  'weigh-in': { title: 'Weigh-In' },
  'food-logging': { title: 'Food Logging' },
}

interface View {
  readonly year: number
  readonly month: number
  readonly direction: 'next' | 'prev' | null
}

function HabitsContent({ kind, today }: { readonly kind: HabitKind; readonly today: string }) {
  const router = useRouter()
  const openFoodLogDate = useUiStore((state) => state.openFoodLogDate)
  const sheet = useSheet<string>()
  const currentYear = Number(today.slice(0, 4))
  const currentMonth = Number(today.slice(5, 7)) - 1
  const [picked, setPicked] = useState<View | null>(null)
  const view = picked ?? { year: currentYear, month: currentMonth, direction: null }

  // Streak và số hôm nay luôn tính trên năm nay; lịch + heatmap theo năm đang xem (cùng khoá thì dùng chung một truy vấn)
  const summary = useHabitDays(kind, currentYear, today)
  const shown = useHabitDays(kind, view.year, today)
  const copy = COPY[kind]
  // Số hôm nay: cân nặng theo kg / lb, năng lượng theo kcal / kJ của user (BE luôn trả kg, kcal)
  const { weight, energy, weekStartDay } = useUnits()
  const measure = kind === 'weigh-in' ? weight : energy
  // Food Logging đọc snapshot từng ngày (`GET /expenditure/daily`, BE dựng lại): chưa Ready thì mờ, không phải số cuối. Weigh-In đọc cân thô
  const derived = useDerivedGate()
  const derivedGate = kind === 'food-logging' ? derived.gate : 'ready'

  if (summary.isError) return <ErrorState error={summary.error} onRetry={summary.refetch} />

  const onSelect = (iso: string) => {
    if (kind === 'weigh-in') {
      sheet.show(iso)
      return
    }
    openFoodLogDate(iso)
    router.push(routePath.foodLog)
  }

  return (
    <div
      aria-busy={derivedGate === 'updating'}
      className="flex w-full max-w-2xl min-w-0 flex-col gap-5 pb-24 md:pb-0"
    >
      <SubPageHeader title={copy.title} />
      {derivedGate === 'failed' && (
        <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
      )}
      <div
        className={cn(
          'flex min-w-0 flex-col gap-5 transition-opacity',
          derivedGate !== 'ready' && 'opacity-60'
        )}
      >
        <HabitSummary
          todayValue={summary.todayValue === null ? null : measure.convert(summary.todayValue)}
          unit={measure.unit}
          streak={summary.streak}
        />
        {shown.isLoading ? (
          <Skeleton className="h-96 rounded-xl" aria-busy="true" />
        ) : (
          <HabitCalendar
            grid={monthGrid(view.year, view.month, weekStartDay)}
            monthKey={`${view.year}-${view.month}`}
            direction={view.direction}
            tracked={shown.tracked}
            today={today}
            onSelect={onSelect}
          />
        )}
        <HabitControls
          year={view.year}
          month={view.month}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onChange={(year, month) =>
            setPicked({
              year,
              month,
              direction: year * 12 + month > view.year * 12 + view.month ? 'next' : 'prev',
            })
          }
        />
        <HabitLegend />
        <HabitHeatmap year={view.year} tracked={shown.tracked} today={today} />
      </div>

      {sheet.value !== undefined && (
        <ScaleWeightSheet
          key={sheet.id}
          open={sheet.open}
          onOpenChange={sheet.onOpenChange}
          date={sheet.value}
        />
      )}
    </div>
  )
}

/**
 * Trang Habits dùng chung cho Weigh-In và Food Logging (bấm ô Habits ở Dashboard): "Today" + "Streak", lịch tháng (‹ › và ô chọn
 * tháng / năm), chú giải Tracked / Untracked và heatmap cả năm. Bấm một ngày: Weigh-In mở bảng nhập cân của ngày đó, Food
 * Logging mở nhật ký của ngày đó. "Hôm nay" chỉ tính sau khi mount (tránh lệch hydration).
 */
export function HabitsPage({ kind }: { readonly kind: HabitKind }) {
  const isClient = useIsClient()
  if (!isClient)
    return (
      <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5" aria-busy="true">
        <SubPageHeader title={COPY[kind].title} />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  return <HabitsContent kind={kind} today={todayIso()} />
}
