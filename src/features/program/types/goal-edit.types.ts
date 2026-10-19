// Khớp BE Contract/Models/Goals/GoalEditModels.cs (POST /goals/edit-preview, PUT /goals/edit)

export interface GoalRateBounds {
  /** Slow ≤ slowMax < Standard ≤ standardMax < Fast ≤ fastMax (% cân nặng / tuần, độ lớn); vượt fastMax bị từ chối. */
  slowMaxPercent: number
  standardMaxPercent: number
  fastMaxPercent: number
  /** Gợi ý khi user chưa chọn (giữa dải Standard). */
  defaultPercent: number
}

/** `changed = false` khi from = to ("No Change"). */
export interface GoalEditChange {
  from: number | null
  to: number | null
  changed: boolean
}

export type RateBand = 'Slow' | 'Standard' | 'Fast' | 'None'

/** Nguồn sự thật duy nhất của mọi con số màn Edit Goal. Tốc độ có DẤU: dương = tăng cân, âm = giảm. */
export interface GoalEditPreview {
  /** Loại goal suy ra từ đích so với cân hiện tại. */
  goalType: string
  currentGoalType: string
  currentWeightKg: number
  /** Ngày bắt đầu goal hiện tại; = hôm nay khi `requiresNewProgram`. */
  startDate: string
  targetWeightKg: number | null
  weeklyRatePercent: number
  weeklyRateKg: number
  monthlyRateKg: number
  monthlyRatePercent: number
  /** null với program Manual (đặt tay) hoặc khi chưa có TDEE. */
  initialDailyBudgetKcal: number | null
  /** Lạc quan (hôm nay + |đích − cân| ÷ tốc độ/tuần); null khi giữ cân hoặc chưa có đích. */
  projectedEndDate: string | null
  rateBounds: GoalRateBounds
  rateBand: RateBand
  goalTypeChanged: boolean
  /** Đổi hướng goal: không sửa tại chỗ, chuyển sang wizard New Program. */
  requiresNewProgram: boolean
  isManualProgram: boolean
  changes: { weight: GoalEditChange; rate: GoalEditChange }
}

export interface GoalEditPreviewRequest {
  targetWeightKg?: number | null
  /** Độ lớn (dương), BE đặt dấu theo hướng goal. */
  weeklyRatePercent?: number | null
}

export interface GoalEditRequest {
  targetWeightKg: number | null
  weeklyRatePercent: number
}

export interface GoalEditResult {
  requiresNewProgram: boolean
}
