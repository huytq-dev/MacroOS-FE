import type {
  DailyActivityBand,
  ExerciseSessionsBand,
  WeightTrendAnswer,
} from '@/features/onboarding/types/onboarding.types'

/**
 * Lựa chọn của các biến ảnh hưởng BMR ở More › Expenditure › BMR Equation (`Docs/MacroFactor_UI/UI/More/Expenditure_Settings/05–08`). Giá trị là đáp án hồ sơ
 * của BE (`PUT /onboarding/basics`, cùng enum với wizard) nên Lưu = ghi đúng trường BE đang dùng; chữ theo ảnh MacroFactor (khác chữ của wizard Basics).
 */
export interface SettingChoice<T extends string = string> {
  readonly value: T
  readonly label: string
  readonly description?: string
}

export const ACTIVITY_CHOICES: readonly SettingChoice<DailyActivityBand>[] = [
  {
    value: 'MostlySedentary',
    label: 'Mostly Sedentary',
    description: 'Commonly under 5,000 steps a day',
  },
  {
    value: 'ModeratelyActive',
    label: 'Moderately Active',
    description: 'Commonly 5,000 - 15,000 steps a day',
  },
  {
    value: 'VeryActive',
    label: 'Very Active',
    description: 'Commonly more than 15,000 steps a day',
  },
]

export const EXERCISE_CHOICES: readonly SettingChoice<ExerciseSessionsBand>[] = [
  { value: 'None', label: '0 sessions / week' },
  { value: 'OneToThree', label: '1-3 sessions / week' },
  { value: 'FourToSix', label: '4-6 sessions / week' },
  { value: 'SevenPlus', label: '7+ sessions / week' },
]

export const PRIOR_PROGRESS_CHOICES: readonly SettingChoice<WeightTrendAnswer>[] = [
  { value: 'Gaining', label: 'I have been gaining weight' },
  { value: 'Losing', label: 'I have been losing weight' },
  { value: 'Stable', label: 'I have been weight stable' },
  { value: 'NotSure', label: 'Not sure' },
]

/**
 * Cờ nối hợp đồng BE mới (`GET/PUT /expenditure/settings`, `POST /expenditure/mode`). BE đã code nhưng CHƯA bật tới khi migration S25 được duyệt (API đang chạy chưa
 * có route), nên mặc định TẮT: trang giữ UI chỉ-đọc / mờ như hiện tại. Bật bằng `NEXT_PUBLIC_EXPENDITURE_SETTINGS_API=true` (cài đặt) và
 * `NEXT_PUBLIC_EXPENDITURE_MODE_API=true` (chế độ Dynamic/Static: BE chưa dùng Static trong check-in / target nên bật riêng, sau).
 */
export const EXPENDITURE_SETTINGS_API = process.env.NEXT_PUBLIC_EXPENDITURE_SETTINGS_API === 'true'
export const EXPENDITURE_MODE_API = process.env.NEXT_PUBLIC_EXPENDITURE_MODE_API === 'true'

/** Thuật toán expenditure DUY NHẤT mà BE có (quyết định của user): chỉ hiển thị, KHÔNG có bảng chọn phiên bản và không bao giờ kèm số phiên bản. */
export const ALGORITHM_NAME = 'MacroOS Adaptive Expenditure'

/** Công thức BMR của hợp đồng mới (`bmrEquation`). Khoá `MifflinStJeor` cũ chỉ còn trong `/onboarding/estimate`, KHÔNG phải lựa chọn ở đây. */
export const BMR_EQUATION_CHOICES: readonly SettingChoice<'MacroFactor' | 'Cunningham'>[] = [
  {
    value: 'MacroFactor',
    label: 'MacroFactor Equation',
    description:
      'An equation designed to more accurately calculate your Basal Metabolic Rate (BMR) for the initial expenditure estimate',
  },
  {
    value: 'Cunningham',
    label: 'Cunningham Equation',
    description:
      'Cunningham Equation, developed in 1980, is a widely used equation to estimate Basal Metabolic Rate (BMR)',
  },
]

