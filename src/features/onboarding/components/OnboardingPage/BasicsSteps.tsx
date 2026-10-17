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

/** Các bước phần "Thông tin cơ bản" (và màn mở đầu): giới tính → trao đổi chất → ước tính TDEE → nguồn biết tới app. */
export function BasicsSteps({ wizard }: { readonly wizard: OnboardingWizard }) {
  const { answers, patch } = wizard
  const weightLabel =
    answers.unit === 'Imperial'
      ? `${Math.round(answers.weightKg * 2.20462 * 1.06)} lb`
      : `${Math.round(answers.weightKg * 1.06)} kg`

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
        <BirthDateStep
          value={answers.dateOfBirth ?? ''}
          today={wizard.today}
          onChange={(dateOfBirth) => patch({ dateOfBirth })}
        />
      )
    case 'height':
      return (
        <HeightStep
          heightCm={answers.heightCm}
          unit={answers.unit}
          onChange={(heightCm) => patch({ heightCm })}
          onUnitChange={(unit) => patch({ unit })}
        />
      )
    case 'weight':
      return (
        <WeightStep
          weightKg={answers.weightKg}
          unit={answers.unit}
          onChange={(weightKg) => patch({ weightKg })}
          onUnitChange={(unit) => patch({ unit })}
        />
      )
    case 'weightHistory':
      return (
        <ChoiceStep
          title={`Have you ever weighed more than ${weightLabel}?`}
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
