// Khớp BE Domain/Enums (JSON dạng chuỗi nhờ JsonStringEnumConverter). Nhãn tiếng Việt cho UI.

export const GENDER = { Male: 'Nam', Female: 'Nữ', Other: 'Khác' } as const
export type Gender = keyof typeof GENDER

export const ACTIVITY_LEVEL = {
  Sedentary: 'Ít vận động',
  LightlyActive: 'Nhẹ (1–3 ngày/tuần)',
  ModeratelyActive: 'Vừa (3–5 ngày/tuần)',
  VeryActive: 'Nhiều (6–7 ngày/tuần)',
  ExtraActive: 'Rất nhiều (lao động nặng + tập)',
} as const
export type ActivityLevel = keyof typeof ACTIVITY_LEVEL

export const UNIT_SYSTEM = { Metric: 'Mét (kg, cm)', Imperial: 'Anh (lb, in)' } as const
export type UnitSystem = keyof typeof UNIT_SYSTEM

export const GOAL_TYPE = { WeightLoss: 'Giảm cân', Maintenance: 'Giữ cân', WeightGain: 'Tăng cân' } as const
export type GoalType = keyof typeof GOAL_TYPE

export const PROGRAM_TYPE = {
  Coached: 'Coached — app tự chia kcal + macro mỗi ngày',
  Collaborative: 'Collaborative — app cho ngân sách tuần, bạn tự chia ngày',
  Manual: 'Manual — bạn tự đặt target, không check-in',
} as const
export type ProgramType = keyof typeof PROGRAM_TYPE

export const DIET_STYLE = {
  Balanced: 'Cân bằng (fat 30 %)',
  LowFat: 'Ít béo (nhiều carb)',
  LowCarb: 'Ít carb (≤ 30 % kcal / 200 g)',
  Keto: 'Keto (carb ≈ 30 g)',
} as const
export type DietStyle = keyof typeof DIET_STYLE

export const PROTEIN_LEVEL = {
  Low: 'Thấp (1.6 g/kg)',
  Moderate: 'Vừa (1.8 g/kg)',
  High: 'Cao (2.0 g/kg)',
  ExtraHigh: 'Rất cao (2.4 g/kg)',
} as const
export type ProteinLevel = keyof typeof PROTEIN_LEVEL

export const DAY_OF_WEEK = {
  Monday: 'Thứ hai',
  Tuesday: 'Thứ ba',
  Wednesday: 'Thứ tư',
  Thursday: 'Thứ năm',
  Friday: 'Thứ sáu',
  Saturday: 'Thứ bảy',
  Sunday: 'Chủ nhật',
} as const
export type DayOfWeek = keyof typeof DAY_OF_WEEK

export const ADJUSTMENT_REASON = {
  Initial: 'Khởi tạo',
  ExpenditureChange: 'Check-in',
  WeightTrend: 'Trend cân',
  Manual: 'Sửa tay',
} as const
export type AdjustmentReason = keyof typeof ADJUSTMENT_REASON

export const enumOptions = <T extends Record<string, string>>(labels: T) =>
  (Object.keys(labels) as (keyof T & string)[]).map((value) => ({ value, label: labels[value] }))
