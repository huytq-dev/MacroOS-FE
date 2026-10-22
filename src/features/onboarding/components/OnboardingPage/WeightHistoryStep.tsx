'use client'

import type { UnitSystem } from '@/config/enums'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { isClientError } from '@/lib/api'
import { roundTo } from '@/lib/units'
import { ChoiceStep, StepHeading } from './ChoiceStep'
import { usePriorWeightQuestion } from '../../hooks/use-onboarding'
import { WEIGHT_HISTORY_OPTIONS } from '../../types/onboarding-options.types'
import type { WeightHistoryAnswer } from '../../types/onboarding.types'

interface WeightHistoryStepProps {
  readonly weightKg: number
  readonly unit: UnitSystem
  readonly value: WeightHistoryAnswer | null
  /** Trả lời kèm CHÍNH số + đơn vị BE vừa đưa ra (gửi BE đúng như đã hiện). */
  readonly onAnswer: (
    answer: WeightHistoryAnswer,
    shown: { readonly value: number; readonly unit: 'kg' | 'lb' }
  ) => void
}

/**
 * Câu Prior Weight theo hợp đồng BE v2 (sau cờ PRIOR_WEIGHT_API): "Have you ever weighed more than {displayValue} {displayUnit}?" — số và đơn vị là của
 * `GET /onboarding/prior-weight-question` (gọi lại khi đổi kg ↔ lb), FE không tự tính. Chưa có số thì chưa cho trả lời; lỗi (vd. 400 chưa có cân nặng) hiện
 * ErrorState + Try again, không đoán số.
 */
export function WeightHistoryStep({ weightKg, unit, value, onAnswer }: WeightHistoryStepProps) {
  const question = usePriorWeightQuestion(
    { weightKg: roundTo(weightKg, 2), unit: unit === 'Imperial' ? 'lb' : 'kg' },
    true
  )
  const data = question.data
  if (question.isError)
    return (
      <div>
        <StepHeading title="Have you ever weighed more than…" />
        <div className="bg-card rounded-2xl">
          <ErrorState
            error={question.error}
            variant="inline"
            onRetry={() => void question.refetch()}
            isRetrying={question.isFetching}
          />
          {isClientError(question.error) && (
            <p className="text-muted-foreground px-6 pb-5 text-center text-sm">
              Your weight may be missing. Go back, set it, then try again.
            </p>
          )}
        </div>
      </div>
    )
  if (!data)
    return (
      <div aria-busy="true">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="mt-6 h-16 rounded-2xl" />
        <Skeleton className="mt-3 h-16 rounded-2xl" />
      </div>
    )
  return (
    <ChoiceStep
      title={`Have you ever weighed more than ${data.displayValue} ${data.displayUnit}?`}
      options={WEIGHT_HISTORY_OPTIONS}
      value={value}
      onChange={(answer) => onAnswer(answer, { value: data.displayValue, unit: data.displayUnit })}
      info="Your weight history can affect your current metabolism. The MacroOS algorithm takes this into account."
    />
  )
}
