'use client'

import { useGoalProgress } from './use-dashboard'
import { buildWaterfall, etaViewOf, goalDuration, type GoalTab } from '../goal-progress.utils'
import { useUnits } from '@/features/users/hooks/use-units'
import { useWeights } from '@/features/weight/hooks/use-weights'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

/**
 * Gom dữ liệu trang Goal Progress: goal (`GET /goals/progress`: ngày bắt đầu, cân bắt đầu, cân mục tiêu, các tuần `weeks` theo trend) và
 * tốc độ mong muốn của program. Tab Trend vẽ thác nước thẳng từ `weeks` của BE; tab Scale (BE chưa có chuỗi cân thô) gom từ các lần
 * cân từ lúc bắt đầu (`GET /weights`). Khoảng cách, thời lượng và ETA lạc quan tính ở FE.
 */
export function useGoalProgressDetail(tab: GoalTab) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const goal = useGoalProgress()
  const { weight } = useUnits()
  // Chỉ tab Scale cần các lần cân thật; tab Trend dùng `weeks` của BE nên không tải thêm
  const weights = useWeights(goal.data && tab === 'scale' ? goal.data.startDate : null, today)

  if (!today || goal.isLoading || (goal.data && weights.isLoading))
    return { status: 'loading' as const }
  if (goal.isError || weights.isError)
    return {
      status: 'error' as const,
      /** Đang tải lại: ErrorState khoá nút và báo đang thử (không huỷ request đang chạy để gửi request khác). */
      isRetrying: goal.isFetching || weights.isFetching,
      /** Thử lại truy vấn nào đang lỗi (nút Retry của ErrorState). */
      refetch: () => {
        if (goal.isError) void goal.refetch()
        if (weights.isError) void weights.refetch()
      },
    }

  const data = goal.data
  const startKg = data?.startWeightKg ?? null
  const targetKg = data?.targetWeightKg ?? null
  if (!data || startKg === null || targetKg === null || startKg === targetKg)
    return { status: 'empty' as const }

  const entries = weights.data?.items ?? []
  const { bars, distance, reached, pastKg } = buildWaterfall({
    startKg,
    targetKg,
    startDate: data.startDate,
    today,
    entries,
    tab,
    weeks: tab === 'trend' ? data.weeks : null,
    weight,
  })

  return {
    status: 'ready' as const,
    bars,
    distance,
    reached,
    pastKg,
    startDate: data.startDate,
    targetKg,
    duration: goalDuration(data.startDate, today),
    // ETA do BE quyết (ngày / đã đạt / lý do không có): FE không tự tính "Optimistic ETA" từ tốc độ program nữa
    eta: etaViewOf(data),
  }
}
