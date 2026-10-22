'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import {
  useOnboardingState,
  usePriorWeightQuestion,
  useSaveBasics,
  useTdeeEstimate,
} from '@/features/onboarding/hooks/use-onboarding'
import { PRIOR_WEIGHT_API } from '@/features/onboarding/prior-weight.config'
import type { SaveBasicsRequest } from '@/features/onboarding/types/onboarding.types'
import { useProfile } from '@/features/users/hooks/use-profile'
import { useUnits } from '@/features/users/hooks/use-units'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { UNAVAILABLE_TEXT } from '../more.config'
import {
  ACTIVITY_CHOICES,
  ATHLETIC_PURSUITS_CHOICES,
  BMR_EQUATIONS,
  BMR_EQUATION_CHOICES,
  BMR_SEX_CHOICES,
  EXERCISE_CHOICES,
  EXPENDITURE_SETTINGS_API,
  PRIOR_PROGRESS_CHOICES,
  PRIOR_WEIGHT_CHOICES,
  PRIOR_WEIGHT_NEEDS_WEIGHT,
  choiceLabel,
  priorWeightQuestion,
  priorWeightSummary,
  type SettingChoice,
} from '../expenditure-settings.config'
import {
  useExpenditureSettings,
  useSaveExpenditureSettings,
} from '../hooks/use-expenditure-settings'
import type {
  AthleticPursuits,
  BmrEquationKind,
  BmrSex,
  WeighedMoreThanBefore,
} from '../types/expenditure-settings.types'
import { SettingChoiceSheet } from '../components/SettingChoiceSheet'
import { SettingCard, SettingRow } from '../components/SettingRows'

type VariableKey = 'activity' | 'exercise' | 'priorProgress' | 'athletic' | 'priorWeight' | 'sex'

interface Variable {
  readonly key: 'activity' | 'exercise' | 'priorProgress'
  readonly title: string
  readonly subtitle: string
  readonly choices: readonly SettingChoice[]
  readonly field: 'dailyActivity' | 'exerciseSessions' | 'recentWeightTrend'
}

const VARIABLES: readonly Variable[] = [
  {
    key: 'activity',
    title: 'Activity',
    subtitle: 'Activity during work and leisure',
    choices: ACTIVITY_CHOICES,
    field: 'dailyActivity',
  },
  {
    key: 'exercise',
    title: 'Exercise',
    subtitle: 'Cardio or lifting sessions',
    choices: EXERCISE_CHOICES,
    field: 'exerciseSessions',
  },
  {
    key: 'priorProgress',
    title: 'Prior Progress',
    subtitle: 'Your progress prior to MacroOS',
    choices: PRIOR_PROGRESS_CHOICES,
    field: 'recentWeightTrend',
  },
]

const Radio = ({ selected, pending }: { selected: boolean; pending: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      'flex size-7 shrink-0 items-center justify-center rounded-full border-2',
      selected ? 'border-white bg-white' : 'border-zinc-600'
    )}
  >
    {pending ? (
      <Loader2 className="size-4 animate-spin text-black" />
    ) : (
      selected && <span className="size-2 rounded-full bg-black" />
    )}
  </span>
)

