'use client'

import { useQuery } from '@tanstack/react-query'
import { nutrientDetailService } from '../services/nutrient-detail.service'

// Cùng tiền tố 'nutrients' với các ô Dashboard (`useDayNutrients`): đổi bữa ăn làm mới cả hai
export const nutrientDetailKeys = {
  series: (code: string, to: string) => ['nutrients', code, 'series', to] as const,
  day: (code: string, date: string) => ['nutrients', code, 'day', date] as const,
}

/** Toàn bộ lịch sử một chất tới hôm nay (trang lọc kỳ ở FE); `today` null = chưa mount. */
export const useNutrientSeries = (code: string, today: string | null) =>
  useQuery({
    queryKey: nutrientDetailKeys.series(code, today ?? ''),
    queryFn: () => nutrientDetailService.series(code, today ?? ''),
    enabled: Boolean(today),
  })

/** Chi tiết một ngày của một chất: mục tiêu, trung bình tuần / tháng, món đóng góp, phân bố theo giờ. */
export const useNutrientDay = (code: string, date: string | null) =>
  useQuery({
    queryKey: nutrientDetailKeys.day(code, date ?? ''),
    queryFn: () => nutrientDetailService.day(code, date ?? ''),
    enabled: Boolean(date),
  })
