import type { Feasibility } from '@/features/program/types/feasibility.types'
import type {
  DayOfWeek,
  DietStyle,
  Gender,
  GoalType,
  ProteinLevel,
  UnitSystem,
} from '@/config/enums'

// Khớp BE Domain/Enums/Users/OnboardingEnums.cs
export type WeightHistoryAnswer = 'Yes' | 'No' | 'NotSure'
export type WeightTrendAnswer = 'Losing' | 'Gaining' | 'Stable' | 'NotSure'
export type BodyFatBand =
  | 'Bf10To13'
  | 'Bf14To17'
  | 'Bf18To23'
  | 'Bf24To28'
  | 'Bf29To33'
  | 'Bf34To37'
  | 'Bf38To42'
  | 'Bf43To49'
  | 'Bf50Plus'
export type ExerciseSessionsBand = 'None' | 'OneToThree' | 'FourToSix' | 'SevenPlus'
export type DailyActivityBand = 'MostlySedentary' | 'ModeratelyActive' | 'VeryActive'
export type ExperienceLevel = 'None' | 'Beginner' | 'Intermediate' | 'Advanced'
export type CalorieFloorChoice = 'Standard' | 'Low' | 'Off'
export type TrainingType = 'None' | 'Lifting' | 'Cardio' | 'Both'
export type CalorieShiftMode = 'Even' | 'Custom'

// Khớp BE Contract/Models/Onboarding/OnboardingModels.cs
export interface OnboardingState {
  state: 'NotStarted' | 'InProgress' | 'Completed' | 'Skipped'
  step: number
  isRequired: boolean
  hasProgram: boolean
  consentAccepted: boolean
  gender: Gender | null
  dateOfBirth: string | null
  heightCm: number | null
  weightKg: number | null
  unitPreference: UnitSystem
  weighedMoreThanBefore: WeightHistoryAnswer | null
  recentWeightTrend: WeightTrendAnswer | null
  bodyFat: BodyFatBand | null
  exerciseSessions: ExerciseSessionsBand | null
  dailyActivity: DailyActivityBand | null
  liftingExperience: ExperienceLevel | null
  cardioExperience: ExperienceLevel | null
}

export interface TdeeEstimate {
  tdeeKcal: number
  bmrKcal: number
  /** BE: Cunningham khi user đã chọn mức mỡ cơ thể, không thì Mifflin-St Jeor. */
  method: 'MifflinStJeor' | 'Cunningham'
  weightKg: number
  /** % mỡ BE đã dùng (điểm giữa của dải user chọn); null khi không dùng công thức theo mỡ. */
  bodyFatPercent: number | null
}

