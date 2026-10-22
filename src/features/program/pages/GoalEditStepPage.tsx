'use client'

import { useRouter } from 'next/navigation'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import {
  GoalSummaryStep,
  GoalTargetStep,
  WizardShell,
} from '@/features/onboarding/components/OnboardingPage'
import type { GoalPreview } from '@/features/onboarding/types/onboarding.types'
import { useUnits } from '@/features/users/hooks/use-units'
import { useDebounce } from '@/hooks/use-debounce'
import { roundTo } from '@/lib/units'
import { useCurrentProgram } from '../hooks/use-program'
import { useFlowStore } from '@/stores/flow.store'
import { useGoalEditStore } from '@/stores/goal-edit.store'
import { useGoalEditPreview, useSaveGoalEdit } from '../hooks/use-goal-edit'
import { FeasibilityNotice } from '../components/FeasibilityNotice'
import type { Feasibility } from '../types/feasibility.types'
import type { GoalEditPreview } from '../types/goal-edit.types'
import { feasibilityOfError, infeasibleOf } from '../utils/feasibility'

/**
 * Preview của BE (`/goals/edit-preview`) → phần các màn Goal cần. Ngân sách null (program Manual hoặc chưa có TDEE) giữ nguyên là null
 * để màn hiện "—" / ẩn ô, không bao giờ đổi thành 0 kcal.
 */
const toGoalPreview = (preview: GoalEditPreview): GoalPreview => ({
  budgetKcal: preview.initialDailyBudgetKcal,
  projectedEndDate: preview.projectedEndDate,
})

/**
 * Một bước của Edit Goal (`/program/goal/edit/[params|review]`), dựng từ hai màn Goal đã có của wizard thiết lập
 * (`GoalTargetStep`: thước cân nặng, tốc độ, hai ô live; `GoalSummaryStep`: tóm tắt) trong `WizardShell`. Đích / tốc độ user đã sửa nằm
 * trong `useGoalEditStore`; preview của BE gọi sau debounce 300ms (số hiển thị luôn là số của BE). Done: sửa tại chỗ thì
 * `PUT /goals/edit`; đổi hướng goal thì chuyển sang wizard New Program với goal đã chốt (khoá).
 */
