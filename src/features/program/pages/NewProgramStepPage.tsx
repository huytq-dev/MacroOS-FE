'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Skeleton } from '@/components/ui/skeleton'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import {
  CalorieShiftAlert,
  ChoiceStep,
  DistributionStep,
  ProgramReadyStep,
  StepHeading,
  WizardShell,
} from '@/features/onboarding/components/OnboardingPage'
import {
  DIET_OPTIONS,
  floorOptionsOf,
  PROGRAM_STEP_TITLE,
  PROTEIN_OPTIONS,
  TRAINING_OPTIONS,
  type ChoiceOption,
} from '@/features/onboarding/types/onboarding-options.types'
import { useUnits } from '@/features/users/hooks/use-units'
import { useFlowStore } from '@/stores/flow.store'
import { useGoalEditStore } from '@/stores/goal-edit.store'
import { useProgramWizardStore, type ManualDay } from '@/stores/program-wizard.store'
import {
  EditorStep,
  ManualTargetsStep,
  manualDayError,
  SAME_DIFFERENT_OPTIONS,
  STYLE_OPTIONS,
} from '../components/NewProgramPage'
import {
  useCreateProgram,
  useCurrentProgram,
  usePreviewProgram,
  useProgramSetup,
} from '../hooks/use-program'
import { useWizardNav } from '../hooks/use-wizard-nav'
import type { ProgramPreview } from '../types/program.types'
import {
  calorieShiftProblemOf,
  calorieShiftProblemOfFeasibility,
  shiftFixesOf,
  type ShiftFix,
} from '../utils/calorie-shift'
import { feasibilityOfError, infeasibleOf, isShiftInfeasible } from '../utils/feasibility'
import { FeasibilityNotice, FeasibilityWarnings } from '../components/FeasibilityNotice'
import { orderedDays, paramsOf, WEEK_DAYS } from '../utils/day-macros'
import type { WizardStep } from '../utils/new-program-steps'
import { buildProgramRequest, defaultManualDay, wizardGoalOf } from '../utils/program-request'
import { reviewCopyOf, reviewFactsOf } from '../utils/review-copy'

const WARNING_TEXT: Record<string, string> = {
  MACRO_KCAL_MISMATCH: 'Your macros add up to far more or less than the Calories you set.',
  BELOW_FLOOR: 'This target is below your Calorie floor.',
}

interface View {
  readonly content: React.ReactNode
  readonly canNext: boolean
  readonly onNext: () => void
  readonly nextLabel?: string
  readonly isPending?: boolean
  readonly error?: string | null
}

/**
 * Một bước của wizard New Program (`/program/new/[step]`), dựng từ các màn đã có của wizard thiết lập: `WizardShell` (khung, thanh
 * tiến độ, trượt bước, nút dưới), `ChoiceStep` (diet, sàn calo, training, protein, kiểu program), `DistributionStep` (phân bổ calo) và
 * `ProgramReadyStep` (Review). Chỉ Editor theo ngày và Manual là màn riêng. Trang giữ mọi hook (store, setup / preview / tạo
 * program); Editor và Review lấy số từ `POST /programs/preview`, kéo slider ở editor chỉ tính tại chỗ.
 */