/** Đúng bốn lựa chọn của MacroFactor (`More/Expenditure_Settings/07`), không thêm câu hỏi nào khác. */
export const ATHLETIC_PURSUITS_CHOICES: readonly SettingChoice<
  'ExerciseRegularly' | 'Athlete' | 'ProfessionalAthlete' | 'NoneOfTheAbove'
>[] = [
  {
    value: 'ExerciseRegularly',
    label: 'I exercise regularly',
    description: 'I exercise recreationally, but do not consider myself to be an athlete',
  },
  {
    value: 'Athlete',
    label: 'I am an athlete',
    description: 'I exercise rigorously and consistently enough to consider myself an athlete',
  },
  {
    value: 'ProfessionalAthlete',
    label: 'I am a professional athlete',
    description: 'I compete in a sport professionally',
  },
  { value: 'NoneOfTheAbove', label: 'None of the above' },
]

/**
 * Giới tính DÙNG CHO BMR: câu hỏi riêng (không phải bản dạng giới ở hồ sơ), chỉ hỏi khi công thức MacroFactor cần và Gender = Other; người dùng tự xác nhận,
 * KHÔNG có mặc định.
 */
export const BMR_SEX_CHOICES: readonly SettingChoice<'Male' | 'Female'>[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
]

/** Đáp án Prior Weight ("Have you ever weighed more than {ngưỡng của BE}?"): lưu qua `PUT /expenditure/settings { weighedMoreThanBefore }`. */
export const PRIOR_WEIGHT_CHOICES: readonly SettingChoice<'Yes' | 'No' | 'NotSure'>[] = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
  { value: 'NotSure', label: 'Not sure' },
]

/** Câu hỏi Prior Weight: số + đơn vị là CỦA BE (`GET /onboarding/prior-weight-question`), FE không tính / đổi đơn vị / làm tròn gì cả. */
export const priorWeightQuestion = (displayValue: number, displayUnit: 'kg' | 'lb') =>
  `Have you ever weighed more than ${displayValue} ${displayUnit}?`

const WEIGHED_LABEL = { Yes: 'Yes', No: 'No', NotSure: 'Not sure' } as const

/**
 * Hàng Prior Weight từ đáp án ĐÃ LƯU + số / đơn vị ĐÃ HIỆN lúc trả lời (MF: "I have never weighed over {n} {unit}"); chưa lưu số (đáp án cũ) thì chỉ nhãn.
 * Đề xuất chữ cho Yes / Not sure cùng khuôn (chờ MOS-Master chốt).
 */
export const priorWeightSummary = (
  answer: 'Yes' | 'No' | 'NotSure',
  shown: number | null,
  unit: 'kg' | 'lb' | null
): string => {
  if (shown === null || unit === null) return WEIGHED_LABEL[answer]
  const amount = `${shown} ${unit}`
  return answer === 'No'
    ? `I have never weighed over ${amount}`
    : answer === 'Yes'
      ? `I have weighed over ${amount}`
      : `Not sure if I have weighed over ${amount}`
}

/** Chưa có cân nặng nào thì BE không có ngưỡng: hàng chỉ đọc với dòng trung tính, KHÔNG số. */
export const PRIOR_WEIGHT_NEEDS_WEIGHT = 'Log your weight to answer this question'

/** Nhãn của giá trị đang lưu (hàng phụ đề); null khi BE chưa có đáp án. */
export const choiceLabel = (
  choices: readonly SettingChoice[],
  value: string | null | undefined
): string | null => choices.find((choice) => choice.value === value)?.label ?? null

/** Công thức BMR BE đang dùng (`GET /onboarding/estimate`): Cunningham khi có mức mỡ, không thì Mifflin-St Jeor. KHÔNG gọi Mifflin là "MacroFactor Equation". */
export const BMR_EQUATIONS = [
  {
    value: 'Cunningham',
    label: 'Cunningham Equation',
    description:
      'Cunningham Equation, developed in 1980, is a widely used equation to estimate Basal Metabolic Rate (BMR)',
  },
  {
    value: 'MifflinStJeor',
    label: 'Mifflin-St Jeor Equation',
    description:
      'Mifflin-St Jeor Equation, developed in 1990, is a widely used equation to estimate Basal Metabolic Rate (BMR)',
  },
] as const
