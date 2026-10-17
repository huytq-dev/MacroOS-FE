import type { ComponentType } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Bean,
  Check,
  CheckCheck,
  Dumbbell,
  Egg,
  EggFried,
  Fish,
  Footprints,
  Hamburger,
  Mars,
  Menu,
  Minus,
  Scale,
  Sofa,
  Venus,
  Waves,
  X,
} from 'lucide-react'
import {
  ExperienceAdvanced,
  ExperienceBeginner,
  ExperienceIntermediate,
  ExperienceNone,
  BadgeAlert,
  BadgeStar,
  CalendarMany,
  CalendarOne,
  CalendarThree,
  CalendarZero,
  ScaleGain,
  ScaleKeep,
  ScaleLose,
} from '../components/OnboardingPage/SolidIcons'
import {
  ButterDish,
  Meditator,
  QuestionMark,
  Runner,
  Skate,
  Skewers,
} from '../components/OnboardingPage/LineIcons'
import type {
  BodyFatBand,
  CalorieFloorChoice,
  CalorieShiftMode,
  DailyActivityBand,
  ExerciseSessionsBand,
  ExperienceLevel,
  TrainingType,
  WeightHistoryAnswer,
  WeightTrendAnswer,
} from './onboarding.types'
import type { DietStyle, Gender, GoalType, ProteinLevel } from '@/config/enums'

/** Icon của thẻ chọn: icon lucide hoặc icon tự vẽ, chỉ cần nhận className. */
export type OptionIcon = ComponentType<{ className?: string }>

export interface ChoiceOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly description?: string
  readonly icon: OptionIcon
}

export const SEX_OPTIONS: readonly ChoiceOption<Exclude<Gender, 'Other'>>[] = [
  { value: 'Female', label: 'Female', icon: Venus },
  { value: 'Male', label: 'Male', icon: Mars },
]

export const WEIGHT_HISTORY_OPTIONS: readonly ChoiceOption<WeightHistoryAnswer>[] = [
  { value: 'Yes', label: 'Yes', icon: Check },
  { value: 'No', label: 'Not yet', icon: X },
  { value: 'NotSure', label: 'Not sure', icon: QuestionMark },
]

export const WEIGHT_TREND_OPTIONS: readonly ChoiceOption<WeightTrendAnswer>[] = [
  { value: 'Losing', label: 'I am losing weight', icon: ArrowDown },
  { value: 'Gaining', label: 'I am gaining weight', icon: ArrowUp },
  { value: 'Stable', label: 'My weight is stable', icon: Minus },
  { value: 'NotSure', label: 'Not sure', icon: QuestionMark },
]

export const EXERCISE_OPTIONS: readonly ChoiceOption<ExerciseSessionsBand>[] = [
  { value: 'None', label: '0 sessions / week', icon: CalendarZero },
  { value: 'OneToThree', label: '1–3 sessions / week', icon: CalendarOne },
  { value: 'FourToSix', label: '4–6 sessions / week', icon: CalendarThree },
  { value: 'SevenPlus', label: '7+ sessions / week', icon: CalendarMany },
]

export const ACTIVITY_OPTIONS: readonly ChoiceOption<DailyActivityBand>[] = [
  {
    value: 'MostlySedentary',
    label: 'Mostly sedentary',
    description: 'Usually under 5,000 steps per day',
    icon: Sofa,
  },
  {
    value: 'ModeratelyActive',
    label: 'Moderately active',
    description: 'Usually 5,000 – 15,000 steps per day',
    icon: Footprints,
  },
  {
    value: 'VeryActive',
    label: 'Very active',
    description: 'Usually over 15,000 steps per day',
    icon: Skate,
  },
]

const experienceOptions = (activity: string): readonly ChoiceOption<ExperienceLevel>[] => [
  { value: 'None', label: 'None', description: `Currently not ${activity}`, icon: ExperienceNone },
  {
    value: 'Beginner',
    label: 'Beginner',
    description: `${activity} for under 1 year`,
    icon: ExperienceBeginner,
  },
  {
    value: 'Intermediate',
    label: 'Intermediate',
    description: `${activity} for 1 to 4 years`,
    icon: ExperienceIntermediate,
  },
  {
    value: 'Advanced',
    label: 'Advanced',
    description: `${activity} for 4+ years`,
    icon: ExperienceAdvanced,
  },
]

