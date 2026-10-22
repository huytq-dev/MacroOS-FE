/**
 * Chữ của màn Review (onboarding "Your macro program is ready" và cuối wizard New Program), tách theo kiểu program và CHỈ nêu những gì
 * thật sự biết từ preview / lựa chọn: Coached do thuật toán dựng nên có "mục tiêu tốc độ → kcal trung bình", diet và protein user chọn;
 * Collaborative / Manual là các ngày user tự đặt nên không có câu nào nói kcal "vì bạn muốn giảm x%", không nhắc mức protein hay kiểu ăn
 * mà bản đã chỉnh không còn tuân theo.
 */

import type { ProgramType } from '@/config/enums'
import { KCAL_PER_GRAM } from '@/features/nutrition/atwater'
import type { EnergyUnit, Measure } from '@/lib/units'
import type { ProgramPreview } from '../types/program.types'

export type ReviewTone = 'calories' | 'carbs' | 'protein' | 'fat'

export interface ReviewDetail {
  readonly title: string
  readonly value: string
  /** Màu số của mục (theo màu macro, như MacroFactor). */
  readonly tone: ReviewTone
  readonly text: string
}

export interface ReviewCopy {
  /** "How was your program designed?": bốn mục theo thứ tự. */
  readonly details: readonly ReviewDetail[]
  /** Nội dung mục "What's Next". */
  readonly next: string
}

interface BaseFacts {
  readonly tdeeKcal: number
  /** kcal trung bình mỗi ngày của bảy ngày. */
  readonly averageKcal: number
}

export interface CoachedFacts extends BaseFacts {
  readonly programType: 'Coached'
  readonly goalType: 'WeightLoss' | 'Maintenance' | 'WeightGain'
  /** Độ lớn % cân nặng / tuần của goal. */
  readonly ratePercent: number
  readonly proteinGPerKg: number
  readonly proteinLabel: string
  readonly dietLabel: string
}

export interface CollaborativeFacts extends BaseFacts {
  readonly programType: 'Collaborative'
  readonly weeklyBudgetKcal: number
  /** BE suy từ kcal trung bình so với TDEE: dương = tăng cân, âm = giảm. */
  readonly weeklyChangePercent: number
  readonly averageProteinG: number
  readonly averageCarbsG: number
  readonly averageFatG: number
  readonly hasLockedDays: boolean
}

export interface ManualFacts extends BaseFacts {
  readonly programType: 'Manual'
  readonly weeklyBudgetKcal: number
  readonly weeklyChangePercent: number
  /** 4P + 4C + 9F trung bình mỗi ngày từ macro user nhập. */
  readonly macroKcalAverage: number
}

export type ReviewFacts = CoachedFacts | CollaborativeFacts | ManualFacts

const grams = (value: number) => `${Math.round(value)} g`

/** Số năng lượng của BE (kcal) hiện theo kcal / kJ của user: "2430 kcal" / "10168 kJ". */
type Energy = Measure<EnergyUnit>

const expenditure = (tdeeKcal: number, energy: Energy): ReviewDetail => ({
  title: 'Estimated Expenditure',
  value: energy.text(tdeeKcal),
  tone: 'calories',
  text: `As you use MacroOS, your expenditure is continually fine-tuned. Based on your initial info, your daily expenditure is about ${energy.text(tdeeKcal)}.`,
})

/** Câu nêu mức đổi cân mỗi tuần mà kcal trung bình ngụ ý (BE suy ra), hoặc "ổn định" khi gần như bằng TDEE. */
const impliedChange = (weeklyChangePercent: number) => {
  const size = Math.abs(weeklyChangePercent)
  if (size < 0.05) return 'about the same, so your weight should stay roughly stable.'
  return `a ${weeklyChangePercent > 0 ? 'surplus' : 'deficit'} of about ${size.toFixed(2)}% of your body weight per week.`
}

const coachedCopy = (facts: CoachedFacts, energy: Energy): ReviewCopy => {
  const verb = facts.goalType === 'WeightGain' ? 'gain' : 'lose'
  const protein = facts.proteinGPerKg.toFixed(2)
  return {
    details: [
      expenditure(facts.tdeeKcal, energy),
      {
        title: 'Average Target',
        value: energy.text(facts.averageKcal),
        tone: 'carbs',
        text:
          facts.goalType === 'Maintenance'
            ? `You want to maintain your weight, so your average Calorie target equals your expenditure, about ${energy.text(facts.averageKcal)}.`
            : `You want to ${verb} ${facts.ratePercent.toFixed(2)}% of your body weight per week, so your average daily Calorie target is about ${energy.text(facts.averageKcal)}.`,
      },
      {
        title: 'Target Protein',
        value: `${protein} g/kg`,
        tone: 'protein',
        text: `With your goal and a ${facts.proteinLabel.toLowerCase()} protein level, eating ${protein} g of protein per kg of body weight is a good average for your lifestyle and training.`,
      },
      {
        title: 'Diet Type',
        value: facts.dietLabel,
        tone: 'fat',
        text: `Finally, the remaining Calories are split between carbs and fat following a ${facts.dietLabel.toLowerCase()} diet style.`,
      },
    ],
    next: 'MacroOS tracks the calories you eat and your weight changes to fine-tune your estimated expenditure, then uses that to adjust your weekly calorie and macro budget to keep you on track.',
  }
}

