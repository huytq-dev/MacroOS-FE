import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { NutrientDayResponse, NutrientSeriesResponse } from '../types/nutrient-detail.types'

export const nutrientDetailService = {
  /** Toàn bộ lịch sử của một chất tới `to` (BE `all=true`: từ ngày có dữ liệu đầu tiên). */
  series: (code: string, to: string) =>
    apiCall.get<NutrientSeriesResponse>(apiRoutes.nutrients.series(code), {
      params: { to, all: true },
    }),
  day: (code: string, date: string) =>
    apiCall.get<NutrientDayResponse>(apiRoutes.nutrients.day(code), { params: { date } }),
}
