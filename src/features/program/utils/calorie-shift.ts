import type { DayOfWeek } from '@/config/enums'
import { getApiError } from '@/lib/api'
import type { EnergyUnit, Measure } from '@/lib/units'
import type { Feasibility } from '../types/feasibility.types'
import type { Program, UpdateProgramGoalRequest } from '../types/program.types'
import { WEEK_DAYS } from './day-macros'
import { isShiftInfeasible, parseFeasibility, proposalRows, type ProposalRow } from './feasibility'

/**
 * Thanh trượt "% kcal thêm vào các ngày chọn" của kiểu phân bổ Custom. DistributionStep và các gợi ý sửa của BE dùng chung một nguồn
 * để không bao giờ đặt ra giá trị mà thanh trượt không chọn được.
 */
export const SHIFT_PERCENT = { min: 5, max: 30, step: 1 } as const

export type ShiftViolationCode = 'NON_POSITIVE_CALORIES' | 'BELOW_FLOOR' | 'CARBS_BELOW_ZERO'

export interface ShiftViolation {
  readonly day: DayOfWeek
  readonly code: ShiftViolationCode
  /** kcal của ngày sau khi dịch. */
  readonly calories: number
  /** Carbs (g) sau khi dịch, CHƯA kẹp về 0. */
  readonly carbsG: number | null
}

/** Cách sửa BE đề xuất (`FeasibilityResponse.actions`): giảm % (kèm `suggestedShiftPercent`) hoặc chia đều; chỉ áp khi user xác nhận. */
export type ShiftOption =
  | { readonly code: 'REDUCE_PERCENT'; readonly maxPercent: number }
  | { readonly code: 'USE_EVEN_DISTRIBUTION' }

/** Calorie Shift làm một số ngày không hợp lệ: `FeasibilityResponse` (preview 200 hoặc `data` của 400) do shift, rút gọn cho màn sửa. */
export interface CalorieShiftProblem {
  readonly floorKcal: number | null
  /** % shift đang cấu hình. */
  readonly percent: number | null
  readonly violations: readonly ShiftViolation[]
  readonly options: readonly ShiftOption[]
  /** Bảng 7 ngày "trước / sau" của đề xuất BE; rỗng khi BE không đề xuất. */
  readonly proposal?: readonly ProposalRow[]
}

/**
 * `FeasibilityResponse` do Calorie Shift → vấn đề: vi phạm theo ngày, `suggestedShiftPercent` thành option REDUCE_PERCENT, `USE_EVEN_DISTRIBUTION`
 * thành option chia đều, kèm bảng trước / sau của BE. null khi khả thi hoặc không phải do shift. Mã lạ bị bỏ, không dựng nút từ dữ liệu không hiểu.
 */
export const calorieShiftProblemOfFeasibility = (
  feasibility: Feasibility | null | undefined
): CalorieShiftProblem | null => {
  if (!feasibility || feasibility.isFeasible || !isShiftInfeasible(feasibility)) return null
  const options: ShiftOption[] = []
  if (feasibility.actions.includes('REDUCE_SHIFT') && feasibility.suggestedShiftPercent !== null)
    options.push({ code: 'REDUCE_PERCENT', maxPercent: feasibility.suggestedShiftPercent })
  if (feasibility.actions.includes('USE_EVEN_DISTRIBUTION'))
    options.push({ code: 'USE_EVEN_DISTRIBUTION' })
  return {
    floorKcal: feasibility.violations.find((item) => item.floorKcal !== null)?.floorKcal ?? null,
    percent: feasibility.currentShiftPercent,
    violations: feasibility.violations.flatMap((item): ShiftViolation[] => {
      if (item.day === null) return []
      const code: ShiftViolationCode | null =
        item.detail === 'NON_POSITIVE_CALORIES' || item.detail === 'BELOW_FLOOR'
          ? item.detail
          : item.detail === 'NEGATIVE_MACRO'
            ? 'CARBS_BELOW_ZERO'
            : null
      return code ? [{ day: item.day, code, calories: item.calories, carbsG: item.carbsG }] : []
    }),
    options,
    proposal: proposalRows(feasibility),
  }
}

/**
 * Yêu cầu `PUT /programs/goal` áp shift nhỏ hơn BE đề xuất (REDUCE_SHIFT), CHỈ gọi sau khi user xác nhận: gửi lại đúng các ngày đang lưu và `suggestedShiftPercent`
 * (BE đã kiểm lại; chỉ có shift nên không tính lại target tuần). null khi không áp được: BE không đề xuất, % ngoài thanh trượt / không thấp hơn % đang lưu,
 * hoặc program không trả cấu hình shift (BE cũ) / số ngày ngoài 1–6 (BE từ chối) — không bao giờ đoán ngày.
 */
export const reduceShiftRequestOf = (
  program: Pick<Program, 'calorieShiftMode' | 'calorieShiftDays' | 'calorieShiftPercent'>,
  feasibility: Feasibility
): UpdateProgramGoalRequest | null => {
  const percent = feasibility.suggestedShiftPercent
  const days = program.calorieShiftDays
  if (
    !feasibility.actions.includes('REDUCE_SHIFT') ||
    percent === null ||
    percent < SHIFT_PERCENT.min ||
    percent > SHIFT_PERCENT.max ||
    program.calorieShiftMode === undefined ||
    program.calorieShiftMode === 'Even' ||
    !days ||
    days.length < 1 ||
    days.length > 6 ||
    (program.calorieShiftPercent != null && percent >= program.calorieShiftPercent)
  )
    return null
  // Giữ đúng kiểu đang lưu (TrainingDays hay Custom): xác nhận giảm % không được đổi nhãn cấu hình của user
  return {
    calorieShiftMode: program.calorieShiftMode,
    calorieShiftDays: days,
    calorieShiftPercent: percent,
  }
}

