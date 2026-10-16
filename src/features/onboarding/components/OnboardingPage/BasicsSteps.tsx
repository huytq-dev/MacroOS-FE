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
          title="Giới tính sinh học của bạn?"
          subtitle="Dùng để ước tính mức tiêu hao năng lượng"
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
          title={`Bạn từng nặng hơn ${weightLabel} chưa?`}
          options={WEIGHT_HISTORY_OPTIONS}
          value={answers.weighedMoreThanBefore}
          onChange={(weighedMoreThanBefore) => patch({ weighedMoreThanBefore })}
          info="Lịch sử cân nặng có thể ảnh hưởng đến trao đổi chất hiện tại. Thuật toán của MacroOS có tính đến điều này."
        />
      )
    case 'weightTrend':
      return (
        <ChoiceStep
          title="Vài tuần qua cân nặng của bạn thay đổi thế nào?"
          options={WEIGHT_TREND_OPTIONS}
          value={answers.recentWeightTrend}
          onChange={(recentWeightTrend) => patch({ recentWeightTrend })}
        />
      )
    case 'bodyFat':
      return <BodyFatStep value={answers.bodyFat} onChange={(bodyFat) => patch({ bodyFat })} />
    case 'exercise':
      return (
        <ChoiceStep
          title="Bạn tập luyện thường xuyên đến đâu?"
          subtitle="Ước tính số buổi thể thao giải trí, cardio hoặc tập tạ"
          options={EXERCISE_OPTIONS}
          value={answers.exerciseSessions}
          onChange={(exerciseSessions) => patch({ exerciseSessions })}
        />
      )
    case 'activity':
      return (
        <ChoiceStep
          title="Bạn năng động đến mức nào?"
          subtitle="Mức vận động ngoài giờ tập, trong công việc và lúc rảnh"
          options={ACTIVITY_OPTIONS}
          value={answers.dailyActivity}
          onChange={(dailyActivity) => patch({ dailyActivity })}
        />
      )
    case 'lifting':
      return (
        <ChoiceStep
          title="Kinh nghiệm tập tạ của bạn?"
          options={LIFTING_OPTIONS}
          value={answers.liftingExperience}
          onChange={(liftingExperience) => patch({ liftingExperience })}
        />
      )
    case 'cardio':
      return (
        <ChoiceStep
          title="Kinh nghiệm tập cardio của bạn?"
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
