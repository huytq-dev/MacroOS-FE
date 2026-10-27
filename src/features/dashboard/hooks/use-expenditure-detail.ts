'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  bucketsToExpDays,
  expHistory,
  holdingNoticeOf,
  holdingReasonsOf,
  recentExp,
  toExpDay,
} from '../expenditure-series'
import { pairStatus } from '../dashboard.utils'
import { CHANGE_DAYS, type Averaging } from '../expenditure.utils'
import type {
  ExpenditureInsightsResponse,
  ExpenditureSeriesBucket,
  ExpenditureSeriesDay,
  ExpenditureSeriesResponse,
  ExpenditureSeriesSummary,
} from '../types/expenditure-series.types'
import { apiRoutes } from '@/config/api-routes'
import { useDebounce } from '@/hooks/use-debounce'
import { useIsClient } from '@/hooks/use-is-client'
import { apiCall } from '@/lib/api'
import { todayIso } from '@/lib/date'

/**
 * `GET /expenditure/insights` (số hiện tại, strategy, thay đổi): MỘT truy vấn dùng chung — trang Expenditure và ô Set TDEE của Program cùng
 * khoá nên cùng một số và cùng bộ nhớ đệm. `currentKcal` null = BE chưa có ước tính. `enabled` = false thì chưa gọi (nơi chỉ cần khi mở một bảng).
 */
export function useExpenditureInsights(enabled = true) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  return useQuery({
    queryKey: ['expenditure', 'insights', today],
    queryFn: () => apiCall.get<ExpenditureInsightsResponse>(apiRoutes.expenditure.insights),
    enabled: enabled && Boolean(today),
  })
}

interface DetailInput {
  readonly today: string
  readonly days: readonly ExpenditureSeriesDay[]
  readonly info: ExpenditureInsightsResponse | null | undefined
  readonly averaging: Averaging
  /** Nhóm Tuần / Tháng của BE (chỉ khi averaging khác 'daily'); FE không tự gộp. */
  readonly buckets?: readonly ExpenditureSeriesBucket[] | null
  /** undefined = công tắc Flux của bản build (tắt ở production); true chỉ từ đường xem trước có nhãn (expenditure-preview.ts). */
  readonly showFlux?: boolean
  /** Đầu mối Flux của phản hồi series: bản xem trước chưa duyệt? trạng thái chung (Available hoặc mã lý do). */
  readonly flux?: { readonly isPreview: boolean; readonly overall: string | null }
}

const GRANULARITY = { daily: 'Day', weekly: 'Week', monthly: 'Month' } as const

/**
 * Phần thuần của dữ liệu trang Expenditure (không gọi mạng): chuỗi từng ngày của BE → điểm biểu đồ (D), nhóm W / M của BE, lý do Holding, các dòng thay đổi và lịch sử. Hook thật và màn xem
 * trước (dữ liệu mô phỏng) dùng chung hàm này nên hai nơi vẽ cùng một thứ.
 */
export function buildExpenditureDetail({
  today,
  days,
  info,
  averaging,
  buckets,
  showFlux,
  flux,
}: DetailInput) {
  const daily = days.map((day) => toExpDay(day, showFlux))
  const lastReason = [...daily].reverse().find((day) => day.fluxReason !== null)?.fluxReason ?? null
  return {
    today,
    /** Flux: bản xem trước chưa duyệt (nhãn "MacroOS Flux V1 (preview, unapproved)"), và lý do mới nhất khi không có dải. */
    flux: {
      isPreview: flux?.isPreview ?? false,
      reason: lastReason ?? (flux?.overall && flux.overall !== 'Available' ? flux.overall : null),
    },
    /** Từng ngày (cũ → mới). */
    daily,
    /** Dùng để vẽ: ngày (D) hoặc nhóm Tuần / Tháng do BE tính (W / M). */
    days: averaging === 'daily' ? daily : bucketsToExpDays(buckets ?? [], daily, showFlux),
    current: info?.currentKcal ?? null,
    strategy: info?.strategy ?? null,
    holdingReasons: holdingReasonsOf(info ?? null),
    /** Vì sao đang Holding (từ mã của BE) + hành động sửa; null = không Holding hoặc không có mã FE biết. */
    holdingNotice: holdingNoticeOf(info ?? null),
    changes: CHANGE_DAYS.map((span) => {
      const found = info?.changes.find((item) => item.days === span)
      return {
        days: span,
        delta: found?.changeKcal ?? null,
        status: found?.status ?? 'Waiting',
        area: recentExp(daily, span),
      }
    }),
    history: expHistory(daily),
  }
}

