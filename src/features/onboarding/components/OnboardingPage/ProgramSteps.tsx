'use client'

import { CalorieShiftAlert } from './CalorieShiftAlert'
import { ChoiceStep, StepHeading } from './ChoiceStep'
import { DistributionStep } from './DistributionStep'
import { GoalSummaryStep } from './GoalSummaryStep'
import { GoalTargetStep } from './GoalTargetStep'
import { ProgramReadyStep } from './ProgramReadyStep'
import { SuggestionNote } from './SuggestionNote'
import { ErrorState } from '@/components/shared/ErrorState'
import { isClientError } from '@/lib/api'
import { FeasibilityNotice } from '@/features/program/components/FeasibilityNotice'
import { reviewCopyOf } from '@/features/program/utils/review-copy'
import { energyMeasure, weightMeasure } from '@/lib/units'
import type { OnboardingWizard } from '../../hooks/use-onboarding-wizard'
import {
  DIET_OPTIONS,
  floorOptionsOf,
  GOAL_OPTIONS,
  PROGRAM_STEP_TITLE,
  PROTEIN_OPTIONS,
  TRAINING_OPTIONS,
} from '../../types/onboarding-options.types'
import type { GoalPreview, ProgramPreview } from '../../types/onboarding.types'

type Goal = 'WeightLoss' | 'Maintenance' | 'WeightGain'

/** Hai màn Goal chỉ cần ngân sách ban đầu (kcal trung bình của preview) và ngày dự kiến. */
const goalPreviewOf = (preview: ProgramPreview | undefined): GoalPreview | undefined =>
  preview && { budgetKcal: preview.averageCalories, projectedEndDate: preview.projectedEndDate }

/**
 * Các bước phần "Đặt mục tiêu" và "Tạo program": loại mục tiêu → tốc độ → kiểu ăn → sàn calo → phân bổ → protein → tổng kết.
 * Khi BE từ chối kiểu chia kcal (400 Calorie Shift) thì khung nêu ngày hỏng + cách sửa nằm ngay dưới nội dung bước.
 */
export function ProgramSteps({ wizard }: { readonly wizard: OnboardingWizard }) {
  const { shiftProblem, feasibilityIssue } = wizard
  const alert = shiftProblem ? (
    <CalorieShiftAlert
      problem={shiftProblem}
      fixes={wizard.shiftFixes}
      onApply={wizard.applyShiftFix}
    />
  ) : feasibilityIssue ? (
    // Target không khả thi không do shift (BE `feasibility`): chỉ nêu vi phạm + cách chỉnh, Next bị khoá, không tự đổi số nào
    <FeasibilityNotice feasibility={feasibilityIssue} />
  ) : null
  // Hai màn chỉ hiển thị kết quả preview sẽ kẹt ở skeleton khi preview bị từ chối: hiện vấn đề thay cho chúng
  if (alert && !wizard.preview && (wizard.stepId === 'goalSummary' || wizard.stepId === 'ready'))
    return (
      <div>
        <StepHeading
          title={shiftProblem ? 'Your calorie shift needs a fix' : "Your targets don't work yet"}
        />
        {alert}
      </div>
    )
  // Preview lỗi không phải Calorie Shift (vd. 400 thiếu câu trả lời Basics): hiện lỗi + Try again, KHÔNG bịa số thay thế
  const previewFailure =
    wizard.previewError !== null && !wizard.preview ? (
      <div className="bg-card rounded-2xl">
        <ErrorState
          error={wizard.previewError}
          variant="inline"
          onRetry={wizard.retryPreview}
          isRetrying={wizard.isPreviewRetrying}
        />
        {isClientError(wizard.previewError) && (
          <p className="text-muted-foreground px-6 pb-5 text-center text-sm">
            Some of your answers may be missing. Go back, complete them, then try again.
          </p>
        )}
      </div>
    ) : null
  if (previewFailure && ['goalSummary', 'floor', 'ready'].includes(wizard.stepId))
    return <div>{previewFailure}</div>
  return (
    <>
      {previewFailure && <div className="mb-5">{previewFailure}</div>}
      <StepContent wizard={wizard} />
      {alert && <div className="mt-5">{alert}</div>}
    </>
  )
}

