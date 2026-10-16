import {
  ArrowDown,
  ArrowUp,
  Armchair,
  Beef,
  Bean,
  CalendarDays,
  Check,
  CheckCheck,
  CircleHelp,
  Droplet,
  Dumbbell,
  Egg,
  Equal,
  Footprints,
  Minus,
  PersonStanding,
  Scale,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Star,
  TriangleAlert,
  TrendingDown,
  TrendingUp,
  Venus,
  Mars,
  Waves,
  WheatOff,
  X,
  Zap,
  Drumstick,
  type LucideIcon,
} from 'lucide-react'
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

export interface ChoiceOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly description?: string
  readonly icon: LucideIcon
}

export const SEX_OPTIONS: readonly ChoiceOption<Exclude<Gender, 'Other'>>[] = [
  { value: 'Female', label: 'Nữ', icon: Venus },
  { value: 'Male', label: 'Nam', icon: Mars },
]

export const WEIGHT_HISTORY_OPTIONS: readonly ChoiceOption<WeightHistoryAnswer>[] = [
  { value: 'Yes', label: 'Có', icon: Check },
  { value: 'No', label: 'Chưa', icon: X },
  { value: 'NotSure', label: 'Không chắc', icon: CircleHelp },
]

export const WEIGHT_TREND_OPTIONS: readonly ChoiceOption<WeightTrendAnswer>[] = [
  { value: 'Losing', label: 'Tôi đang giảm cân', icon: ArrowDown },
  { value: 'Gaining', label: 'Tôi đang tăng cân', icon: ArrowUp },
  { value: 'Stable', label: 'Cân nặng của tôi ổn định', icon: Minus },
  { value: 'NotSure', label: 'Không chắc', icon: CircleHelp },
]

export const EXERCISE_OPTIONS: readonly ChoiceOption<ExerciseSessionsBand>[] = [
  { value: 'None', label: '0 buổi / tuần', icon: CalendarDays },
  { value: 'OneToThree', label: '1–3 buổi / tuần', icon: CalendarDays },
  { value: 'FourToSix', label: '4–6 buổi / tuần', icon: CalendarDays },
  { value: 'SevenPlus', label: '7+ buổi / tuần', icon: CalendarDays },
]

export const ACTIVITY_OPTIONS: readonly ChoiceOption<DailyActivityBand>[] = [
  {
    value: 'MostlySedentary',
    label: 'Chủ yếu ngồi nhiều',
    description: 'Thường dưới 5.000 bước mỗi ngày',
    icon: Armchair,
  },
  {
    value: 'ModeratelyActive',
    label: 'Vận động vừa phải',
    description: 'Thường 5.000 – 15.000 bước mỗi ngày',
    icon: Footprints,
  },
  {
    value: 'VeryActive',
    label: 'Rất năng động',
    description: 'Thường trên 15.000 bước mỗi ngày',
    icon: PersonStanding,
  },
]

const experienceOptions = (activity: string): readonly ChoiceOption<ExperienceLevel>[] => [
  { value: 'None', label: 'Chưa có', description: `Hiện không ${activity}`, icon: SignalZero },
  {
    value: 'Beginner',
    label: 'Mới bắt đầu',
    description: `${activity} dưới 1 năm`,
    icon: SignalLow,
  },
  {
    value: 'Intermediate',
    label: 'Trung bình',
    description: `${activity} hơn 1 năm nhưng dưới 4 năm`,
    icon: SignalMedium,
  },
  {
    value: 'Advanced',
    label: 'Nâng cao',
    description: `${activity} từ 4 năm trở lên`,
    icon: SignalHigh,
  },
]

export const LIFTING_OPTIONS = experienceOptions('tập tạ')
export const CARDIO_OPTIONS = experienceOptions('tập cardio')

export const GOAL_OPTIONS: readonly ChoiceOption<
  Extract<GoalType, 'WeightLoss' | 'Maintenance' | 'WeightGain'>
>[] = [
  { value: 'WeightLoss', label: 'Giảm cân', icon: TrendingDown },
  { value: 'Maintenance', label: 'Giữ cân', icon: Equal },
  { value: 'WeightGain', label: 'Tăng cân', icon: TrendingUp },
]

export const DIET_OPTIONS: readonly ChoiceOption<DietStyle>[] = [
  {
    value: 'Balanced',
    label: 'Cân bằng',
    description: 'Phân bổ carb và chất béo ở mức chuẩn',
    icon: Scale,
  },
  {
    value: 'LowFat',
    label: 'Ít béo',
    description: 'Giảm chất béo để ưu tiên carb và đạm',
    icon: Droplet,
  },
  {
    value: 'LowCarb',
    label: 'Ít carb',
    description: 'Giảm carb để ưu tiên chất béo và đạm',
    icon: WheatOff,
  },
  {
    value: 'Keto',
    label: 'Keto',
    description: 'Carb rất thấp để dành chỗ cho chất béo',
    icon: Egg,
  },
]

export const TRAINING_OPTIONS: readonly ChoiceOption<TrainingType>[] = [
  { value: 'None', label: 'Không tập hoặc vận động nhẹ', icon: PersonStanding },
  { value: 'Lifting', label: 'Tập tạ', icon: Dumbbell },
  { value: 'Cardio', label: 'Cardio', icon: Footprints },
  { value: 'Both', label: 'Cardio và tạ', icon: CheckCheck },
]

export const DISTRIBUTION_OPTIONS: readonly ChoiceOption<CalorieShiftMode>[] = [
  {
    value: 'Even',
    label: 'Chia đều',
    description: 'Chia đều mục tiêu kcal cho mọi ngày trong tuần',
    icon: Equal,
  },
  {
    value: 'Custom',
    label: 'Dồn kcal vào ngày chọn',
    description: 'Ăn nhiều hơn vào những ngày bạn chọn, tổng tuần không đổi',
    icon: Waves,
  },
]

export const PROTEIN_OPTIONS: readonly ChoiceOption<ProteinLevel>[] = [
  { value: 'Low', label: 'Thấp', description: 'Ở mức thấp của khoảng tối ưu', icon: Bean },
  { value: 'Moderate', label: 'Vừa', description: 'Ở giữa khoảng tối ưu', icon: Drumstick },
  { value: 'High', label: 'Cao', description: 'Ở mức cao của khoảng tối ưu', icon: Beef },
  { value: 'ExtraHigh', label: 'Rất cao', description: 'Mức khuyến nghị cao nhất', icon: Zap },
]

export const FLOOR_ICON: Record<Exclude<CalorieFloorChoice, 'Off'>, LucideIcon> = {
  Standard: Star,
  Low: TriangleAlert,
}

export const BODY_FAT_BANDS: readonly { value: BodyFatBand; label: string }[] = [
  { value: 'Bf10To13', label: '10–13%' },
  { value: 'Bf14To17', label: '14–17%' },
  { value: 'Bf18To23', label: '18–23%' },
  { value: 'Bf24To28', label: '24–28%' },
  { value: 'Bf29To33', label: '29–33%' },
  { value: 'Bf34To37', label: '34–37%' },
  { value: 'Bf38To42', label: '38–42%' },
  { value: 'Bf43To49', label: '43–49%' },
  { value: 'Bf50Plus', label: '50%+' },
]

export const REFERRAL_OPTIONS: readonly string[] = [
  'Affiliate',
  'YouTube',
  'Reddit',
  'Bạn bè',
  'Instagram',
  'TikTok',
  'Facebook',
  'Khác',
]
