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
          title="What is your goal?"
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
          title="Which diet style do you prefer?"
          options={DIET_OPTIONS}
          value={answers.dietStyle}
          onChange={(dietStyle) => patch({ dietStyle })}
        />
      )
    case 'floor': {
      const floorOptions: readonly ChoiceOption<CalorieFloorChoice>[] = [
        {
          value: 'Standard',
          label: 'Standard floor',
          description: `Your calorie recommendation will never drop below ${preview?.floorStandardKcal ?? '…'} kcal`,
          icon: FLOOR_ICON.Standard,
        },
        {
          value: 'Low',
          label: 'Low floor',
          description: `Your calorie recommendation will never drop below ${preview?.floorLowKcal ?? '…'} kcal (consider carefully)`,
          icon: FLOOR_ICON.Low,
        },
      ]
      return (
        <ChoiceStep
          title="Which calorie floor do you want?"
          options={floorOptions}
          value={answers.calorieFloor}
          onChange={(calorieFloor) => patch({ calorieFloor })}
        />
      )
    }
    case 'training':
      return (
        <ChoiceStep
          title="What will you train during this program?"
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
          title="Which protein level do you prefer?"
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
            PROTEIN_OPTIONS.find((option) => option.value === answers.proteinLevel)?.label ??
            'Moderate'
          }
          dietLabel={
            DIET_OPTIONS.find((option) => option.value === answers.dietStyle)?.label ?? 'Balanced'
          }
          onReachedEnd={wizard.onReadyReached}
        />
      )
    default:
      return null
  }
}
