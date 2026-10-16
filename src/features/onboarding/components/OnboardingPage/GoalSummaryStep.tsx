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
  WeightLoss: 'Giảm cân',
  Maintenance: 'Giữ cân',
  WeightGain: 'Tăng cân',
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
  const verb = goalType === 'WeightGain' ? 'tăng' : 'giảm'
  if (!preview) return <Skeleton className="h-96 rounded-2xl" aria-busy="true" />

  return (
    <div className="space-y-4">
      <StepHeading title="Tóm tắt mục tiêu" />
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
          title="Tốc độ mục tiêu"
          value={`${goalType === 'WeightGain' ? '+' : '−'}${ratePercent.toFixed(2)}% mỗi tuần`}
        >
          MacroOS sẽ chỉnh mục tiêu calo khi cần để bạn {verb} khoảng {ratePercent.toFixed(2)}% cân
          nặng mỗi tuần. Số kg mỗi tuần sẽ thay đổi theo cân nặng của bạn.
        </SummaryCard>
      )}
      <SummaryCard
        index={1}
        title="Ngân sách hằng ngày ban đầu"
        value={`${preview.averageCalories} kcal`}
      >
        Ngân sách này ước tính từ mức tiêu hao hiện tại. Mức tiêu hao luôn thay đổi theo ăn uống và
        vận động; mỗi tuần khi check-in, MacroOS cập nhật kế hoạch cho khớp.
      </SummaryCard>
      {!maintain && (
        <SummaryCard
          index={2}
          title="Ngày dự kiến hoàn thành"
          value={preview.projectedEndDate ? formatDateVi(preview.projectedEndDate) : '—'}
        >
          Đây là ước tính lạc quan, nếu mức tiêu hao ổn định hoàn toàn và bạn bám 100% mục tiêu. Hãy
          ưu tiên tiến bộ hơn hoàn hảo, và chừa thêm vài tuần so với ngày này.
        </SummaryCard>
      )}
    </div>
  )
}
