'use client'

import { ChoiceStep } from './ChoiceStep'
import { DistributionStep } from './DistributionStep'
import { GoalSummaryStep } from './GoalSummaryStep'
import { GoalTargetStep } from './GoalTargetStep'
import { ProgramReadyStep } from './ProgramReadyStep'
import type { OnboardingWizard } from '../../hooks/use-onboarding-wizard'
import {
  DIET_OPTIONS,
  FLOOR_ICON,
  GOAL_OPTIONS,
  PROTEIN_OPTIONS,
  TRAINING_OPTIONS,
  type ChoiceOption,
} from '../../types/onboarding-options.types'
import type { CalorieFloorChoice } from '../../types/onboarding.types'

type Goal = 'WeightLoss' | 'Maintenance' | 'WeightGain'

/** Các bước phần "Đặt mục tiêu" và "Tạo program": loại mục tiêu → tốc độ → kiểu ăn → sàn calo → phân bổ → protein → tổng kết. */
export function ProgramSteps({ wizard }: { readonly wizard: OnboardingWizard }) {
  const { answers, patch, preview } = wizard
  const goal = (answers.goalType ?? 'Maintenance') as Goal

  switch (wizard.stepId) {
    case 'goalType':
      return (
        <ChoiceStep
          title="Mục tiêu của bạn là gì?"
          options={GOAL_OPTIONS}
          value={answers.goalType as Goal | null}
          onChange={wizard.setGoalType}
        />
      )
    case 'goalTarget':
      return (
        <GoalTargetStep
          goalType={answers.goalType === 'WeightGain' ? 'WeightGain' : 'WeightLoss'}
          currentWeightKg={answers.weightKg}
          targetWeightKg={answers.targetWeightKg ?? answers.weightKg}
          onTargetChange={(targetWeightKg) => patch({ targetWeightKg })}
          ratePercent={answers.weeklyRatePercent}
          onRateChange={(weeklyRatePercent) => patch({ weeklyRatePercent })}
          preview={preview}
        />
      )
    case 'goalSummary':
      return (
        <GoalSummaryStep
          goalType={goal}
          currentWeightKg={answers.weightKg}
          targetWeightKg={answers.targetWeightKg}
          ratePercent={answers.weeklyRatePercent}
          preview={preview}
        />
      )
    case 'diet':
      return (
        <ChoiceStep
          title="Kiểu ăn bạn ưa thích?"
          options={DIET_OPTIONS}
          value={answers.dietStyle}
          onChange={(dietStyle) => patch({ dietStyle })}
        />
      )
    case 'floor': {
      const floorOptions: readonly ChoiceOption<CalorieFloorChoice>[] = [
        {
          value: 'Standard',
          label: 'Sàn tiêu chuẩn',
          description: `Khuyến nghị calo của bạn sẽ không bao giờ xuống dưới ${preview?.floorStandardKcal ?? '…'} kcal`,
          icon: FLOOR_ICON.Standard,
        },
        {
          value: 'Low',
          label: 'Sàn thấp',
          description: `Khuyến nghị calo của bạn sẽ không bao giờ xuống dưới ${preview?.floorLowKcal ?? '…'} kcal (cân nhắc kỹ)`,
          icon: FLOOR_ICON.Low,
        },
      ]
      return (
        <ChoiceStep
          title="Bạn muốn mức sàn calo nào?"
          options={floorOptions}
          value={answers.calorieFloor}
          onChange={(calorieFloor) => patch({ calorieFloor })}
        />
      )
    }
    case 'training':
      return (
        <ChoiceStep
          title="Bạn sẽ tập gì trong chương trình này?"
          options={TRAINING_OPTIONS}
          value={answers.trainingType}
          onChange={(trainingType) => patch({ trainingType })}
        />
      )
    case 'distribution':
      return (
        <DistributionStep
          mode={answers.shiftMode}
          onModeChange={(shiftMode) => patch({ shiftMode })}
          days={answers.shiftDays}
          onDaysChange={(shiftDays) => patch({ shiftDays })}
          percent={answers.shiftPercent}
          onPercentChange={(shiftPercent) => patch({ shiftPercent })}
        />
      )
    case 'protein':
      return (
        <ChoiceStep
          title="Mức protein bạn ưa thích?"
          options={PROTEIN_OPTIONS}
          value={answers.proteinLevel}
          onChange={(proteinLevel) => patch({ proteinLevel })}
        />
      )
    case 'ready':
      return (
        <ProgramReadyStep
          preview={preview}
          goalType={goal}
          ratePercent={answers.weeklyRatePercent}
          proteinLabel={
            PROTEIN_OPTIONS.find((option) => option.value === answers.proteinLevel)?.label ?? 'Vừa'
          }
          dietLabel={
            DIET_OPTIONS.find((option) => option.value === answers.dietStyle)?.label ?? 'Cân bằng'
          }
          onReachedEnd={wizard.onReadyReached}
        />
      )
    default:
      return null
  }
}
