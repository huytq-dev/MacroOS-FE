// Khớp BE GET /api/nutrients/{code}/series và GET /api/nutrients/{code}/day?date= (Docs/MacroFactor_UI/UI/Dashboard/README.md, mục "Chi tiết nutrient")
import type { GoalKind } from '@/features/nutrition/goal-progress'
import type { TargetProvenance } from '@/features/nutrition/target-provenance'

/** Mục tiêu hiện hành lấy từ đâu: chiến lược (Strategy, calo / macro), người dùng tự đặt, mặc định theo hồ sơ, hay không có. */
export type TargetSource = 'Strategy' | 'Custom' | 'Default' | 'None'

export interface NutrientSeriesDay {
  /** yyyy-MM-dd */
  date: string
  /** null = chưa log ngày đó / không món nào có dữ liệu chất này (không vẽ cột); khác 0. */
  amount: number | null
  /** Calo / macro: chỉ có target của ngày đó; vi chất: target + floor / ceiling hiện hành áp mọi ngày. */
  floor: number | null
  target: number | null
  ceiling: number | null
  /** Chỉ calo / macro: VERIFIED | LEGACY_UNVERIFIED (target chỉ để tham khảo, không vẽ đạt / không đạt; ngày đó bị loại khỏi `averageTarget`); null = chất khác hoặc chưa có target. */
  targetProvenance?: TargetProvenance | null
  isFasting?: boolean
  /** Ngày chưa log đủ: vẫn có `amount` (vẽ cột mờ) nhưng không tính vào trung bình. */
  isIncomplete?: boolean
}

/** Ngày của chuỗi kèm `goalKind` của cả chuỗi (BE chỉ trả loại ở cấp chuỗi): FE điền để mỗi ngày mang đủ bộ mục tiêu cho `NutrientGoalBar`. */
export interface NutrientSeriesPoint extends NutrientSeriesDay {
  goalKind: GoalKind
  /** Nhóm W / M: ngày cuối của nhóm và số ngày đã log đủ trong nhóm (chỉ để nhãn điểm đang chạm). */
  end?: string
  days?: number
}

export interface NutrientSeriesSummary {
  from: string
  to: string
  loggedDays: number
  /** Trung bình mỗi ngày ĐÃ LOG (không tính ngày chưa đủ). */
  average: number | null
  min: number | null
  max: number | null
  averageTarget: number | null
  /** Số ngày hợp lệ bị loại khỏi `averageTarget` vì target LEGACY_UNVERIFIED: > 0 thì hiện "Historical target not verified". */
  unverifiedTargetDays?: number
}

export interface NutrientSeriesResponse {
  code: string
  name: string
  unit: string
  displayPrecision: number
  /** Loại mục tiêu hiệu lực tại `to`. */
  goalKind: GoalKind
  from: string
  to: string
  /** Liên tục tới hôm nay (ngày trống amount = null). */
  days: NutrientSeriesDay[]
  summary: NutrientSeriesSummary
}

export interface NutrientContributor {
  name: string
  amount: number
  entryId?: string
}

/** Lượng chất trong một giờ của ngày (0–23), cho biểu đồ Nutrient Timing. */
export interface NutrientTimingBucket {
  hour: number
  amount: number
}

export interface NutrientDayResponse {
  code: string
  name: string
  unit: string
  displayPrecision: number
  goalKind: GoalKind
  date: string
  amount: number | null
  floor: number | null
  target: number | null
  ceiling: number | null
  targetSource: TargetSource
  /** Chỉ calo / macro (target từ program tại `date`): VERIFIED | LEGACY_UNVERIFIED (chỉ để tham khảo, không đạt / không đạt); null = chất khác hoặc chưa có target. */
  targetProvenance?: TargetProvenance | null
  /** Mô tả mốc dùng (vd. theo program của ngày đó); chỉ để hiển thị thêm. */
  targetBasis?: string | null
  /** Trung bình mỗi ngày đã log trong 7 / 30 ngày tới ngày đang xem; null = chưa có ngày nào. */
  pastWeekAverage: number | null
  pastWeekLoggedDays: number
  pastMonthAverage: number | null
  pastMonthLoggedDays: number
  /** TẤT CẢ món đóng góp trong ngày, nhiều nhất trước (FE lấy top 3 cho thẻ Today). */
  contributors: NutrientContributor[]
  /** 24 phần tử (giờ 0–23). */
  timing: NutrientTimingBucket[]
}
