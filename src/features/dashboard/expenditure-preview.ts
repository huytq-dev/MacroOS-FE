import { addDaysIso } from '@/lib/date'
import { averageExpDays, toExpDay } from './expenditure-series'
import type { Averaging } from './expenditure.utils'
import type {
  ExpenditureInsightsResponse,
  ExpenditureSeriesBucket,
  ExpenditureSeriesDay,
} from './types/expenditure-series.types'

/**
 * Đường xem trước (preview) của dải Flux: chỉ BẬT khi build có NEXT_PUBLIC_EXPENDITURE_PREVIEW=1 (mặc định TẮT, bản production không có). Có hai nhánh, luôn có nhãn rõ trên màn hình:
 *  - trang Expenditure thật + ?fluxPreview=1: vẽ dải mà BE test trả (MacroOS Flux V1, dữ liệu test); BE trả null thì không có dải;
 *  - trang /expenditure-preview: dữ liệu MÔ PHỎNG do FE dựng sẵn chỉ để xem bố cục (KHÔNG phải kết quả của mô hình Flux, KHÔNG phải Expenditure của ai).
 * Production không bao giờ vẽ dải: FLUX_BAND_ENABLED = false và BE trả null.
 */
export const EXPENDITURE_PREVIEW = process.env.NEXT_PUBLIC_EXPENDITURE_PREVIEW === '1'

export const PREVIEW_LABEL_BE = 'Preview — MacroOS Flux V1 (test data)'
/** Nhãn bắt buộc khi BE báo fluxIsPreview (DB cô lập / dev): dải chưa được duyệt, không phải live. */
export const FLUX_PREVIEW_LABEL = 'MacroOS Flux V1 (preview, unapproved)'
export const PREVIEW_LABEL_SYNTHETIC =
  'Preview — synthetic demonstration data (layout only). Not your Expenditure and not a Flux result.'

/** Trang thật đang ở chế độ xem trước dải? (cờ build + ?fluxPreview=1). */
export const fluxPreviewRequested = (search: string): boolean =>
  EXPENDITURE_PREVIEW && new URLSearchParams(search).get('fluxPreview') === '1'

/**
 * Chuỗi MÔ PHỎNG hình dạng như BE trả (ExpenditureSeriesDay), chỉ để xem bố cục: 14 ngày đầu Calibrating (không dải), rồi Updating tăng dần, một đoạn Holding giữ dải cuối,
 * rồi giảm; bề rộng dải đổi theo từng điểm và LỆCH (không đối xứng). Các số do tay đặt cho ảnh minh hoạ, không từ mô hình nào.
 */
export function syntheticSeries(today: string, days = 90): ExpenditureSeriesDay[] {
  const out: ExpenditureSeriesDay[] = []
  // Đường nền (kcal): ổn định → tăng chậm → đỉnh → giảm; số do tay đặt cho ảnh minh hoạ
  const curve = (i: number) => {
    const t = Math.min(1, i / (days - 1))
    return 2400 + 38 * Math.sin(Math.PI * Math.min(1, t * 1.15)) - 130 * Math.max(0, t - 0.82)
  }
  let last: { low: number; high: number } | null = null
  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(today, -(days - 1 - i))
    const calibrating = i < 14
    const holding = (i >= 52 && i < 57) || i === days - 6 || i === days - 5
    const kcal = Math.round(
      calibrating ? 2400 : holding && last ? (last.low + last.high) / 2 : curve(i)
    )
    let band: { low: number; high: number } | null = null
    if (!calibrating) {
      if (holding && last) band = last
      else {
        // Hẹp khi đường ổn định, rộng và lệch về hướng đang đổi khi đường dốc
        const slope = (curve(i + 3) - curve(i - 3)) / 6
        const widen = 8 + 9 * Math.abs(slope)
        const up = Math.round(widen * (slope >= 0 ? 1.3 : 0.7) * 10) / 10
        const down = Math.round(widen * (slope >= 0 ? 0.7 : 1.3) * 10) / 10
        band = { low: Math.floor(kcal - down), high: Math.ceil(kcal + up) }
      }
      last = band
    }
    out.push({
      date,
      expenditureKcal: kcal,
      fluxLowKcal: band?.low ?? null,
      fluxHighKcal: band?.high ?? null,
      status: calibrating ? 'Calibrating' : holding ? 'Holding' : 'Updating',
      changeKcal: i === 0 ? null : kcal - (out[i - 1]?.expenditureKcal ?? kcal),
    })
  }
  return out
}

/** Insights MÔ PHỎNG cho cùng bộ dữ liệu (chỉ để màn xem trước có số hiện tại, chiến lược và các dòng thay đổi). */
export function syntheticInsights(
  series: readonly ExpenditureSeriesDay[]
): ExpenditureInsightsResponse {
  const last = series[series.length - 1]
  const at = (back: number) => series[Math.max(0, series.length - 1 - back)]
  const change = (days: ExpenditureInsightsResponse['changes'][number]['days']) => ({
    days,
    changeKcal: last.expenditureKcal - at(days).expenditureKcal,
    status: 'NoChange' as const,
  })
  return {
    today: last.date,
    firstDate: series[0]?.date ?? null,
    currentKcal: last.expenditureKcal,
    strategy: last.status,
    holdingReason: null,
    holdingReasonCodes: [],
    calibratingDaysLeft: null,
    loggedDaysLast7: 7,
    weighInDaysLast7: 5,
    changes: ([3, 7, 14, 30, 90] as const).map(change),
  }
}

/**
 * Nhóm Tuần / Tháng và thống kê khung cho dữ liệu MÔ PHỎNG khi KHÔNG có API: lặp lại quy tắc của BE (trung bình kcal học được; dải = average ± nửa độ rộng trung bình của ngày có dải; difference =
 * ngày cuối − ngày đầu) CHỈ để màn xem trước chạy offline. Trang thật không dùng các hàm này: nó đọc \buckets\ và \summary\ do BE trả.
 */
export function syntheticBuckets(
  days: readonly ExpenditureSeriesDay[],
  averaging: Averaging
): ExpenditureSeriesBucket[] {
  if (averaging === 'daily') return []
  return averageExpDays(
    days.map((day) => toExpDay(day, true)),
    averaging,
    'Monday'
  ).map((group) => ({
    start: group.date,
    end: group.end,
    count: group.days,
    average: group.kcal,
    fluxLowKcal: group.fluxLow,
    fluxHighKcal: group.fluxHigh,
  }))
}

export function syntheticSummary(
  days: readonly ExpenditureSeriesDay[],
  from: string | null,
  to: string | null
): { average: number | null; difference: number | null } {
  const inside = days.filter(
    (day) => from !== null && to !== null && day.date >= from && day.date <= to
  )
  if (inside.length === 0) return { average: null, difference: null }
  const average = inside.reduce((sum, day) => sum + day.expenditureKcal, 0) / inside.length
  return {
    average,
    difference:
      inside.length < 2
        ? null
        : inside[inside.length - 1].expenditureKcal - inside[0].expenditureKcal,
  }
}
