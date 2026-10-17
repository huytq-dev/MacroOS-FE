// Khớp BE Domain/Enums (JSON dạng chuỗi nhờ JsonStringEnumConverter). Nhãn tiếng Việt cho UI.

export const GENDER = { Male: 'Male', Female: 'Female', Other: 'Other' } as const
export type Gender = keyof typeof GENDER

export const ACTIVITY_LEVEL = {
  Sedentary: 'Sedentary',
  LightlyActive: 'Lightly active (1–3 days/week)',
  ModeratelyActive: 'Moderately active (3–5 days/week)',
  VeryActive: 'Very active (6–7 days/week)',
  ExtraActive: 'Extra active (physical job + training)',
} as const
export type ActivityLevel = keyof typeof ACTIVITY_LEVEL

export const UNIT_SYSTEM = { Metric: 'Metric (kg, cm)', Imperial: 'Imperial (lb, in)' } as const
export type UnitSystem = keyof typeof UNIT_SYSTEM

export const GOAL_TYPE = {
  WeightLoss: 'Lose weight',
  Maintenance: 'Maintain weight',
  WeightGain: 'Gain weight',
} as const
export type GoalType = keyof typeof GOAL_TYPE

export const PROGRAM_TYPE = {
  Coached: 'Coached — the app sets your kcal + macros each day',
  Collaborative: 'Collaborative — the app sets a weekly budget, you split it across days',
  Manual: 'Manual — you set your own targets, no check-ins',
} as const
export type ProgramType = keyof typeof PROGRAM_TYPE

export const DIET_STYLE = {
  Balanced: 'Balanced (30% fat)',
  LowFat: 'Low fat (high carb)',
  LowCarb: 'Low carb (≤ 30% kcal / 200 g)',
  Keto: 'Keto (carb ≈ 30 g)',
} as const
export type DietStyle = keyof typeof DIET_STYLE

export const PROTEIN_LEVEL = {
  Low: 'Low (1.6 g/kg)',
  Moderate: 'Moderate (1.8 g/kg)',
  High: 'High (2.0 g/kg)',
  ExtraHigh: 'Very high (2.4 g/kg)',
} as const
export type ProteinLevel = keyof typeof PROTEIN_LEVEL

export const DAY_OF_WEEK = {
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
  Sunday: 'Sunday',
} as const
export type DayOfWeek = keyof typeof DAY_OF_WEEK

export const ADJUSTMENT_REASON = {
  Initial: 'Initial',
  ExpenditureChange: 'Check-in',
  WeightTrend: 'Weight trend',
  Manual: 'Manual edit',
} as const
export type AdjustmentReason = keyof typeof ADJUSTMENT_REASON

export const enumOptions = <T extends Record<string, string>>(labels: T) =>
  (Object.keys(labels) as (keyof T & string)[]).map((value) => ({ value, label: labels[value] }))

export const FOOD_CATEGORY = {
  Grains: 'Grains',
  Vegetables: 'Vegetables',
  Fruits: 'Fruits',
  Dairy: 'Dairy',
  Protein: 'Protein',
  Fats: 'Fats',
  Beverages: 'Beverages',
  Snacks: 'Snacks',
  FastFood: 'Fast food',
  Supplements: 'Supplements',
  Other: 'Other',
} as const
export type FoodCategory = keyof typeof FOOD_CATEGORY

export const MEAL_TYPE = {
  Breakfast: 'Breakfast',
  MorningSnack: 'Morning snack',
  Lunch: 'Lunch',
  AfternoonSnack: 'Afternoon snack',
  Dinner: 'Dinner',
  EveningSnack: 'Evening snack',
} as const
export type MealType = keyof typeof MEAL_TYPE

/** Bữa theo giờ "HH:mm" (giờ ăn là nguồn chính, bữa suy ra từ đó); ngưỡng khớp BE: <10:00, <11:30, <14:00, <17:00, <21:00. */
export const mealForTime = (time: string): MealType => {
  const minutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
  if (minutes < 10 * 60) return 'Breakfast'
  if (minutes < 11 * 60 + 30) return 'MorningSnack'
  if (minutes < 14 * 60) return 'Lunch'
  if (minutes < 17 * 60) return 'AfternoonSnack'
  if (minutes < 21 * 60) return 'Dinner'
  return 'EveningSnack'
}

/** Giờ gợi ý khi mở thêm món từ nút + của một bữa cụ thể. */
export const MEAL_DEFAULT_TIME: Record<MealType, string> = {
  Breakfast: '07:00',
  MorningSnack: '10:00',
  Lunch: '12:00',
  AfternoonSnack: '15:00',
  Dinner: '18:30',
  EveningSnack: '21:00',
}

export const FOOD_SCOPE = { All: 'All', Mine: 'Mine', System: 'System' } as const
export type FoodScope = keyof typeof FOOD_SCOPE