export function NewProgramStepPage({ step }: { readonly step: WizardStep }) {
  const nav = useWizardNav(step)
  const wizard = useProgramWizardStore()
  const direction = useFlowStore((state) => state.direction)
  const pendingGoal = useGoalEditStore((state) => state.pendingGoal)
  const program = useCurrentProgram()
  const setup = useProgramSetup()
  const preview = usePreviewProgram()
  const createProgram = useCreateProgram()
  const [selected, setSelected] = useState(0)
  // Bản xem trước mà user đã cuộn tới cuối phần giải thích: Done chỉ mở khi đúng bản đang hiển thị đã được đọc hết
  const [reviewed, setReviewed] = useState<ProgramPreview | null>(null)
  const units = useUnits()
  const markReviewed = useCallback(() => setReviewed(preview.data ?? null), [preview.data])

  const setupData = setup.data
  const current = program.data
  const goal = wizardGoalOf(current, pendingGoal, setupData)
  const hasDays = wizard.days !== null
  const { mutate: runPreview, isIdle: previewIdle } = preview

  // BE từ chối kiểu chia kcal (400 Calorie Shift) lúc xem trước (editor, review) hoặc lúc tạo: nêu ngày hỏng + cách sửa
  // Preview HTTP 200 mang `feasibility` (không ném lỗi); 400 của Create mang cùng `FeasibilityResponse` trong `data`
  const previewShift =
    calorieShiftProblemOf(preview.error) ??
    calorieShiftProblemOfFeasibility(preview.data?.feasibility)
  const createShift = calorieShiftProblemOf(createProgram.error)
  const shiftProblem = previewShift ?? createShift
  // Target không khả thi KHÔNG do shift (sàn, macro vượt kcal, tuần không hợp lệ): preview 200 hoặc Create 400 (nothing persisted); chỉ nêu vi phạm + cách chỉnh
  const previewInfeasible = infeasibleOf(preview.data?.feasibility)
  const createRefused = createShift ? null : feasibilityOfError(createProgram.error)
  const feasibilityIssue =
    createRefused ??
    (previewInfeasible && !isShiftInfeasible(previewInfeasible) ? previewInfeasible : null)
  // Đặt đúng giá trị BE đề xuất, chỉ khi người dùng bấm; xong thì bỏ kết quả lỗi cũ để effect bên dưới tính lại preview với số mới
  const applyShiftFix = (fix: ShiftFix) => {
    const { shiftPercent, shiftMode } = fix.change
    if (shiftPercent !== undefined) wizard.setPref('shiftPercent', shiftPercent)
    if (shiftMode) wizard.setPref('distribution', shiftMode)
    preview.reset()
    createProgram.reset()
    toast.success(fix.result)
  }
  const shiftAlert = shiftProblem && (
    <CalorieShiftAlert
      problem={shiftProblem}
      fixes={shiftFixesOf(shiftProblem)}
      onApply={applyShiftFix}
    />
  )

  // Editor và Review lấy số từ BE một lần khi vào bước (lỗi thì chờ user bấm Try again → reset → chạy lại)
  useEffect(() => {
    if (!setupData || !previewIdle || program.isLoading) return
    const state = useProgramWizardStore.getState()
    const weekGoal = wizardGoalOf(current, useGoalEditStore.getState().pendingGoal, setupData)
    if (step === 'review') runPreview(buildProgramRequest(state, weekGoal, setupData, true))
    else if (step === 'editor' && !hasDays)
      runPreview(buildProgramRequest(state, weekGoal, setupData, false), {
        onSuccess: (data) => {
          // Preview không khả thi (200 kèm `feasibility`) không có ngày hợp lệ để chỉnh: không gieo số, hiện vấn đề rồi tính lại sau khi user chọn cách sửa
          if (data.feasibility && !data.feasibility.isFeasible) return
          useProgramWizardStore.getState().seedDays(
            orderedDays(data.days).map((day, index) => ({
              ...paramsOf(day, setupData.weightKg),
              dayOfWeek: WEEK_DAYS[index],
              locked: Boolean(day.isLocked),
            }))
          )
        },
      })
  }, [step, setupData, previewIdle, runPreview, hasDays, program.isLoading, current])

  const choice = <T extends string>(
    title: string,
    options: readonly ChoiceOption<T>[],
    value: T | null,
    onChange: (next: T) => void,
    subtitle?: string
  ): View => ({
    content: (
      <ChoiceStep
        title={title}
        subtitle={subtitle}
        options={options}
        value={value}
        onChange={onChange}
      />
    ),
    canNext: value !== null,
    onNext: nav.next,
  })

  // 'same-different' chỉ có ở luồng Manual và cần số khởi điểm của BE (`setup.defaults`) nên cũng cần setup
  const needsSetup =
    step === 'floor' ||
    step === 'editor' ||
    step === 'manual-targets' ||
    step === 'review' ||
    step === 'same-different'

  const retryButton = (
    <button
      type="button"
      onClick={() => void setup.refetch()}
      className="bg-secondary active:bg-muted h-11 rounded-full px-4 text-base transition-transform active:scale-95"
    >
      Try again
    </button>
  )

  const viewOf = (): View => {
    if (needsSetup && !setupData)
      return {
        content: setup.isError ? (
          <div className="space-y-3">
            <FormErrorAlert
              title="Couldn't load your details"
              message={getFormErrorMessage(setup.error)}
            />
            {retryButton}
          </div>
        ) : (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ),
        canNext: false,
        onNext: nav.next,
      }
    // Manual: số khởi điểm chỉ lấy từ BE; setup đã tải mà không có ngày nào thì không đi tiếp (và không tự bịa số), cho thử lại
    const manualBase = defaultManualDay(setupData)
    if (step === 'same-different' && manualBase === null)
      return {
        content: (
          <div className="space-y-3">
            <FormErrorAlert
              title="Couldn't load your starting numbers"
              message="Your starting targets are not available right now. Try again in a moment."
            />
            {retryButton}
          </div>
        ),
        canNext: false,
        onNext: nav.next,
      }

    switch (step) {
      case 'style':
        return {
          ...choice(
            'Which program style?',
            STYLE_OPTIONS,
            wizard.programType,
            (value) => wizard.setPref('programType', value),
            pendingGoal ? "Your new goal is set. Now let's set up a program for it." : undefined
          ),
          onNext: () => {
            // Mở từ Edit Goal (đổi hướng): điền sẵn diet và protein của program hiện tại
            if (pendingGoal && current) {
              if (wizard.dietStyle === null) wizard.setPref('dietStyle', current.dietStyle)
              if (wizard.proteinLevel === null) wizard.setPref('proteinLevel', current.proteinLevel)
            }
            nav.next()
          },
        }
      case 'diet':
        return choice(PROGRAM_STEP_TITLE.diet, DIET_OPTIONS, wizard.dietStyle, (value) =>
          wizard.setPref('dietStyle', value)
        )
      case 'floor':
        return choice(
          PROGRAM_STEP_TITLE.floor,
          floorOptionsOf(setupData?.floors.standardKcal, setupData?.floors.lowKcal),
          wizard.floor,
          (value) => wizard.setPref('floor', value)
        )
      case 'training':
        return choice(PROGRAM_STEP_TITLE.training, TRAINING_OPTIONS, wizard.trainingType, (value) =>
          wizard.setPref('trainingType', value)
        )
      case 'distribute': {
        const mode = wizard.distribution ?? 'Even'
        return {
          content: (
            <DistributionStep
              mode={mode}
              onModeChange={(value) => wizard.setPref('distribution', value)}
              days={wizard.shiftDays}
              onDaysChange={(days) => wizard.setPref('shiftDays', days)}
              percent={wizard.shiftPercent}
              onPercentChange={(percent) => wizard.setPref('shiftPercent', percent)}
            />
          ),
          canNext:
            mode !== 'Custom' || (wizard.shiftDays.length >= 1 && wizard.shiftDays.length <= 6),
          // Next = chấp nhận lựa chọn đang hiện (Even chọn sẵn): ghi vào store để request gửi một lựa chọn đã lưu, không phải mặc định `??`
          onNext: () => {
            if (wizard.distribution !== mode) wizard.setPref('distribution', mode)
            nav.next()
          },
        }
      }
      case 'protein':
        return choice(PROGRAM_STEP_TITLE.protein, PROTEIN_OPTIONS, wizard.proteinLevel, (value) =>
          wizard.setPref('proteinLevel', value)
        )
      case 'editor':
        return {
          content: previewShift ? (
            <div>
              <StepHeading title="Daily targets" />
              {shiftAlert}
            </div>
          ) : previewInfeasible && !hasDays ? (
            // Chưa có ngày hợp lệ nào để chỉnh (BE `feasibility`): nêu vấn đề + cách chỉnh ở các bước trước thay vì kẹt ở skeleton
            <div>
              <StepHeading title="Daily targets" />
              <FeasibilityNotice feasibility={previewInfeasible} />
            </div>
          ) : (
            <EditorStep
              days={wizard.days}
              weightKg={setupData?.weightKg ?? 0}
              kcalMax={setupData?.kcalMax ?? 0}
              proteinPerKgMax={setupData?.proteinPerKgMax ?? 0}
              selected={selected}
              onSelect={setSelected}
              onChange={(index, patch) => wizard.updateDay(index, patch)}
              onResetAll={() => {
                const base = wizard.baseDays
                if (base && wizard.days)
                  wizard.setDays(wizard.days.map((day, index) => (day.locked ? day : base[index])))
              }}
              error={preview.error ? getFormErrorMessage(preview.error) : null}
              onRetry={() => preview.reset()}
            />
          ),
          canNext: hasDays,
          onNext: nav.next,
          nextLabel: 'Done',
        }
      case 'same-different':
        return {
          ...choice(
            'Should your targets change by day?',
            SAME_DIFFERENT_OPTIONS,
            wizard.manualMode,
            (value) => wizard.setPref('manualMode', value)
          ),
          onNext: () => {
            // manualBase đã được bảo đảm khác null ở trên (không thì đã trả về màn thử lại)
            if (!manualBase) return
            const days: ManualDay[] =
              wizard.manualMode === 'different' ? WEEK_DAYS.map(() => manualBase) : [manualBase]
            wizard.setManualDays(days)
            nav.next()
          },
        }
      case 'manual-targets': {
        const kcalMin = setupData?.floors.lowKcal ?? 0
        const kcalMax = setupData?.kcalMax ?? 0
        const days = wizard.manualDays
        return {
          content:
            days && wizard.manualMode ? (
              <ManualTargetsStep
                mode={wizard.manualMode}
                days={days}
                selected={selected}
                onSelect={setSelected}
                onChange={(index, patch) =>
                  wizard.setManualDays(
                    days.map((day, position) => (position === index ? { ...day, ...patch } : day))
                  )
                }
                kcalMin={kcalMin}
                kcalMax={kcalMax}
              />
            ) : null,
          canNext:
            days !== null &&
            days.every((day) => manualDayError(day, kcalMin, kcalMax, units.energy) === null),
          onNext: nav.next,
        }
      }
      case 'review': {
        // Chữ giải thích theo kiểu program, chỉ từ số thật của preview BE + lựa chọn của user
        const copy =
          preview.data && setupData && wizard.programType
            ? reviewCopyOf(
                reviewFactsOf({
                  programType: wizard.programType,
                  preview: preview.data,
                  weightKg: setupData.weightKg,
                  goalType: goal.goalType as 'WeightLoss' | 'Maintenance' | 'WeightGain',
                  ratePercent: goal.weeklyWeightChangeTargetPercent,
                  proteinLabel:
                    PROTEIN_OPTIONS.find((option) => option.value === wizard.proteinLevel)?.label ??
                    'Moderate',
                  dietLabel:
                    DIET_OPTIONS.find((option) => option.value === wizard.dietStyle)?.label ??
                    'Balanced',
                  hasLockedDays: wizard.days?.some((day) => day.locked) ?? false,
                }),
                units.energy
              )
            : undefined
        return {
          content: previewShift ? (
            <div>
              <StepHeading title="Your calorie shift needs a fix" />
              {shiftAlert}
            </div>
          ) : preview.error ? (
            <div className="space-y-3">
              <FormErrorAlert
                title="Couldn't build your program"
                message={getFormErrorMessage(preview.error)}
              />
              <button
                type="button"
                onClick={() => preview.reset()}
                className="bg-secondary active:bg-muted h-11 rounded-full px-4 text-base transition-transform active:scale-95"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {createShift && shiftAlert}
              {feasibilityIssue && <FeasibilityNotice feasibility={feasibilityIssue} />}
              {/* Macro ≠ kcal của target tự nhập: cảnh báo không chặn, vẫn cho Done */}
              {preview.data?.feasibility && (
                <FeasibilityWarnings feasibility={preview.data.feasibility} />
              )}
              {/* Cảnh báo nằm trên đầu: phần cuối trang (mốc "đã cuộn tới cuối") phải là nội dung cuối cùng user cần đọc */}
              {/* `feasibility.warnings` của BE thay cho `warnings[]` cũ (> 15 % / BELOW_FLOOR) khi BE đã gửi `feasibility` */}
              {preview.data && !preview.data.feasibility && preview.data.warnings.length > 0 && (
                <ul className="space-y-1 rounded-xl bg-[var(--mf-warning-bg)] px-4 py-3 text-base text-black/80">
                  {preview.data.warnings.map((warning) => (
                    <li key={`${warning.code}-${warning.dayOfWeek}`}>
                      {warning.dayOfWeek ? `${warning.dayOfWeek}: ` : ''}
                      {WARNING_TEXT[warning.code] ?? 'Take a second look at this day.'}
                    </li>
                  ))}
                </ul>
              )}
              <ProgramReadyStep
                days={preview.data ? orderedDays(preview.data.days) : undefined}
                copy={copy}
                onReachedEnd={markReviewed}
              />
            </div>
          ),
          // Done chỉ mở sau khi user đã cuộn tới cuối phần giải thích của đúng bản preview đang hiển thị
          // Preview không khả thi thì Create chắc chắn bị 400: khoá Done (BE không ghi gì dù có bấm)
          canNext:
            preview.data !== undefined &&
            reviewed === preview.data &&
            !createShift &&
            previewInfeasible === null,
          onNext: () => {
            if (!setupData) return
            createProgram.mutate(buildProgramRequest(wizard, goal, setupData, true), {
              // Cùng đường thoát với Close: đánh dấu "đang rời" để reset() không bị effect về bước 'style' đè lên điều hướng
              onSuccess: nav.close,
            })
          },
          nextLabel: 'Done',
          isPending: createProgram.isPending,
          error:
            createProgram.error && !createShift && !createRefused
              ? getFormErrorMessage(createProgram.error)
              : null,
        }
      }
    }
  }

  const view = viewOf()
  return (
    <WizardShell
      sectionTitle="Set New Program"
      progress={nav.progress}
      canGoBack
      onBack={nav.back}
      stepKey={step}
      direction={direction}
      nextLabel={view.nextLabel ?? 'Next'}
      nextDisabled={!view.canNext}
      isPending={view.isPending ?? false}
      pendingLabel="Creating…"
      onNext={view.onNext}
      error={view.error ?? null}
    >
      {view.content}
    </WizardShell>
  )
}