function StepContent({ wizard }: { readonly wizard: OnboardingWizard }) {
  const { answers, patch, preview } = wizard
  const goal = (answers.goalType ?? 'Maintenance') as Goal
  // Trong onboarding đơn vị cân nặng là lựa chọn ở màn cân nặng (chưa lưu vào hồ sơ); năng lượng mặc định kcal
  const weight = weightMeasure(answers.unit === 'Imperial' ? 'lb' : 'kg')
  const energy = energyMeasure('kcal')

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
        <>
          <GoalTargetStep
            goalType={answers.goalType === 'WeightGain' ? 'WeightGain' : 'WeightLoss'}
            currentWeightKg={answers.weightKg}
            targetWeightKg={answers.targetWeightKg ?? answers.weightKg}
            onTargetChange={(targetWeightKg) => patch({ targetWeightKg })}
            ratePercent={answers.weeklyRatePercent}
            onRateChange={(weeklyRatePercent) => patch({ weeklyRatePercent })}
            preview={goalPreviewOf(preview)}
            weight={weight}
            energy={energy}
          />
          {/* Cân mục tiêu (±10 %) và tốc độ (0.5) đang hiện chỉ là gợi ý cho tới khi người dùng kéo / gõ hoặc bấm xác nhận */}
          {!(answers.goalConfirmed.targetWeightKg && answers.goalConfirmed.weeklyRatePercent) && (
            <SuggestionNote
              onConfirm={wizard.confirmGoalSuggestions}
              message="The goal weight and rate shown are only suggestions. Adjust them to set yours."
              action="Use these values"
            />
          )}
        </>
      )
    case 'goalSummary':
      return (
        <GoalSummaryStep
          goalType={goal}
          currentWeightKg={answers.weightKg}
          targetWeightKg={answers.targetWeightKg}
          ratePercent={answers.weeklyRatePercent}
          preview={goalPreviewOf(preview)}
          weight={weight}
          energy={energy}
        />
      )
    case 'diet':
      return (
        <ChoiceStep
          title={PROGRAM_STEP_TITLE.diet}
          options={DIET_OPTIONS}
          value={answers.dietStyle}
          onChange={(dietStyle) => patch({ dietStyle })}
        />
      )
    case 'floor':
      return (
        <ChoiceStep
          title={PROGRAM_STEP_TITLE.floor}
          options={floorOptionsOf(preview?.floorStandardKcal, preview?.floorLowKcal)}
          value={answers.calorieFloor === 'Off' ? null : answers.calorieFloor}
          onChange={(calorieFloor) => patch({ calorieFloor })}
        />
      )
    case 'training':
      return (
        <ChoiceStep
          title={PROGRAM_STEP_TITLE.training}
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
          title={PROGRAM_STEP_TITLE.protein}
          options={PROTEIN_OPTIONS}
          value={answers.proteinLevel}
          onChange={(proteinLevel) => patch({ proteinLevel })}
        />
      )
    case 'ready':
      return (
        <ProgramReadyStep
          days={preview?.days}
          copy={
            preview &&
            reviewCopyOf(
              {
                programType: 'Coached',
                tdeeKcal: preview.tdeeKcal,
                averageKcal: preview.averageCalories,
                goalType: goal,
                ratePercent: answers.weeklyRatePercent,
                proteinGPerKg: preview.proteinGPerKg,
                proteinLabel:
                  PROTEIN_OPTIONS.find((option) => option.value === answers.proteinLevel)?.label ??
                  'Moderate',
                dietLabel:
                  DIET_OPTIONS.find((option) => option.value === answers.dietStyle)?.label ??
                  'Balanced',
              },
              energy
            )
          }
          onReachedEnd={wizard.onReadyReached}
        />
      )
    default:
      return null
  }
}
