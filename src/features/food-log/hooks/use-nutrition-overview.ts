'use client'

import { useQuery } from '@tanstack/react-query'
import { foodLogService } from '../services/food-log.service'
import { overviewFromItems, type OverviewRange } from '../nutrition-overview.utils'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

/**
 * Dữ liệu trang Nutrition Overview theo kỳ từ `GET /nutrition/overview` (value = tổng ngày ở Today, trung bình mỗi ngày đã log
 * ở các kỳ khác; contributors chỉ có ở Today); mục tiêu floor / target / ceiling và `goalKind` lấy đúng từ BE, không có thì "No Target".
 * API lỗi thì để trang hiện lỗi + Thử lại: KHÔNG thay bằng số suy từ chương trình (target của tuần khác target của ngày bị dịch kcal /
 * Collaborative).
 */
export function useNutritionOverview(range: OverviewRange) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const overview = useQuery({
    queryKey: ['nutrition-overview', range, today],
    queryFn: () => foodLogService.nutritionOverview(range, today ?? ''),
    enabled: Boolean(today),
    retry: false,
  })
  return {
    isLoading: !isClient || overview.isLoading,
    isError: overview.isError,
    error: overview.error,
    refetch: overview.refetch,
    values: overviewFromItems(overview.data?.items ?? []),
    contributors: overview.data?.contributors ?? null,
  }
}
