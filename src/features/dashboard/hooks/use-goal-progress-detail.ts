'use client'

import { useGoalProgress } from './use-dashboard'
import { buildWaterfall, goalDuration, optimisticEta, type GoalTab } from '../goal-progress.utils'
import { useCurrentProgram } from '@/features/program/hooks/use-program'
import { useWeights } from '@/features/weight/hooks/use-weights'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

/**
 * Gom dữ liệu trang Goal Progress: goal (`GET /goals/progress`: ngày bắt đầu, cân bắt đầu, cân mục tiêu), các lần cân từ lúc
 * bắt đầu (`GET /weights`) và tốc độ mong muốn của program. Thác nước, khoảng cách, thời lượng và ETA lạc quan tính ở FE
 * theo từng tab (số cân thô / xu hướng).
 */
export function useGoalProgressDetail(tab: GoalTab) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const goal = useGoalProgress()
  const program = useCurrentProgram()
  const weights = useWeights(goal.data ? goal.data.startDate : null, today)

  if (!today || goal.isLoading || program.isLoading || (goal.data && weights.isLoading))
    return { status: 'loading' as const }
  if (goal.isError || weights.isError) return { status: 'error' as const }

  const data = goal.data
  const startKg = data?.startWeightKg ?? null
  const targetKg = data?.targetWeightKg ?? null
  if (!data || startKg === null || targetKg === null || startKg === targetKg)
    return { status: 'empty' as const }

  const entries = weights.data?.items ?? []
  const { bars, distance } = buildWaterfall({
    startKg,
    targetKg,
    startDate: data.startDate,
    today,
    entries,
    tab,
  })

  return {
    status: 'ready' as const,
    bars,
    distance,
    startDate: data.startDate,
    targetKg,
    duration: goalDuration(data.startDate, today),
    eta: optimisticEta(today, distance, program.data?.weeklyWeightChangeTargetKg ?? 0),
  }
}
