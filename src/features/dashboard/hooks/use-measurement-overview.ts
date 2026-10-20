'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRoutes } from '@/config/api-routes'
import { apiCall } from '@/lib/api'

// Khớp BE GET /api/body-metrics/measurements/overview?entries=7 (chỉ số đo đã có dữ liệu, entries mới nhất trước)
export interface MeasurementOverview {
  metrics: {
    key: string
    group: string
    latestDate: string
    latestCm: number
    entries: { date: string; valueCm: number }[]
  }[]
}

const ENTRIES = 7

/** 7 lần đo gần nhất của mọi số đo vòng đã có dữ liệu, cho các ô Neck / Shoulders… của Dashboard (một lần gọi cho tất cả). */
export const useMeasurementOverview = () =>
  useQuery({
    // Nhóm 'body-metrics' để lưu / xoá số đo ở trang khác invalidate theo
    queryKey: ['body-metrics', 'measurement-overview', ENTRIES],
    queryFn: () =>
      apiCall.get<MeasurementOverview>(apiRoutes.bodyMetrics.measurementsOverview, {
        params: { entries: ENTRIES },
      }),
    staleTime: 60 * 1000,
    retry: false,
  })
