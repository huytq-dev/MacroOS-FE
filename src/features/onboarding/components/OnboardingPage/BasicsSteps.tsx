'use client'

import { BirthDateStep } from './BirthDateStep'
import { BodyFatStep } from './BodyFatStep'
import { ChoiceStep } from './ChoiceStep'
import { EstimateChatStep } from './EstimateChatStep'
import { HeightStep } from './HeightStep'
import { IntroStep } from './IntroStep'
import { ReferralStep } from './ReferralStep'
import { ValueStep } from './ValueStep'
import { WeightStep } from './WeightStep'
import { SuggestionNote } from './SuggestionNote'
import { WeightHistoryStep } from './WeightHistoryStep'
import { PRIOR_WEIGHT_API } from '../../prior-weight.config'
import type { UnitSystem } from '@/config/enums'
import { weightMeasure } from '@/lib/units'
import type { OnboardingWizard } from '../../hooks/use-onboarding-wizard'
import {
  ACTIVITY_OPTIONS,
  CARDIO_OPTIONS,
  EXERCISE_OPTIONS,
  LIFTING_OPTIONS,
  SEX_OPTIONS,
  WEIGHT_HISTORY_OPTIONS,
  WEIGHT_TREND_OPTIONS,
} from '../../types/onboarding-options.types'

/**
 * NHÁNH CŨ (cờ PRIOR_WEIGHT_API tắt): ngưỡng Prior Weight = cân nặng × 1.06 tính ở FE. Chỉ chạy khi cờ tắt; nhánh BE v2 không có phép tính nào ở FE.
 * Xoá cùng nhánh cũ khi cờ bật vĩnh viễn.
 */
const legacyPriorWeightLabel = (weightKg: number, unit: UnitSystem) =>
  weightMeasure(unit === 'Imperial' ? 'lb' : 'kg').text(weightKg * 1.06, 0)

/** Các bước phần "Thông tin cơ bản" (và màn mở đầu): giới tính → trao đổi chất → ước tính TDEE → nguồn biết tới app. */
export function BasicsSteps({ wizard }: { readonly wizard: OnboardingWizard }) {
  const { answers, patch } = wizard

  switch (wizard.stepId) {
    case 'intro':
      return <IntroStep />
    case 'sex':
      return (
        <ChoiceStep
          title="What is your biological sex?"
          subtitle="Used to estimate your energy expenditure"
          options={SEX_OPTIONS}
          value={answers.gender}
          onChange={(gender) => patch({ gender })}
        />
      )
    case 'birth':
      return (
        <>
          <BirthDateStep
            value={answers.dateOfBirth ?? ''}
            today={wizard.today}
            onChange={(dateOfBirth) => patch({ dateOfBirth })}
          />
          {!answers.confirmed.dateOfBirth && (
            <SuggestionNote onConfirm={() => patch({ dateOfBirth: answers.dateOfBirth })} />
          )}
        </>
      )
    case 'height':
      return (
        <>
          <HeightStep
            heightCm={answers.heightCm}
            unit={answers.unit}
            onChange={(heightCm) => patch({ heightCm })}
            onUnitChange={(unit) => patch({ unit })}
          />
          {!answers.confirmed.heightCm && (
            <SuggestionNote onConfirm={() => patch({ heightCm: answers.heightCm })} />
          )}
        </>
      )
    case 'weight':
      return (
        <>
          <WeightStep
            weightKg={answers.weightKg}
            unit={answers.unit}
            onChange={(weightKg) => patch({ weightKg })}
            onUnitChange={(unit) => patch({ unit })}
          />
          {!answers.confirmed.weightKg && (
            <SuggestionNote onConfirm={() => patch({ weightKg: answers.weightKg })} />
          )}
        </>
      )
    case 'weightHistory':
      // Nhánh BE v2: số ngưỡng + đơn vị do BE tính và gửi lại đúng như đã hiện. Nhánh cũ (cờ TẮT) bên dưới giữ nguyên, sẽ bỏ khi cờ bật vĩnh viễn.
      if (PRIOR_WEIGHT_API)
        return (
          <WeightHistoryStep
            weightKg={answers.weightKg}
            unit={answers.unit}
            value={answers.weighedMoreThanBefore}
            onAnswer={(weighedMoreThanBefore, shown) =>
              patch({
                weighedMoreThanBefore,
                priorWeightThresholdShown: shown.value,
                priorWeightThresholdUnit: shown.unit,
              })
            }
          />
        )
      return (
        <ChoiceStep
          title={`Have you ever weighed more than ${legacyPriorWeightLabel(answers.weightKg, answers.unit)}?`}
          options={WEIGHT_HISTORY_OPTIONS}
          value={answers.weighedMoreThanBefore}
          onChange={(weighedMoreThanBefore) => patch({ weighedMoreThanBefore })}
          info="Your weight history can affect your current metabolism. The MacroOS algorithm takes this into account."
        />
      )
    case 'weightTrend':
      return (
        <ChoiceStep
          title="How has your weight changed over the past few weeks?"
          options={WEIGHT_TREND_OPTIONS}
          value={answers.recentWeightTrend}
          onChange={(recentWeightTrend) => patch({ recentWeightTrend })}
        />
      )
    case 'bodyFat':
      return (
        <BodyFatStep
          value={answers.bodyFat}
          onChange={(bodyFat) => patch({ bodyFat })}
          weightKg={answers.weightKg}
          unit={answers.unit}
        />
      )
    case 'exercise':
      return (
        <ChoiceStep
          title="How often do you exercise?"
          subtitle="Estimate your sessions of recreational sports, cardio or lifting"
          options={EXERCISE_OPTIONS}
          value={answers.exerciseSessions}
          onChange={(exerciseSessions) => patch({ exerciseSessions })}
        />
      )
    case 'activity':
      return (
        <ChoiceStep
          title="How active are you?"
          subtitle="Your activity outside workouts, at work and in your free time"
          options={ACTIVITY_OPTIONS}
          value={answers.dailyActivity}
          onChange={(dailyActivity) => patch({ dailyActivity })}
        />
      )
    case 'lifting':
      return (
        <ChoiceStep
          title="What is your lifting experience?"
          options={LIFTING_OPTIONS}
          value={answers.liftingExperience}
          onChange={(liftingExperience) => patch({ liftingExperience })}
        />
      )
    case 'cardio':
      return (
        <ChoiceStep
          title="What is your cardio experience?"
          options={CARDIO_OPTIONS}
          value={answers.cardioExperience}
          onChange={(cardioExperience) => patch({ cardioExperience })}
        />
      )
    case 'estimate':
      return (
        <EstimateChatStep
          estimate={wizard.estimate}
          isLoading={wizard.isEstimateLoading}
          manualTdee={answers.manualTdeeKcal}
          onManualTdeeChange={(manualTdeeKcal) => patch({ manualTdeeKcal })}
          onNext={wizard.next}
          error={wizard.estimateError}
          isRetrying={wizard.isEstimateRetrying}
          onRetry={wizard.retryEstimate}
        />
      )
    case 'value':
      return <ValueStep />
    case 'referral':
      return (
        <ReferralStep
          source={answers.referralSource}
          affiliateCode={answers.affiliateCode}
          onSourceChange={(referralSource) => patch({ referralSource })}
          onAffiliateCodeChange={(affiliateCode) => patch({ affiliateCode })}
        />
      )
    default:
      return null
  }
}
