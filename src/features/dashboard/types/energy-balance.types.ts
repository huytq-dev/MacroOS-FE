// Khớp BE GET /api/energy-balance/series và GET /api/energy-balance/insights (Docs/Design/Energy_Balance.md)

import type { TargetProvenance } from '@/features/nutrition/target-provenance'

export type ExpenditureBalanceStatus = 'Deficit' | 'Surplus' | 'Balanced' | 'Waiting'
export type TargetBalanceStatus = 'BelowTarget' | 'AboveTarget' | 'OnTarget' | 'Waiting'

export interface EnergyBalanceSeriesDay {
  /** yyyy-MM-dd; LIÊN TỤC mọi ngày from..to (<= hôm nay). */
  date: string
  /** null = chưa log; nhịn ăn = 0. */
  caloriesKcal: number | null
  expenditureKcal: number | null
  /** Target CỦA NGÀY ĐÓ (không phải target hiện tại). */
  targetKcal: number | null
  /** calories − expenditure (âm = Deficit). */
  vsExpenditureKcal: number | null
  /** calories − target (âm = Below Target). */
  vsTargetKcal: number | null
  /** VERIFIED | LEGACY_UNVERIFIED | null (chưa có target): LEGACY_UNVERIFIED thì `targetKcal` / `vsTargetKcal` chỉ để tham khảo, không vẽ đạt / không đạt; ngày đó không vào thống kê so với target. */
  targetProvenance?: TargetProvenance | null
  isFasting: boolean
  /** Có số nhưng KHÔNG tính vào trung bình / insights. */
  isIncomplete: boolean
}

/**
 * Thống kê khoảng do BE tính (`Contract/Models/EnergyBalance/EnergyBalanceSummary.cs`): mọi trung bình là trung bình mỗi ngày ĐÃ LOG HỢP LỆ
 * trong khoảng (BE quyết định ngày nào hợp lệ); trung bình chênh lệch chỉ tính các ngày có cả calories lẫn mốc so sánh. FE hiển thị nguyên số này.
 */
export interface EnergyBalanceSummary {
  from: string
  to: string
  loggedDays: number
  /** Trung bình kcal của MỌI ngày hợp lệ (BE giữ để tương thích): KHÔNG dùng làm số "Dinh dưỡng" của thẻ, vì không cùng tập ngày với mốc so sánh. */
  avgCaloriesKcal: number | null
  avgExpenditureKcal: number | null
  avgTargetKcal: number | null
  /** Tab Expenditure: kcal trung bình CHỈ trên các ngày có cả kcal lẫn expenditure, nên `avgCaloriesVsExpenditureKcal − avgExpenditureKcal = avgVsExpenditureKcal`. */
  avgCaloriesVsExpenditureKcal: number | null
  /** Tab Target: tương tự, cùng tập với `avgTargetKcal` / `avgVsTargetKcal`. */
  avgCaloriesVsTargetKcal: number | null
  avgVsExpenditureKcal: number | null
  totalVsExpenditureKcal: number | null
  vsExpenditureDays: number
  vsExpenditureStatus: ExpenditureBalanceStatus
  avgVsTargetKcal: number | null
  vsTargetDays: number
  vsTargetStatus: TargetBalanceStatus
  /** Số ngày hợp lệ có target LEGACY_UNVERIFIED, bị LOẠI khỏi mọi thống kê so với target: > 0 thì hiện "Historical target not verified". */
  unverifiedTargetDays?: number
}

export interface EnergyBalanceSeriesResponse {
  from: string
  to: string
  days: EnergyBalanceSeriesDay[]
  summary: EnergyBalanceSummary
}

export interface EnergyBalanceInsightRow<Status> {
  days: 3 | 7 | 14 | 30 | 90
  /** Trung bình mỗi ngày ĐÃ LOG trong cửa sổ N ngày kết thúc hôm nay. */
  avgKcal: number | null
  loggedDays: number
  status: Status
  /** Chỉ relativeToTargets: số ngày có target LEGACY_UNVERIFIED đã bị loại (Waiting nếu chỉ còn ngày chưa xác minh); luôn 0 với Expenditure. */
  unverifiedDays?: number
}

export interface EnergyBalanceInsightsResponse {
  today: string
  relativeToExpenditure: EnergyBalanceInsightRow<ExpenditureBalanceStatus>[]
  relativeToTargets: EnergyBalanceInsightRow<TargetBalanceStatus>[]
}