/**
 * Gom dữ liệu trang Expenditure từ hai lần gọi của BE (theo múi giờ người dùng; chuỗi liên tục từng ngày tới HÔM NAY, BE đã
 * fill-forward): `GET /expenditure/series?all=true` (TOÀN BỘ chuỗi: vùng Flux, đường, trạng thái, thay đổi từng ngày) và
 * `GET /expenditure/insights` (Expenditure Changes, giá trị hiện tại, Current Strategy). Trang tự trượt một khung ngày trên chuỗi này
 * (kéo ngang, đổi kỳ) nên không gọi riêng từng kỳ; gộp D / W / M làm ở `buildExpenditureDetail`. `showFlux` chỉ truyền từ đường xem trước.
 */
export function useExpenditureDetail(averaging: Averaging, showFlux?: boolean) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const granularity = GRANULARITY[averaging]

  const series = useQuery({
    queryKey: ['expenditure', 'series', 'history', today, granularity],
    queryFn: () =>
      apiCall.get<ExpenditureSeriesResponse>(apiRoutes.expenditure.series, {
        params: { all: true, to: today, granularity },
      }),
    enabled: Boolean(today),
  })
  const insights = useExpenditureInsights()

  if (!today)
    return {
      ready: false as const,
      isLoading: true,
      isError: false,
      isFetching: false,
      refetch: (): void => undefined,
    }

  const status = pairStatus(series, insights)
  return {
    ready: true as const,
    // Số hiện tại / thay đổi lấy từ insights: insights lỗi (còn giữ số cũ) cũng là lỗi, không hiện số đó như số cuối
    isLoading: status.isLoading,
    isError: status.isError,
    isFetching: status.isFetching,
    /** Thử lại cả chuỗi và insights (nút Retry của ErrorState). */
    refetch: () => {
      void series.refetch()
      void insights.refetch()
    },
    ...buildExpenditureDetail({
      today,
      days: series.data?.days ?? [],
      info: insights.data,
      averaging,
      buckets: series.data?.buckets,
      showFlux,
      flux: {
        isPreview: series.data?.fluxIsPreview === true,
        overall: series.data?.fluxOverallStatus ?? null,
      },
    }),
  }
}

/**
 * Average / Difference của KHUNG đang xem: do BE tính (`GET /expenditure/series?from&to` → `summary`, trên kcal học được của các ngày trong [from, to]); FE chỉ hiện, không cộng trừ.
 * Khung đổi khi kéo / đổi kỳ nên chờ 250 ms rồi mới hỏi và giữ số cũ trong lúc tải (không nháy "---"). from / to null = chưa có khung.
 */
export function useExpenditureWindowSummary(from: string | null, to: string | null) {
  const key = useDebounce(from && to ? `${from}|${to}` : null, 250)
  const [start, end] = key ? key.split('|') : [null, null]
  const query = useQuery({
    queryKey: ['expenditure', 'series', 'summary', start, end],
    queryFn: async (): Promise<ExpenditureSeriesSummary | null> =>
      (
        await apiCall.get<ExpenditureSeriesResponse>(apiRoutes.expenditure.series, {
          params: { from: start, to: end },
        })
      )?.summary ?? null,
    enabled: Boolean(start && end),
    placeholderData: keepPreviousData,
  })
  return query.data
}