export const LIFTING_OPTIONS = experienceOptions('lifting')
export const CARDIO_OPTIONS = experienceOptions('doing cardio')

export const GOAL_OPTIONS: readonly ChoiceOption<
  Extract<GoalType, 'WeightLoss' | 'Maintenance' | 'WeightGain'>
>[] = [
  { value: 'WeightLoss', label: 'Lose weight', icon: ScaleLose },
  { value: 'Maintenance', label: 'Maintain weight', icon: ScaleKeep },
  { value: 'WeightGain', label: 'Gain weight', icon: ScaleGain },
]

export const DIET_OPTIONS: readonly ChoiceOption<DietStyle>[] = [
  {
    value: 'Balanced',
    label: 'Balanced',
    description: 'Standard split of carbs and fat',
    icon: Scale,
  },
  {
    value: 'LowFat',
    label: 'Low fat',
    description: 'Less fat to make room for carbs and protein',
    icon: ButterDish,
  },
  {
    value: 'LowCarb',
    label: 'Low carb',
    description: 'Fewer carbs to make room for fat and protein',
    icon: Fish,
  },
  {
    value: 'Keto',
    label: 'Keto',
    description: 'Very low carb to make room for fat',
    icon: EggFried,
  },
]

export const TRAINING_OPTIONS: readonly ChoiceOption<TrainingType>[] = [
  { value: 'None', label: 'No training or light activity', icon: Meditator },
  { value: 'Lifting', label: 'Lifting', icon: Dumbbell },
  { value: 'Cardio', label: 'Cardio', icon: Runner },
  { value: 'Both', label: 'Cardio and lifting', icon: CheckCheck },
]

export const DISTRIBUTION_OPTIONS: readonly ChoiceOption<CalorieShiftMode>[] = [
  {
    value: 'Even',
    label: 'Even',
    description: 'Spread your kcal target evenly across the week',
    icon: Menu,
  },
  {
    value: 'Custom',
    label: 'Shift kcal to chosen days',
    description: 'Eat more on the days you choose; the weekly total stays the same',
    icon: Waves,
  },
]

export const PROTEIN_OPTIONS: readonly ChoiceOption<ProteinLevel>[] = [
  { value: 'Low', label: 'Low', description: 'Low end of the optimal range', icon: Bean },
  { value: 'Moderate', label: 'Moderate', description: 'Middle of the optimal range', icon: Egg },
  { value: 'High', label: 'High', description: 'High end of the optimal range', icon: Hamburger },
  {
    value: 'ExtraHigh',
    label: 'Very high',
    description: 'Highest recommended level',
    icon: Skewers,
  },
]

export const FLOOR_ICON: Record<Exclude<CalorieFloorChoice, 'Off'>, OptionIcon> = {
  Standard: BadgeStar,
  Low: BadgeAlert,
}

export const BODY_FAT_BANDS: readonly {
  value: BodyFatBand
  label: string
  midPercent: number
  description: string
}[] = [
  {
    value: 'Bf10To13',
    label: '10–13%',
    midPercent: 11.5,
    description: 'Very lean, abs clearly visible',
  },
  {
    value: 'Bf14To17',
    label: '14–17%',
    midPercent: 15.5,
    description: 'Fit, abs still visible',
  },
  { value: 'Bf18To23', label: '18–23%', midPercent: 20.5, description: 'Lean, abs faint' },
  {
    value: 'Bf24To28',
    label: '24–28%',
    midPercent: 26,
    description: 'Flat stomach, no visible abs',
  },
  {
    value: 'Bf29To33',
    label: '29–33%',
    midPercent: 31,
    description: 'Stomach starting to soften, slight fold',
  },
  {
    value: 'Bf34To37',
    label: '34–37%',
    midPercent: 35.5,
    description: 'Noticeable belly, fuller waist',
  },
  {
    value: 'Bf38To42',
    label: '38–42%',
    midPercent: 40,
    description: 'Larger belly, clear stomach folds',
  },
  {
    value: 'Bf43To49',
    label: '43–49%',
    midPercent: 46,
    description: 'Large belly, fuller arms and waist',
  },
  { value: 'Bf50Plus', label: '50%+', midPercent: 53, description: 'Very full, thick belly fat' },
]

export const REFERRAL_OPTIONS: readonly string[] = [
  'Affiliate',
  'YouTube',
  'Reddit',
  'Friends',
  'Instagram',
  'TikTok',
  'Facebook',
  'Other',
]
