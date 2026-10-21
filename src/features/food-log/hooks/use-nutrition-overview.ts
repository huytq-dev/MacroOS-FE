'use client'

import { useQuery } from '@tanstack/react-query'
import { useDayLog } from './use-food-log'
import { foodLogService } from '../services/food-log.service'
import {
  overviewFallback,
  overviewFromItems,
  topContributors,
  type OverviewRange,
} from '../nutrition-overview.utils'
import { useCurrentProgram } from '@/features/program/hooks/use-program'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

/**
 * Dữ liệu trang Nutrition Overview theo kỳ từ `GET /nutrition/overview` (value = tổng ngày ở Today, trung bình mỗi ngày đã log
 * ở các kỳ khác; contributors chỉ có ở Today); mục tiêu floor / target / ceiling lấy đúng từ BE, không có thì "No Target". API chưa có
 * (bản cũ) hoặc lỗi thì lùi về log hôm nay (calo, macro, chất xơ) với mục tiêu của chương trình cho Today; chất khác là chưa biết ("---").
 */
export function useNutritionOverview(range: OverviewRange) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const program = useCurrentProgram()
  const isToday = range === 'today'
  const overview = useQuery({
    queryKey: ['nutrition-overview', range, today],
    queryFn: () => foodLogService.nutritionOverview(range, today ?? ''),
    enabled: Boolean(today),
    retry: false,
  })
  // Chỉ cần log ngày khi API lỗi (lùi về dữ liệu hôm nay); không gọi thừa khi API chạy.
  const day = useDayLog(isToday && overview.isError ? today : null)

  const target = program.data?.currentWeek ?? null
  const fallback = overviewFallback(isToday ? (day.data?.totals ?? null) : null, target)
  return {
    isLoading:
      !isClient ||
      program.isLoading ||
      overview.isLoading ||
      (isToday && overview.isError && day.isLoading),
    isError: program.isError,
    values: overview.data ? overviewFromItems(overview.data.items, fallback) : fallback,
    contributors: overview.data
      ? overview.data.contributors
      : isToday && day.data
        ? topContributors(day.data.entries)
        : null,
  }
}
