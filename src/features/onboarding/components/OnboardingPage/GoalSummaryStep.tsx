'use client'

import { formatDateVi } from '@/lib/date'
import { Skeleton } from '@/components/ui/skeleton'
import { StepHeading } from './ChoiceStep'
import type { ProgramPreview } from '../../types/onboarding.types'

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
  readonly preview: ProgramPreview | undefined
}

const GOAL_LABEL = {
  WeightLoss: 'Lose weight',
  Maintenance: 'Maintain weight',
  WeightGain: 'Gain weight',
} as const

/** Tóm tắt mục tiêu trước khi sang Program: loại mục tiêu, tốc độ, ngân sách ban đầu và ngày dự kiến kèm lời giải thích. */
export function GoalSummaryStep({
  goalType,
  currentWeightKg,
  targetWeightKg,
  ratePercent,
  preview,
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
            {currentWeightKg.toFixed(0)} kg » {targetWeightKg.toFixed(0)} kg
          </span>
        )}
      </div>

      {!maintain && (
        <SummaryCard
          index={0}
          title="Goal rate"
          value={`${goalType === 'WeightGain' ? '+' : '−'}${ratePercent.toFixed(2)}% per week`}
        >
          MacroOS will adjust your calorie target as needed so you {verb} about{' '}
          {ratePercent.toFixed(2)}% of your body weight per week. The kg per week will change as
          your weight changes.
        </SummaryCard>
      )}
      <SummaryCard
        index={1}
        title="Starting daily budget"
        value={`${preview.averageCalories} kcal`}
      >
        This budget is estimated from your current expenditure. Your expenditure keeps changing with
        your eating and activity; at each weekly check-in, MacroOS updates your plan to match.
      </SummaryCard>
      {!maintain && (
        <SummaryCard
          index={2}
          title="Projected completion date"
          value={preview.projectedEndDate ? formatDateVi(preview.projectedEndDate) : '—'}
        >
          This is an optimistic estimate, assuming your expenditure stays perfectly stable and you
          hit your target 100% of the time. Aim for progress over perfection, and allow a few extra
          weeks beyond this date.
        </SummaryCard>
      )}
    </div>
  )
}