const collaborativeCopy = (facts: CollaborativeFacts, energy: Energy): ReviewCopy => ({
  details: [
    expenditure(facts.tdeeKcal, energy),
    {
      title: 'Average Target',
      value: energy.text(facts.averageKcal),
      tone: 'carbs',
      text: `This is the average of the daily Calorie targets you set. Compared with your expenditure it is ${impliedChange(facts.weeklyChangePercent)}`,
    },
    {
      title: 'Calorie Budget',
      value: `${energy.text(facts.weeklyBudgetKcal)} / week`,
      tone: 'protein',
      text: `Your weekly Calorie budget is ${energy.text(facts.weeklyBudgetKcal)}. At each weekly check-in MacroOS can propose a new budget and spreads it across your days the way you set them${facts.hasLockedDays ? '; the days you locked stay as they are' : ''}.`,
    },
    {
      title: 'Average Macros',
      value: `${Math.round(facts.averageProteinG)} P · ${Math.round(facts.averageFatG)} F · ${Math.round(facts.averageCarbsG)} C`,
      tone: 'fat',
      text: `Your daily targets average about ${grams(facts.averageProteinG)} of protein, ${grams(facts.averageFatG)} of fat and ${grams(facts.averageCarbsG)} of carbs.`,
    },
  ],
  next: 'MacroOS tracks the calories you eat and your weight changes to fine-tune your estimated expenditure. Each week it proposes an updated Calorie budget, and you decide whether to accept it.',
})

const manualCopy = (facts: ManualFacts, energy: Energy): ReviewCopy => ({
  details: [
    expenditure(facts.tdeeKcal, energy),
    {
      title: 'Average Target',
      value: energy.text(facts.averageKcal),
      tone: 'carbs',
      text: `This is the average of the daily targets you entered. Compared with your expenditure it is ${impliedChange(facts.weeklyChangePercent)}`,
    },
    {
      title: 'Set Calorie Budget',
      value: `${energy.text(facts.weeklyBudgetKcal)} / week`,
      tone: 'protein',
      text: `Your weekly Calorie budget is ${energy.text(facts.weeklyBudgetKcal)}, the total of the daily Calorie targets you entered.`,
    },
    {
      title: 'Average Macro Calorie Content',
      value: energy.text(facts.macroKcalAverage),
      tone: 'fat',
      // Một con số cho "protein and carbs" vì hai hệ số Atwater bằng nhau (scripts/check-contract.mjs F3 giữ điều đó)
      text: `The macros you entered (${energy.text(KCAL_PER_GRAM.protein)} per gram of protein and carbs, ${energy.text(KCAL_PER_GRAM.fat)} per gram of fat) add up to about ${energy.text(facts.macroKcalAverage)} per day on average, compared with ${energy.text(facts.averageKcal)} of Calorie target.`,
    },
  ],
  next: "Because you set your own targets, your program won't update automatically each week. We'll still track your progress and estimate your expenditure. To change your targets later, edit your program.",
})

/** Chữ Review của một kiểu program; số năng lượng hiện theo `energy` của user (BE luôn trả kcal; không có mặc định kcal ngầm). */
export function reviewCopyOf(facts: ReviewFacts, energy: Energy): ReviewCopy {
  switch (facts.programType) {
    case 'Coached':
      return coachedCopy(facts, energy)
    case 'Collaborative':
      return collaborativeCopy(facts, energy)
    case 'Manual':
      return manualCopy(facts, energy)
  }
}

export interface ReviewInput {
  readonly programType: ProgramType
  readonly preview: ProgramPreview
  readonly weightKg: number
  readonly goalType: CoachedFacts['goalType']
  /** Độ lớn % cân nặng / tuần của goal (chỉ Coached dùng). */
  readonly ratePercent: number
  readonly proteinLabel: string
  readonly dietLabel: string
  /** Collaborative: có ngày nào user đã khoá ở editor không. */
  readonly hasLockedDays: boolean
}

/** Số thật của bản xem trước BE (`POST /programs/preview`) + lựa chọn của user → dữ liệu cho `reviewCopyOf`. FE chỉ tự tính g/kg protein trung bình. */
export function reviewFactsOf(input: ReviewInput): ReviewFacts {
  const { preview } = input
  const base = { tdeeKcal: preview.estimatedTdeeKcal, averageKcal: preview.averageCalories }
  switch (input.programType) {
    case 'Manual':
      return {
        ...base,
        programType: 'Manual',
        weeklyBudgetKcal: preview.weeklyBudgetKcal,
        weeklyChangePercent: preview.weeklyChangePercent,
        macroKcalAverage: preview.macroKcalAverage,
      }
    case 'Collaborative':
      return {
        ...base,
        programType: 'Collaborative',
        weeklyBudgetKcal: preview.weeklyBudgetKcal,
        weeklyChangePercent: preview.weeklyChangePercent,
        averageProteinG: preview.averageProteinG,
        averageCarbsG: preview.averageCarbsG,
        averageFatG: preview.averageFatG,
        hasLockedDays: input.hasLockedDays,
      }
    case 'Coached':
      return {
        ...base,
        programType: 'Coached',
        goalType: input.goalType,
        ratePercent: input.ratePercent,
        proteinGPerKg: input.weightKg > 0 ? preview.averageProteinG / input.weightKg : 0,
        proteinLabel: input.proteinLabel,
        dietLabel: input.dietLabel,
      }
  }
}