export interface ProgramPreviewDay {
  dayOfWeek: DayOfWeek
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface ProgramPreview {
  tdeeKcal: number
  averageCalories: number
  proteinGPerKg: number
  weeklyChangeKg: number
  weeklyChangePercent: number
  projectedEndDate: string | null
  floorStandardKcal: number
  floorLowKcal: number
  currentWeightKg: number
  days: ProgramPreviewDay[]
  /** Kiểm khả thi của BE (HTTP 200, không ném lỗi): `isFeasible = false` thì Create sẽ bị 400 cùng object này; thiếu = BE cũ. */
  feasibility?: Feasibility | null
}

/**
 * Phần của bản xem trước mà các màn Goal (đích + tốc độ, tóm tắt) cần: ngân sách kcal ban đầu (null = chưa có TDEE hoặc program Manual
 * không có ngân sách tự động) và ngày dự kiến. Onboarding dựng từ `ProgramPreview`, Edit Goal từ `GoalEditPreview` của BE.
 */
export interface GoalPreview {
  readonly budgetKcal: number | null
  readonly projectedEndDate: string | null
}

// Khớp BE SaveOnboardingBasicsCommand (trường nào gửi mới cập nhật)
/**
 * Phản hồi `PUT /onboarding/basics` (BE cộng thêm, BE cũ trả `{}` nên mọi trường tuỳ chọn). `weightKept` true CHỈ khi đã gửi cân nặng, hôm nay đã có lần cân
 * và hai số khác nhau (so ở 1 chữ số trong đơn vị hiển thị — BE quyết định, FE không tự so): BE giữ số đã lưu, FE báo ngắn.
 */
export interface SaveBasicsResponse {
  weightKept?: boolean
  storedWeightKg?: number | null
  storedWeightDisplay?: number | null
  displayUnit?: 'kg' | 'lb'
}

export interface SaveBasicsRequest {
  step: number
  gender?: Gender
  dateOfBirth?: string
  heightCm?: number
  weightKg?: number
  unitPreference?: UnitSystem
  weighedMoreThanBefore?: WeightHistoryAnswer
  recentWeightTrend?: WeightTrendAnswer
  bodyFat?: BodyFatBand
  exerciseSessions?: ExerciseSessionsBand
  dailyActivity?: DailyActivityBand
  liftingExperience?: ExperienceLevel
  cardioExperience?: ExperienceLevel
  referralSource?: string
  affiliateCode?: string
  /** Ngưỡng ĐÃ HIỆN cho câu Prior Weight (1–2000) + đơn vị của nó; gửi CÙNG `weighedMoreThanBefore`, đúng số đã hiện (BE v2, sau cờ PRIOR_WEIGHT_API). */
  priorWeightThresholdShown?: number
  priorWeightThresholdUnit?: 'kg' | 'lb'
}

/** `GET /onboarding/prior-weight-question`: số BE tính (nguồn duy nhất) để hiện trong câu "Have you ever weighed more than …?". `policy` không hiện ra giao diện. */
export interface PriorWeightQuestion {
  weightKg: number
  thresholdKgExact: number
  displayValue: number
  displayUnit: 'kg' | 'lb'
  policy: string
}

// Khớp BE PreviewProgramQuery
export interface PreviewRequest {
  goalType: GoalType
  targetWeightKg: number | null
  weeklyRatePercent: number
  dietStyle: DietStyle
  proteinLevel: ProteinLevel
  calorieFloor: CalorieFloorChoice
  trainingType: TrainingType
  shiftMode: CalorieShiftMode
  shiftDays: DayOfWeek[] | null
  shiftPercent: number | null
  manualTdeeKcal: number | null
}

// Khớp BE CompleteOnboardingCommand
export interface CompleteRequest {
  acceptHealthDisclaimer: boolean
  acceptPrivacyNotice: boolean
}

/** Ba đáp án Basics có giá trị GỢI Ý ban đầu cho bánh xe: chỉ được tính là đã trả lời (và mới được gửi BE) khi người dùng chạm vào hoặc bấm xác nhận. */
export interface ConfirmedBasics {
  dateOfBirth: boolean
  heightCm: boolean
  weightKg: boolean
}

/**
 * Cân mục tiêu và tốc độ chỉ là GỢI Ý (±10 % cân hiện tại, 0.5 %BW/tuần) cho tới khi người dùng kéo / gõ hoặc bấm "Use these values": chỉ giá trị đã xác nhận
 * mới được coi là đáp án (mở nút Next, vào yêu cầu tạo program). Đổi loại mục tiêu hoặc cân nặng thì cả hai về chưa xác nhận.
 */
export interface GoalConfirmed {
  targetWeightKg: boolean
  weeklyRatePercent: boolean
}

/** Đáp án đang soạn của wizard; Basics lưu BE từng bước, Goal/Program giữ ở đây tới khi tạo program. */
export interface WizardAnswers {
  gender: Gender | null
  /** Ngày sinh / chiều cao / cân nặng: giá trị trên bánh xe; có thể chỉ là gợi ý — xem `confirmed`. */
  dateOfBirth: string | null
  heightCm: number
  weightKg: number
  confirmed: ConfirmedBasics
  unit: UnitSystem
  weighedMoreThanBefore: WeightHistoryAnswer | null
  /** Số + đơn vị BE đã đưa ra trong câu Prior Weight lúc người dùng trả lời (nhánh BE v2); null ở nhánh cũ. Gửi BE đúng như đã hiện. */
  priorWeightThresholdShown: number | null
  priorWeightThresholdUnit: 'kg' | 'lb' | null
  recentWeightTrend: WeightTrendAnswer | null
  bodyFat: BodyFatBand | null
  exerciseSessions: ExerciseSessionsBand | null
  dailyActivity: DailyActivityBand | null
  liftingExperience: ExperienceLevel | null
  cardioExperience: ExperienceLevel | null
  referralSource: string | null
  affiliateCode: string
  manualTdeeKcal: number | null
  goalType: GoalType | null
  /** Giá trị cân mục tiêu / tốc độ trên màn hình: có thể chỉ là gợi ý, xem `goalConfirmed`. */
  targetWeightKg: number | null
  weeklyRatePercent: number
  goalConfirmed: GoalConfirmed
  dietStyle: DietStyle | null
  calorieFloor: CalorieFloorChoice | null
  trainingType: TrainingType | null
  shiftMode: CalorieShiftMode
  shiftDays: DayOfWeek[]
  shiftPercent: number
  proteinLevel: ProteinLevel | null
}

export type StepId =
  | 'intro'
  | 'sex'
  | 'birth'
  | 'height'
  | 'weight'
  | 'weightHistory'
  | 'weightTrend'
  | 'bodyFat'
  | 'exercise'
  | 'activity'
  | 'lifting'
  | 'cardio'
  | 'estimate'
  | 'value'
  | 'referral'
  | 'goalType'
  | 'goalTarget'
  | 'goalSummary'
  | 'diet'
  | 'floor'
  | 'training'
  | 'distribution'
  | 'protein'
  | 'ready'
  | 'carousel'
  | 'whatYouGet'
  | 'plan'
  | 'first30'
  | 'consent'

export type SectionId = 'intro' | 'basics' | 'goal' | 'program' | 'finish'

/** Thứ tự bước theo luồng MacroFactor (màn Apple Health bỏ vì chưa có tích hợp). */
export const STEP_ORDER: readonly StepId[] = [
  'intro',
  'sex',
  'birth',
  'height',
  'weight',
  'weightHistory',
  'weightTrend',
  'bodyFat',
  'exercise',
  'activity',
  'lifting',
  'cardio',
  'estimate',
  'value',
  'referral',
  'goalType',
  'goalTarget',
  'goalSummary',
  'diet',
  'floor',
  'training',
  'distribution',
  'protein',
  'ready',
  'carousel',
  'whatYouGet',
  'plan',
  'first30',
  'consent',
]

export const SECTION_OF: Record<StepId, SectionId> = {
  intro: 'intro',
  sex: 'basics',
  birth: 'basics',
  height: 'basics',
  weight: 'basics',
  weightHistory: 'basics',
  weightTrend: 'basics',
  bodyFat: 'basics',
  exercise: 'basics',
  activity: 'basics',
  lifting: 'basics',
  cardio: 'basics',
  estimate: 'basics',
  value: 'basics',
  referral: 'basics',
  goalType: 'goal',
  goalTarget: 'goal',
  goalSummary: 'goal',
  diet: 'program',
  floor: 'program',
  training: 'program',
  distribution: 'program',
  protein: 'program',
  ready: 'program',
  carousel: 'finish',
  whatYouGet: 'finish',
  plan: 'finish',
  first30: 'finish',
  consent: 'finish',
}

export const SECTION_TITLE: Record<SectionId, string> = {
  intro: '',
  basics: 'Basics',
  goal: 'Set New Goal',
  program: 'Set New Program',
  finish: '',
}