/** Công thức BMR chọn được (hợp đồng mới): bấm một dòng = `PUT /expenditure/settings { bmrEquation }`; đang gửi thì khoá, lỗi ở lại dưới danh sách. */
function EquationChoices({
  value,
  onSelect,
}: {
  readonly value: BmrEquationKind
  readonly onSelect: (next: BmrEquationKind) => Promise<unknown>
}) {
  const [pending, setPending] = useState<BmrEquationKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const choose = async (next: BmrEquationKind) => {
    if (pending !== null || next === value) return
    setPending(next)
    setError(null)
    try {
      await onSelect(next)
    } catch (caught) {
      setError(getFormErrorMessage(caught))
    } finally {
      setPending(null)
    }
  }
  return (
    <>
      <div
        role="radiogroup"
        aria-label="Calculation Method"
        aria-busy={pending !== null}
        className="divide-foreground/10 divide-y"
      >
        {BMR_EQUATION_CHOICES.map((equation) => {
          const selected = (pending ?? value) === equation.value
          return (
            <button
              key={equation.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={pending !== null}
              onClick={() => void choose(equation.value)}
              className="focus-visible:ring-ring/50 flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:ring-1 focus-visible:outline-none disabled:opacity-70"
            >
              <span>
                <span className="block text-base">{equation.label}</span>
                <span className="text-muted-foreground block text-sm">{equation.description}</span>
              </span>
              <Radio selected={selected} pending={pending === equation.value} />
            </button>
          )
        })}
      </div>
      <div className="px-4">
        <FormErrorAlert title="Couldn't save" message={error} />
      </div>
    </>
  )
}

/**
 * More › Expenditure › BMR Equation (`Docs/MacroFactor_UI/UI/More/Expenditure_Settings/04–08`).
 * - cờ TẮT (BE đang chạy): công thức chỉ hiển thị cái BE dùng (`GET /onboarding/estimate`); Activity / Exercise / Prior Progress là đáp án hồ sơ, Lưu =
 *   `PUT /onboarding/basics` (chỉ ảnh hưởng ước tính ban đầu, phản hồi "Saved"); Athletic Pursuits và Prior Weight mờ "Not available yet".
 * - `EXPENDITURE_SETTINGS_API`: chọn công thức (MacroFactor / Cunningham), Athletic Pursuits (đúng 4 lựa chọn) và giới tính-cho-BMR lưu qua
 *   `PUT /expenditure/settings`; Prior Weight = "Have you ever weighed more than {ngưỡng của BE, đổi sang đơn vị user, lb làm tròn lên}?" Yes / No / Not sure
 *   (`PUT { weighedMoreThanBefore }`); chưa có ngưỡng (chưa có cân nặng) thì hàng chỉ đọc với dòng trung tính, không số.
 *   Hàng giới tính-cho-BMR CHỈ hiện khi công thức MacroFactor cần và hồ sơ là Gender = Other (câu hỏi riêng, không mặc định).
 */
export function BmrEquationPage() {
  const state = useOnboardingState()
  const estimate = useTdeeEstimate(!EXPENDITURE_SETTINGS_API)
  const save = useSaveBasics()
  const settings = useExpenditureSettings(EXPENDITURE_SETTINGS_API)
  const saveSettings = useSaveExpenditureSettings()
  const profile = useProfile()
  const [editing, setEditing] = useState<VariableKey | null>(null)

  const answers = state.data
  const data = EXPENDITURE_SETTINGS_API ? settings.data : undefined
  const variable = VARIABLES.find((item) => item.key === editing)
  const current = (item: Variable) => (answers ? answers[item.field] : null)
  const units = useUnits()
  // Prior Weight: số trong câu hỏi do BE tính từ cân nặng hiện tại (`GET /onboarding/prior-weight-question`, sau cờ PRIOR_WEIGHT_API); chưa có số (cờ tắt, chưa có
  // cân nặng, lỗi) thì hàng chỉ đọc, không mở câu hỏi. Dòng phụ đề lấy từ số ĐÃ HIỆN lúc trả lời (đã lưu), không phải số hiện tại.
  const priorQuestion = usePriorWeightQuestion(
    { unit: units.weight.unit },
    PRIOR_WEIGHT_API && data !== undefined
  )
  const priorAnswer = data?.weighedMoreThanBefore ?? null
  const needsSex = data?.bmrEquation === 'MacroFactor' && profile.data?.gender === 'Other'

  if (EXPENDITURE_SETTINGS_API && settings.isError)
    return (
      <div className="flex w-full max-w-2xl min-w-0 flex-col gap-6">
        <SubPageHeader title="BMR Equation" />
        <div className="bg-card rounded-2xl">
          <ErrorState
            error={settings.error}
            variant="inline"
            onRetry={() => void settings.refetch()}
            isRetrying={settings.isFetching}
          />
        </div>
      </div>
    )

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-6 md:pb-0">
      <SubPageHeader title="BMR Equation" />
      <section aria-label="Calculation Method" className="space-y-3">
        <h2 className="text-xl font-bold">Calculation Method</h2>
        <SettingCard>
          {EXPENDITURE_SETTINGS_API ? (
            data ? (
              <EquationChoices
                value={data.bmrEquation}
                onSelect={(bmrEquation) => saveSettings.mutateAsync({ bmrEquation })}
              />
            ) : (
              <Skeleton className="h-28 rounded-none" aria-busy="true" />
            )
          ) : estimate.isPending ? (
            <Skeleton className="h-28 rounded-none" aria-busy="true" />
          ) : estimate.isError ? (
            // Ví dụ BE 400 báo thiếu câu trả lời: hiện lỗi hiện có + Try again, không tự chọn công thức / bịa số
            <ErrorState
              error={estimate.error}
              variant="inline"
              onRetry={() => void estimate.refetch()}
              isRetrying={estimate.isFetching}
            />
          ) : (
            <div
              role="radiogroup"
              aria-label="Calculation Method"
              aria-disabled="true"
              className="divide-foreground/10 divide-y"
            >
              {BMR_EQUATIONS.map((equation) => {
                const selected = estimate.data?.method === equation.value
                return (
                  <div
                    key={equation.value}
                    role="radio"
                    aria-checked={selected}
                    aria-disabled="true"
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3',
                      !selected && 'opacity-50'
                    )}
                  >
                    <span>
                      <span className="block text-base">{equation.label}</span>
                      <span className="text-muted-foreground block text-sm">
                        {equation.description}
                      </span>
                    </span>
                    <Radio selected={selected} pending={false} />
                  </div>
                )
              })}
            </div>
          )}
        </SettingCard>
        {!EXPENDITURE_SETTINGS_API && (
          <p className="text-muted-foreground px-1 text-sm">
            Choosing the equation is {UNAVAILABLE_TEXT.toLowerCase()}.
          </p>
        )}
      </section>

      <section aria-label="BMR Impacting Variables" className="space-y-3">
        <h2 className="text-xl font-bold">BMR Impacting Variables</h2>
        <SettingCard>
          {state.isPending || (EXPENDITURE_SETTINGS_API && !data) ? (
            <Skeleton className="h-64 rounded-none" aria-busy="true" />
          ) : (
            <>
              <SettingRow
                title="Activity"
                subtitle={choiceLabel(ACTIVITY_CHOICES, answers?.dailyActivity) ?? 'Not set'}
                action="edit"
                onEdit={() => setEditing('activity')}
              />
              <SettingRow
                title="Exercise"
                subtitle={choiceLabel(EXERCISE_CHOICES, answers?.exerciseSessions) ?? 'Not set'}
                action="edit"
                onEdit={() => setEditing('exercise')}
              />
              {data ? (
                <SettingRow
                  title="Athletic Pursuits"
                  subtitle={
                    choiceLabel(ATHLETIC_PURSUITS_CHOICES, data.athleticPursuits) ?? 'Not set'
                  }
                  action="edit"
                  onEdit={() => setEditing('athletic')}
                />
              ) : (
                <SettingRow
                  title="Athletic Pursuits"
                  subtitle={UNAVAILABLE_TEXT}
                  action="edit"
                  disabled
                />
              )}
              <SettingRow
                title="Prior Weight"
                subtitle={
                  data
                    ? priorAnswer !== null
                      ? priorWeightSummary(
                          priorAnswer,
                          data.weighedMoreThanBeforeThresholdShown,
                          data.weighedMoreThanBeforeThresholdUnit
                        )
                      : priorQuestion.isError
                        ? PRIOR_WEIGHT_NEEDS_WEIGHT
                        : 'Not set'
                    : UNAVAILABLE_TEXT
                }
                action="edit"
                disabled={!priorQuestion.data}
                onEdit={() => setEditing('priorWeight')}
              />
              <SettingRow
                title="Prior Progress"
                subtitle={
                  choiceLabel(PRIOR_PROGRESS_CHOICES, answers?.recentWeightTrend) ?? 'Not set'
                }
                action="edit"
                onEdit={() => setEditing('priorProgress')}
              />
              {needsSex && (
                <SettingRow
                  title="Sex for BMR"
                  subtitle={choiceLabel(BMR_SEX_CHOICES, data?.bmrSex) ?? 'Not set'}
                  action="edit"
                  onEdit={() => setEditing('sex')}
                />
              )}
            </>
          )}
        </SettingCard>
      </section>

      {variable && (
        <SettingChoiceSheet
          open
          onOpenChange={(open) => !open && setEditing(null)}
          title={variable.title}
          subtitle={variable.subtitle}
          choices={variable.choices}
          value={current(variable)}
          onSave={async (value) => {
            // `step` 0 không làm lùi tiến độ wizard (BE giữ max); chỉ trường được chọn đổi
            await save.mutateAsync({ step: 0, [variable.field]: value } as SaveBasicsRequest)
            toast.success('Saved')
          }}
        />
      )}
      {editing === 'athletic' && data && (
        <SettingChoiceSheet
          open
          onOpenChange={(open) => !open && setEditing(null)}
          title="Athletic Pursuits"
          subtitle="Which describes you best?"
          choices={ATHLETIC_PURSUITS_CHOICES}
          value={data.athleticPursuits}
          onSave={(value) =>
            saveSettings.mutateAsync({ athleticPursuits: value as AthleticPursuits })
          }
        />
      )}
      {editing === 'priorWeight' && data && priorQuestion.data && (
        <SettingChoiceSheet
          open
          onOpenChange={(open) => !open && setEditing(null)}
          title="Prior Weight"
          subtitle={priorWeightQuestion(
            priorQuestion.data.displayValue,
            priorQuestion.data.displayUnit
          )}
          choices={PRIOR_WEIGHT_CHOICES}
          value={data.weighedMoreThanBefore}
          onSave={(value) =>
            // Gửi KÈM đúng số + đơn vị đã hiện trong câu hỏi này
            saveSettings.mutateAsync({
              weighedMoreThanBefore: value as WeighedMoreThanBefore,
              priorWeightThresholdShown: priorQuestion.data.displayValue,
              priorWeightThresholdUnit: priorQuestion.data.displayUnit,
            })
          }
        />
      )}
      {editing === 'sex' && needsSex && (
        <SettingChoiceSheet
          open
          onOpenChange={(open) => !open && setEditing(null)}
          title="Sex for BMR"
          subtitle="Used only to calculate your BMR"
          choices={BMR_SEX_CHOICES}
          value={data?.bmrSex ?? null}
          onSave={(value) => saveSettings.mutateAsync({ bmrSex: value as BmrSex })}
        />
      )}
    </div>
  )
}