/** `data` thô của 400 → vấn đề Calorie Shift; null khi không phải `FeasibilityResponse` do shift. */
export const parseCalorieShiftProblem = (data: unknown): CalorieShiftProblem | null =>
  calorieShiftProblemOfFeasibility(parseFeasibility(data))

/** Lỗi của một request → vấn đề Calorie Shift (400 `FeasibilityResponse` do shift); null với mọi lỗi khác. */
export const calorieShiftProblemOf = (error: unknown): CalorieShiftProblem | null => {
  const apiError = getApiError(error)
  return apiError?.statusCode === 400 ? parseCalorieShiftProblem(apiError.data) : null
}

// Số hiển thị: làm tròn đối xứng quanh 0 (−61.15 → −61.2, không lệch về +∞ như Math.round), dấu trừ thật (U+2212) như phần còn lại
// của app, nhóm nghìn kiểu en-US; số âm làm tròn về 0 thì không mang dấu
const signed = (value: number, rounded: number, digits: number) => {
  const text = rounded.toLocaleString('en-US', { maximumFractionDigits: digits })
  return value < 0 && rounded > 0 ? `−${text}` : text
}
const whole = (value: number) => signed(value, Math.round(Math.abs(value)), 0)
const grams = (value: number) => signed(value, Math.round(Math.abs(value) * 10) / 10, 1)
const inWeekOrder = (days: readonly DayOfWeek[]) => WEEK_DAYS.filter((day) => days.includes(day))

/** Số kcal của BE hiện theo kcal / kJ của user ("1,738 kcal" / "7,272 kJ"); nơi gọi luôn truyền đơn vị của user, không có mặc định kcal ngầm. */
const energyText = (kcal: number, energy: Measure<EnergyUnit>) =>
  `${whole(energy.convert(kcal))} ${energy.unit}`

const reasonOf = (
  violation: ShiftViolation,
  floorKcal: number | null,
  energy: Measure<EnergyUnit>
): string => {
  switch (violation.code) {
    case 'NON_POSITIVE_CALORIES':
      return `A day needs more than 0 ${energy.unit}.`
    case 'BELOW_FLOOR':
      return floorKcal === null
        ? 'Below your calorie floor.'
        : `Below your ${energyText(floorKcal, energy)} calorie floor.`
    case 'CARBS_BELOW_ZERO':
      return violation.carbsG === null
        ? 'Carbs would drop below 0 g.'
        : `Carbs would be ${grams(violation.carbsG)} g, and they can't go below 0.`
  }
}

export interface ShiftDayIssue {
  readonly day: DayOfWeek
  /** kcal của ngày sau khi dịch. */
  readonly calories: string
  readonly reasons: readonly string[]
}

/** Một dòng cho mỗi ngày vi phạm (một ngày có thể dính nhiều mã), theo thứ tự tuần Monday → Sunday. */
export const issuesByDay = (
  problem: CalorieShiftProblem,
  energy: Measure<EnergyUnit>
): ShiftDayIssue[] =>
  inWeekOrder(problem.violations.map((violation) => violation.day)).map((day) => {
    const own = problem.violations.filter((violation) => violation.day === day)
    return {
      day,
      calories: energyText(own[0].calories, energy),
      reasons: own.map((violation) => reasonOf(violation, problem.floorKcal, energy)),
    }
  })

/** Giá trị mà một gợi ý đặt lên cấu hình; trang áp vào store / đáp án của mình khi người dùng bấm (không bao giờ tự áp). */
export interface ShiftChange {
  readonly shiftPercent?: number
  /** Chia đều cả tuần (kiểu phân bổ Even). */
  readonly shiftMode?: 'Even'
}

export interface ShiftFix {
  readonly code: ShiftOption['code']
  readonly label: string
  readonly detail: string | null
  /** Câu xác nhận ngắn sau khi áp (toast). */
  readonly result: string
  readonly change: ShiftChange
}

/**
 * Các option của BE → nút sửa mà wizard thật sự thực hiện được. `suggestedShiftPercent` là % LỚN NHẤT BE đã kiểm lại nên giá trị nhỏ hơn
 * (làm tròn xuống theo bước thanh trượt) vẫn hợp lệ; dưới mức tối thiểu của thanh trượt hoặc không thấp hơn % hiện tại thì bỏ chứ không đoán.
 */
export const shiftFixesOf = (problem: CalorieShiftProblem): ShiftFix[] =>
  problem.options.flatMap((option): ShiftFix[] => {
    switch (option.code) {
      case 'REDUCE_PERCENT': {
        const percent = Math.floor(option.maxPercent / SHIFT_PERCENT.step) * SHIFT_PERCENT.step
        if (percent < SHIFT_PERCENT.min || (problem.percent !== null && percent >= problem.percent))
          return []
        return [
          {
            code: option.code,
            label:
              problem.percent === null
                ? `Add ${percent}% on those days`
                : `Add ${percent}% instead of ${problem.percent}%`,
            detail: null,
            result: `Calorie shift set to ${percent}%`,
            change: { shiftPercent: percent },
          },
        ]
      }
      case 'USE_EVEN_DISTRIBUTION':
        return [
          {
            code: option.code,
            label: 'Use an even split across the week',
            detail: 'Every day gets the same calories',
            result: 'Even calorie split selected',
            change: { shiftMode: 'Even' },
          },
        ]
    }
  })
