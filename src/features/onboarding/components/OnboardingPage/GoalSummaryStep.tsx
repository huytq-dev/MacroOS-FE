'use client'

import { formatDate } from '@/lib/date'
import type { EnergyUnit, Measure, WeightUnit } from '@/lib/units'
import { Skeleton } from '@/components/ui/skeleton'
import { StepHeading } from './ChoiceStep'
import type { GoalPreview } from '../../types/onboarding.types'

interface SummaryCardProps {
  readonly title: string
  readonly value: React.ReactNode
  readonly children: React.ReactNode
  readonly index: number
}

function SummaryCard({ title, value, children, index }: SummaryCardProps) {
  return (
    <div
      className="border-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 overflow-hidden rounded-2xl border-2 [animation-fill-mode:backwards]"
      style={{ animationDelay: `${(index + 1) * 110}ms` }}
    >
      <div className="bg-secondary flex items-baseline justify-between gap-3 px-4 py-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-lg tabular-nums">{value}</p>
      </div>
      <p className="px-4 py-3 text-base leading-snug">{children}</p>
    </div>
  )
}

interface GoalSummaryStepProps {
  readonly goalType: 'WeightLoss' | 'Maintenance' | 'WeightGain'
  readonly currentWeightKg: number
  readonly targetWeightKg: number | null
  readonly ratePercent: number
  readonly preview: GoalPreview | undefined
  /** Đơn vị cân nặng và năng lượng hiển thị; các số trong props luôn là kg / kcal. */
  readonly weight: Measure<WeightUnit>
  readonly energy: Measure<EnergyUnit>
  /** Program Manual: không có ngân sách kcal tự động và MacroOS không chỉnh target, nên ẩn thẻ ngân sách và đổi lời giải thích tốc độ. */
  readonly manual?: boolean
}

const GOAL_LABEL = {
  WeightLoss: 'Weight Loss',
  Maintenance: 'Maintain Weight',
  WeightGain: 'Weight Gain',
} as const

/** Tóm tắt mục tiêu trước khi sang Program: loại mục tiêu, tốc độ, ngân sách ban đầu và ngày dự kiến kèm lời giải thích. */
export function GoalSummaryStep({
  goalType,
  currentWeightKg,
  targetWeightKg,
  ratePercent,
  preview,
  weight,
  energy,
  manual = false,
}: GoalSummaryStepProps) {
  const maintain = goalType === 'Maintenance'
  const verb = goalType === 'WeightGain' ? 'gain' : 'lose'
  if (!preview) return <Skeleton className="h-96 rounded-2xl" aria-busy="true" />

  return (
    <div className="space-y-4">
      <StepHeading title="Goal summary" />
      <div className="bg-mf-pastel-green text-mf-pastel-green-text motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-300 flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-semibold">
        <span>{GOAL_LABEL[goalType]}</span>
        {!maintain && targetWeightKg !== null && (
          <span className="tabular-nums">
            {weight.text(currentWeightKg, 0)} » {weight.text(targetWeightKg, 0)}
          </span>
        )}
      </div>

      {!maintain && (
        <SummaryCard
          index={0}
          title="Goal Rate"
          value={`${goalType === 'WeightGain' ? '+' : '−'}${ratePercent.toFixed(2)}% BW per week`}
        >
          {manual ? (
            <>
              You aim to {verb} about {ratePercent.toFixed(2)}% of your body weight per week.
              Because you set your own targets, MacroOS won&apos;t adjust them; it tracks your
              progress so you can see how close you are.
            </>
          ) : (
            <>
              MacroOS will adjust your calorie target as needed so you {verb} about{' '}
              {ratePercent.toFixed(2)}% of your body weight per week. The {weight.unit} per week
              will change as your weight changes.
            </>
          )}
        </SummaryCard>
      )}
      {!manual && (
        <SummaryCard
          index={1}
          title="Initial Daily Budget"
          value={preview.budgetKcal === null ? '—' : energy.text(preview.budgetKcal)}
        >
          {preview.budgetKcal === null
            ? 'Your starting budget will appear once MacroOS has an estimate of your expenditure.'
            : 'This budget is estimated from your current expenditure. Your expenditure keeps changing with your eating and activity; at each weekly check-in, MacroOS updates your plan to match.'}
        </SummaryCard>
      )}
      {!maintain && (
        <SummaryCard
          index={2}
          title="Estimated End Date"
          value={preview.projectedEndDate ? formatDate(preview.projectedEndDate) : '—'}
        >
          This is an optimistic estimate, assuming your expenditure stays perfectly stable and you
          hit your target 100% of the time. Aim for progress over perfection, and allow a few extra
          weeks beyond this date.
        </SummaryCard>
      )}
    </div>
  )
}