export function GoalEditStepPage({ step }: { readonly step: 'params' | 'review' }) {
  const router = useRouter()
  const edit = useGoalEditStore()
  const direction = useFlowStore((state) => state.direction)
  const setDirection = useFlowStore((state) => state.setDirection)
  const save = useSaveGoalEdit()
  const program = useCurrentProgram()
  const { weight, energy } = useUnits()
  // BE: targetWeightKg null = không đặt đích (giữ cân), nên luôn gửi đích đang hiển thị: user đã sửa thì đích đó, chưa thì đích hiện tại của goal.
  // Đích user kéo trên thước (kg hoặc lb) được đổi đúng sang kg và chỉ làm tròn 2 chữ số khi gửi (BE lưu kg 2 chữ số)
  const editedTarget = edit.targetWeightKg === null ? null : roundTo(edit.targetWeightKg, 2)
  const requestedTarget = editedTarget ?? program.data?.targetWeightKg ?? null
  const debouncedTarget = useDebounce(requestedTarget, 300)
  const debouncedRate = useDebounce(edit.weeklyRatePercent, 300)
  const query = useGoalEditPreview(
    { targetWeightKg: debouncedTarget, weeklyRatePercent: debouncedRate },
    !program.isLoading
  )
  const data = query.data
  const ready = data ? toGoalPreview(data) : undefined
  // Kiểm khả thi của BE: preview 200 (`feasibility`) hoặc Done bị 400 cùng object (nothing persisted)
  const infeasible = infeasibleOf(data?.feasibility)
  const refused = feasibilityOfError(save.error)
  const blocked = infeasible !== null && !data?.requiresNewProgram
  const currentKg = data?.currentWeightKg ?? 0
  const targetKg = edit.targetWeightKg ?? data?.targetWeightKg ?? currentKg
  const ratePercent = Math.max(
    edit.weeklyRatePercent ?? Math.abs(data?.weeklyRatePercent ?? 0),
    0.1
  )
  // Loại goal do BE quyết (Maintenance khi |đích − cân hiện tại| < 0.1, tốc độ 0); chưa có preview thì không có gì để hiện (màn đang skeleton)
  const goalType =
    data?.goalType === 'Maintenance'
      ? 'Maintenance'
      : data?.goalType === 'WeightGain'
        ? 'WeightGain'
        : 'WeightLoss'

  const leave = () => {
    setDirection('back')
    edit.reset()
    router.push(routePath.program)
  }
  const done = () => {
    if (!data || blocked) return
    const weeklyRatePercent = Math.abs(data.weeklyRatePercent)
    if (data.requiresNewProgram) {
      edit.setPendingGoal({
        goalType: data.goalType,
        weeklyWeightChangeTargetPercent: weeklyRatePercent,
        targetWeightKg: data.targetWeightKg,
      })
      setDirection('forward')
      router.push(routePath.programNew)
      return
    }
    save.mutate({ targetWeightKg: data.targetWeightKg, weeklyRatePercent }, { onSuccess: leave })
  }

  return (
    <WizardShell
      sectionTitle="Edit goal"
      progress={step === 'params' ? 0.5 : 1}
      canGoBack
      onBack={() => {
        if (step === 'params') return leave()
        setDirection('back')
        router.push(`${routePath.programGoalEdit}/params`)
      }}
      stepKey={step}
      direction={direction}
      nextLabel={step === 'params' ? 'Next' : data?.requiresNewProgram ? 'Set new program' : 'Done'}
      // Preview không khả thi thì Done (PUT /goals/edit) chắc chắn bị 400 và không ghi gì: khoá, trừ đường đổi hướng goal (sang wizard New Program)
      nextDisabled={!data || (blocked && step === 'review')}
      isPending={save.isPending}
      pendingLabel="Saving…"
      onNext={() => {
        if (step === 'review') return done()
        setDirection('forward')
        router.push(`${routePath.programGoalEdit}/review`)
      }}
      error={save.error && !refused ? getFormErrorMessage(save.error) : null}
    >
      {query.error && !data ? (
        <div className="space-y-3">
          <FormErrorAlert
            title="Couldn't load your goal"
            message={getFormErrorMessage(query.error)}
          />
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="bg-secondary active:bg-muted h-11 rounded-full px-4 text-base transition-transform active:scale-95"
          >
            Try again
          </button>
        </div>
      ) : !data ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : step === 'params' ? (
        <GoalTargetStep
          goalType={goalType}
          currentWeightKg={currentKg}
          targetWeightKg={targetKg}
          onTargetChange={edit.setTarget}
          ratePercent={ratePercent}
          onRateChange={(value) =>
            // Dải tốc độ do BE trả theo hướng goal (tăng cân hẹp hơn giảm cân); vượt trần Fast thì BE trả 400
            edit.setRate(
              data.rateBounds.fastMaxPercent > 0
                ? Math.min(value, data.rateBounds.fastMaxPercent)
                : value
            )
          }
          preview={ready}
          weight={weight}
          energy={energy}
          manual={data.isManualProgram}
        />
      ) : (
        <GoalSummaryStep
          goalType={
            data.goalType === 'WeightLoss' || data.goalType === 'Maintenance'
              ? data.goalType
              : 'WeightGain'
          }
          currentWeightKg={currentKg}
          targetWeightKg={data.targetWeightKg}
          ratePercent={Math.abs(data.weeklyRatePercent)}
          preview={ready}
          weight={weight}
          energy={energy}
          manual={data.isManualProgram}
        />
      )}
      {(refused ?? infeasible) && (
        <FeasibilityNotice feasibility={(refused ?? infeasible) as Feasibility} className="mt-5" />
      )}
    </WizardShell>
  )
}
