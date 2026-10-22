import type { WeightTrendInsightsResponse } from './types/weight-trend.types'

/** Các mốc N ngày của bảng "Changes" (3 / 7 / 14 / 30 / 90). */
export const WEIGHT_CHANGE_DAYS = [3, 7, 14, 30, 90] as const

/**
 * Tốc độ / thâm hụt / dự báo của Weight Trend đúng như BE: khi `rateReasonCode` khác null (chưa đủ cân thật hoặc đã lâu không cân) cả ba là null
 * (hiện "---", không bao giờ 0), kể cả khi payload vô tình còn số; `waiting` là câu giải thích lấy từ các số đếm của BE.
 */
export function weightRates(info: WeightTrendInsightsResponse | null | undefined) {
  const code = info?.rateReasonCode ?? null
  if (!info || code !== null)
    return { weeklyChange: null, energyKcal: null, projection: null, waiting: waitingText(info) }
  return {
    weeklyChange: info.weeklyChangeKg,
    energyKcal: info.energyDeficitKcalPerDay,
    projection: info.projected30DaysKg,
    waiting: null,
  }
}

/** Câu "Waiting" cho tốc độ cân nặng; null khi BE đã tính được (hoặc chưa có dữ liệu để nói). */
export function waitingText(info: WeightTrendInsightsResponse | null | undefined): string | null {
  const code = info?.rateReasonCode ?? null
  if (!info || code === null) return null
  const window = info.rateWindowDays ?? 20
  if (code === 'STALE_WEIGHT_DATA') {
    const recency = info.recencyDays ?? 7
    const since =
      info.daysSinceLastWeighIn == null
        ? ''
        : ` (last was ${info.daysSinceLastWeighIn} ${info.daysSinceLastWeighIn === 1 ? 'day' : 'days'} ago)`
    return `Waiting for a new weigh-in: none in the last ${recency} days${since}.`
  }
  const min = info.minWeighIns ?? 3
  const count = info.weighInCount ?? 0
  if (count < min)
    return `Waiting for more weigh-ins: ${count} of ${min} needed in the last ${window} days.`
  return `Waiting for more history: weigh-ins need to span at least ${info.minSpanDays ?? 7} days.`
}

export type WeightMove = 'up' | 'down' | 'same'

/** Hướng đổi của xu hướng cân giữa hai lần cân liền nhau: dưới 0.05 kg coi là không đổi. */
export const moveOf = (delta: number | null): WeightMove =>
  delta === null || Math.abs(delta) < 0.05 ? 'same' : delta > 0 ? 'up' : 'down'
