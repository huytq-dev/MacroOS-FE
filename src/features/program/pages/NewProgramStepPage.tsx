'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import {
  ChoiceStep,
  DistributionStep,
  ProgramReadyStep,
  WizardShell,
} from '@/features/onboarding/components/OnboardingPage'
import {
  DIET_OPTIONS,
  FLOOR_ICON,
  PROTEIN_OPTIONS,
  TRAINING_OPTIONS,
  type ChoiceOption,
} from '@/features/onboarding/types/onboarding-options.types'
import type { ProgramPreview as ReadyPreview } from '@/features/onboarding/types/onboarding.types'
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
import type { ProgramPreview, ProgramSetup } from '../types/program.types'
import { orderedDays, paramsOf, WEEK_DAYS } from '../utils/day-macros'
import type { WizardStep } from '../utils/new-program-steps'
import { buildProgramRequest, defaultManualDay, wizardGoalOf } from '../utils/program-request'

/** Preview của BE (`/programs/preview`) → dạng màn "Your macro program is ready" của onboarding. */
const toReadyPreview = (preview: ProgramPreview, setup: ProgramSetup): ReadyPreview => ({
  tdeeKcal: preview.estimatedTdeeKcal,
  averageCalories: preview.averageCalories,
  proteinGPerKg: setup.weightKg > 0 ? preview.averageProteinG / setup.weightKg : 0,
  weeklyChangeKg: preview.weeklyChangeKg,
  weeklyChangePercent: preview.weeklyChangePercent,
  projectedEndDate: preview.projectedEndDate,
  floorStandardKcal: setup.floors.standardKcal,
  floorLowKcal: setup.floors.lowKcal,
  currentWeightKg: setup.weightKg,
  days: orderedDays(preview.days).map((day) => ({
    dayOfWeek: day.dayOfWeek,
    calories: day.calories,
    proteinG: day.proteinG,
    carbsG: day.carbsG,
    fatG: day.fatG,
  })),
})

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
  const router = useRouter()
  const nav = useWizardNav(step)
  const wizard = useProgramWizardStore()
  const direction = useFlowStore((state) => state.direction)
  const setDirection = useFlowStore((state) => state.setDirection)
  const pendingGoal = useGoalEditStore((state) => state.pendingGoal)
  const setPendingGoal = useGoalEditStore((state) => state.setPendingGoal)
  const program = useCurrentProgram()
  const setup = useProgramSetup()
  const preview = usePreviewProgram()
  const createProgram = useCreateProgram()
  const [selected, setSelected] = useState(0)

  const setupData = setup.data
  const current = program.data
  const goal = wizardGoalOf(current, pendingGoal, setupData)
  const hasDays = wizard.days !== null
  const { mutate: runPreview, isIdle: previewIdle } = preview

  // Editor và Review lấy số từ BE một lần khi vào bước (lỗi thì chờ user bấm Try again → reset → chạy lại)
  useEffect(() => {
    if (!setupData || !previewIdle || program.isLoading) return
    const state = useProgramWizardStore.getState()
    const weekGoal = wizardGoalOf(current, useGoalEditStore.getState().pendingGoal, setupData)
    if (step === 'review') runPreview(buildProgramRequest(state, weekGoal, setupData, true))
    else if (step === 'editor' && !hasDays)
      runPreview(buildProgramRequest(state, weekGoal, setupData, false), {
        onSuccess: (data) =>
          useProgramWizardStore.getState().seedDays(
            orderedDays(data.days).map((day, index) => ({
              ...paramsOf(day, setupData.weightKg),
              dayOfWeek: WEEK_DAYS[index],
              locked: Boolean(day.isLocked),
            }))
          ),
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

  const needsSetup =
    step === 'floor' || step === 'editor' || step === 'manual-targets' || step === 'review'

  const viewOf = (): View => {
    if (needsSetup && !setupData)
      return {
        content: setup.isError ? (
          <div className="space-y-3">
            <FormErrorAlert
              title="Couldn't load your details"
              message={getFormErrorMessage(setup.error)}
            />
            <button
              type="button"
              onClick={() => void setup.refetch()}
              className="bg-secondary active:bg-muted h-11 rounded-full px-4 text-base transition-transform active:scale-95"
            >
              Try again
            </button>
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
        return choice('Which diet style do you prefer?', DIET_OPTIONS, wizard.dietStyle, (value) =>
          wizard.setPref('dietStyle', value)
        )
      case 'floor':
        return choice(
          'Which calorie floor do you want?',
          [
            {
              value: 'Standard',
              label: 'Standard floor',
              description: `Your calorie recommendation will never drop below ${setupData?.floors.standardKcal} kcal`,
              icon: FLOOR_ICON.Standard,
            },
            {
              value: 'Low',
              label: 'Low floor',
              description: `Your calorie recommendation will never drop below ${setupData?.floors.lowKcal} kcal (consider carefully)`,
              icon: FLOOR_ICON.Low,
            },
          ],
          wizard.floor,
          (value) => wizard.setPref('floor', value)
        )
      case 'training':
        return choice(
          'What will you train during this program?',
          TRAINING_OPTIONS,
          wizard.trainingType,
          (value) => wizard.setPref('trainingType', value)
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
          onNext: nav.next,
        }
      }
      case 'protein':
        return choice(
          'Which protein level do you prefer?',
          PROTEIN_OPTIONS,
          wizard.proteinLevel,
          (value) => wizard.setPref('proteinLevel', value)
        )
      case 'editor':
        return {
          content: (
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
            const base = defaultManualDay(setupData)
            const days: ManualDay[] =
              wizard.manualMode === 'different' ? WEEK_DAYS.map(() => base) : [base]
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
            days !== null && days.every((day) => manualDayError(day, kcalMin, kcalMax) === null),
          onNext: nav.next,
        }
      }
      case 'review': {
        const ready =
          preview.data && setupData ? toReadyPreview(preview.data, setupData) : undefined
        const manual = wizard.programType === 'Manual'
        return {
          content: preview.error ? (
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
              <ProgramReadyStep
                preview={ready}
                goalType={goal.goalType as 'WeightLoss' | 'Maintenance' | 'WeightGain'}
                ratePercent={goal.weeklyWeightChangeTargetPercent}
                proteinLabel={
                  PROTEIN_OPTIONS.find((option) => option.value === wizard.proteinLevel)?.label ??
                  'Moderate'
                }
                dietLabel={
                  DIET_OPTIONS.find((option) => option.value === wizard.dietStyle)?.label ??
                  'Balanced'
                }
                onReachedEnd={() => undefined}
              />
              {preview.data && preview.data.warnings.length > 0 && (
                <ul className="space-y-1 rounded-xl bg-[var(--mf-warning-bg)] px-4 py-3 text-base text-black/80">
                  {preview.data.warnings.map((warning) => (
                    <li key={`${warning.code}-${warning.dayOfWeek}`}>
                      {warning.dayOfWeek ? `${warning.dayOfWeek}: ` : ''}
                      {WARNING_TEXT[warning.code] ?? 'Take a second look at this day.'}
                    </li>
                  ))}
                </ul>
              )}
              {manual && (
                <section aria-labelledby="whats-next" className="bg-secondary rounded-2xl p-4">
                  <h2 id="whats-next" className="text-lg font-semibold">
                    What&apos;s next?
                  </h2>
                  <p className="text-muted-foreground mt-2 text-base">
                    Because you set your own targets, your program won&apos;t update automatically
                    each week. We&apos;ll still track your progress and estimate your expenditure.
                  </p>
                </section>
              )}
            </div>
          ),
          canNext: Boolean(preview.data),
          onNext: () => {
            if (!setupData) return
            createProgram.mutate(buildProgramRequest(wizard, goal, setupData, true), {
              onSuccess: () => {
                setDirection('back')
                wizard.reset()
                setPendingGoal(null)
                router.push(routePath.program)
              },
            })
          },
          nextLabel: 'Done',
          isPending: createProgram.isPending,
          error: createProgram.error ? getFormErrorMessage(createProgram.error) : null,
        }
      }
    }
  }

  const view = viewOf()
  return (
    <WizardShell
      sectionTitle="New program"
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
