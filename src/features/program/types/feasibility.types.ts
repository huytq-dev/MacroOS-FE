import type { DayOfWeek } from '@/config/enums'

// Khớp BE Contract/Models/Programs/{FeasibilityResponse,FeasibilityViolationModel,FeasibilityWarningModel,ProgramDayModel}.cs.
// MỘT dạng cho preview (200, trường `feasibility` của Onboarding / Draft / Edit Goal / Check-in preview) và cho 400 của Create / UpdateGoal /
// EditGoal / SetManual / Check-in Accept (cùng object trong `data`, không ghi gì). BE không bao giờ tự đổi shift / protein / fat / sàn: chỉ đề xuất.

// Các mã là chuỗi (BE có thể thêm mã mới; mã lạ bị bỏ ở chỗ dùng, không đoán):
//  - reasonCode / reasonCodes / violation.code: INVALID_CALORIE_TARGET | MACRO_BUDGET_EXCEEDED | CALORIE_SHIFT_INFEASIBLE | INFEASIBLE_PROGRAM
//  - violation.detail: NON_POSITIVE_CALORIES | BELOW_FLOOR | MACRO_EXCEEDS_CALORIES | NEGATIVE_MACRO | WEEKLY_BUDGET_NOT_CONSERVED
//  - suggestedAction: REDUCE_SHIFT | USE_EVEN_DISTRIBUTION | ADJUST_GOAL_RATE | UNLOCK_DAYS
//  - actions: ADJUST_GOAL_RATE | ADJUST_CALORIES | ADJUST_MACRO_PREFERENCES | REDUCE_SHIFT | USE_EVEN_DISTRIBUTION | UNLOCK_DAYS

export interface FeasibilityViolation {
  code: string
  detail: string
  /** null = vi phạm ở target tuần. */
  day: DayOfWeek | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  macroKcal: number
  /** kcal tối thiểu để đủ macro hiện tại (chỉ khi macro vượt kcal). */
  minFeasibleCalories: number | null
  /** Sàn kcal đang áp dụng; null = không có sàn. */
  floorKcal: number | null
}

/** Cảnh báo KHÔNG chặn của target user tự nhập (Manual / Collaborative): macro lệch kcal; BE không đổi giá trị của user. */
export interface FeasibilityWarning {
  code: string
  day: DayOfWeek | null
  calories: number
  macroKcal: number
  /** macroKcal − calories (dương = macro nhiều hơn kcal). */
  differenceKcal: number
  toleranceKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  message: string
}

/** Một ngày của `ProgramDayModel`. */
export interface FeasibilityDay {
  dayOfWeek: DayOfWeek
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  isLocked: boolean
}

export interface Feasibility {
  isFeasible: boolean
  reasonCode: string | null
  reasonCodes: string[]
  violations: FeasibilityViolation[]
  affectedDays: DayOfWeek[]
  currentShiftPercent: number | null
  /** % shift LỚN NHẤT còn hợp lệ với đúng các ngày đã chọn (BE kiểm lại, bước 0.01). */
  suggestedShiftPercent: number | null
  suggestedAction: string | null
  actions: string[]
  /** 7 ngày với cấu hình hiện tại (kể cả ngày không hợp lệ): "trước". */
  currentDailyTargets: FeasibilityDay[]
  /** 7 ngày nếu áp dụng `suggestedAction` (BE đã kiểm hợp lệ); rỗng nếu không có đề xuất: "sau". Chỉ áp dụng khi user xác nhận. */
  proposedDailyTargets: FeasibilityDay[]
  /** Warnings không chặn (luôn là mảng). */
  warnings: FeasibilityWarning[]
  message: string | null
}
