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
  method: 'MifflinStJeor' | 'KatchMcArdle'
  weightKg: number
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
}

// Khớp BE SaveOnboardingBasicsCommand (trường nào gửi mới cập nhật)
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

/** Đáp án đang soạn của wizard; Basics lưu BE từng bước, Goal/Program giữ ở đây tới khi tạo program. */
export interface WizardAnswers {
  gender: Gender | null
  dateOfBirth: string | null
  heightCm: number
  weightKg: number
  unit: UnitSystem
  weighedMoreThanBefore: WeightHistoryAnswer | null
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
  targetWeightKg: number | null
  weeklyRatePercent: number
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
  goal: 'Set a new goal',
  program: 'Create a new program',
  finish: '',
}
