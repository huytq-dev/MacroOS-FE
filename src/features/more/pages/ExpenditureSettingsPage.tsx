'use client'

import { useState } from 'react'
import { ErrorState } from '@/components/shared/ErrorState'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { useCurrentProgram, useSetManualExpenditure } from '@/features/program/hooks/use-program'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { formatDate } from '@/lib/date'
import { UNAVAILABLE_TEXT } from '../more.config'
import {
  ALGORITHM_NAME,
  EXPENDITURE_MODE_API,
  EXPENDITURE_SETTINGS_API,
} from '../expenditure-settings.config'
import {
  useExpenditureSettings,
  useSaveExpenditureSettings,
  useSetCalculationMode,
} from '../hooks/use-expenditure-settings'
import { ManualTdeeSheet, type DefaultOrValueCopy } from '../components/ManualTdeeSheet'
import { SettingCard, SettingRow, SettingSwitchRow } from '../components/SettingRows'

const METHOD_COPY: DefaultOrValueCopy = {
  title: 'Estimation Method',
  subtitle: 'Impacts your initial expenditure',
  first: {
    label: 'Default',
    description:
      'A Basal Metabolic Rate (BMR) equation and estimated activity factor will be used to estimate your initial expenditure before the dynamic calculation begins',
  },
  second: {
    label: 'Manual',
    description: "Override MacroOS's default initial expenditure estimate with your own estimate",
    placeholder: 'Enter manual value',
    inputLabel: 'Manual value',
  },
  needsProgram: 'Estimation Method needs an active program.',
}

const MODE_COPY: DefaultOrValueCopy = {
  title: 'Calculation Mode',
  subtitle: 'How your expenditure is calculated',
  first: {
    label: 'Dynamic (Recommended)',
    description:
      'Energy expenditure is calculated using your weight and caloric intake and used to calibrate your diet week to week',
  },
  second: {
    label: 'Static',
    description:
      "Replaces your expenditure with a static value of your own choosing and pauses MacroOS's expenditure updates",
    placeholder: 'Enter static value',
    inputLabel: 'Static value',
  },
}

function Section({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}) {
  return (
    <section aria-label={title} className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <SettingCard>{children}</SettingCard>
    </section>
  )
}

/**
 * More › Expenditure (`Docs/MacroFactor_UI/UI/More/Expenditure_Settings/01–03, 09, 10`): Initial Estimate, Expenditure Calculation, Expenditure Modifiers.
 * Hai chế độ nối BE, chọn bằng cờ (`expenditure-settings.config.ts`):
 * - cờ TẮT (BE đang chạy): Estimation Method › Manual qua `PUT /programs/current/expenditure` (cần program đang chạy); ngày bắt đầu, Calculation Mode
 *   và hai công tắc hiện mờ "Not available yet" — không có "lưu" giả. Algorithm luôn chỉ hiển thị thuật toán duy nhất BE có ("MacroOS Adaptive Expenditure").
 * - `EXPENDITURE_SETTINGS_API`: Estimation Method (Default / Manual) và ngày bắt đầu (chỉ đọc) lấy từ `GET /expenditure/settings`, lưu qua `PUT` cùng route.
 * - `EXPENDITURE_MODE_API`: Calculation Mode (Dynamic / Static) lưu qua `POST /expenditure/mode`.
 */
export function ExpenditureSettingsPage() {
  const program = useCurrentProgram()
  const setManual = useSetManualExpenditure()
  const settings = useExpenditureSettings(EXPENDITURE_SETTINGS_API)
  const saveSettings = useSaveExpenditureSettings()
  const setMode = useSetCalculationMode()
  const [sheet, setSheet] = useState<'method' | 'mode' | null>(null)

  const data = EXPENDITURE_SETTINGS_API ? settings.data : undefined
  const loading = EXPENDITURE_SETTINGS_API ? settings.isPending : program.isLoading
  const manualKcal = data
    ? data.initialEstimateMode === 'Manual'
      ? data.manualInitialTdeeKcal
      : null
    : (program.data?.manualInitialTdeeKcal ?? null)
  const staticKcal = data?.mode === 'Static' ? data.staticTdeeKcal : null
  const modeEditable = EXPENDITURE_MODE_API && data !== undefined

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-6 md:pb-0">
      <SubPageHeader title="Expenditure" />
      {EXPENDITURE_SETTINGS_API && settings.isError ? (
        <div className="bg-card rounded-2xl">
          <ErrorState
            error={settings.error}
            variant="inline"
            onRetry={() => void settings.refetch()}
            isRetrying={settings.isFetching}
          />
        </div>
      ) : loading ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <Section title="Initial Estimate">
            <SettingRow
              title="Estimation Method"
              subtitle={manualKcal === null ? 'Default' : 'Manual'}
              action="edit"
              onEdit={() => setSheet('method')}
            />
            <SettingRow
              title="Calculation Start Date"
              subtitle={
                data?.calculationStartDate
                  ? formatDate(data.calculationStartDate)
                  : UNAVAILABLE_TEXT
              }
              action="edit"
              disabled
            />
            <SettingRow
              title="BMR Equation"
              subtitle="Configure how your BMR is initially calculated"
              action="link"
              href={routePath.moreBmr}
            />
          </Section>
          <Section title="Expenditure Calculation">
            <SettingRow
              title="Calculation Mode"
              subtitle={data ? data.mode : 'Dynamic'}
              action="edit"
              disabled={!modeEditable}
              onEdit={() => setSheet('mode')}
            />
            <SettingRow
              title="Algorithm"
              subtitle={data?.algorithmName ?? ALGORITHM_NAME}
              action="edit"
              readOnly
            />
          </Section>
          <Section title="Expenditure Modifiers">
            <SettingSwitchRow
              title="Step-Informed Updates"
              description={UNAVAILABLE_TEXT}
              disabled
            />
            <SettingSwitchRow
              title="Predictive Goal Adjustment"
              description={UNAVAILABLE_TEXT}
              disabled
            />
          </Section>
        </>
      )}
      {sheet === 'method' && (
        <ManualTdeeSheet
          open
          onOpenChange={() => setSheet(null)}
          copy={METHOD_COPY}
          savedKcal={manualKcal}
          hasProgram={EXPENDITURE_SETTINGS_API || Boolean(program.data)}
          onSave={(kcal) =>
            EXPENDITURE_SETTINGS_API
              ? saveSettings.mutateAsync({
                  initialEstimateMode: 'Manual',
                  manualInitialTdeeKcal: kcal,
                })
              : setManual.mutateAsync(kcal)
          }
          onUseDefault={
            EXPENDITURE_SETTINGS_API
              ? () => saveSettings.mutateAsync({ initialEstimateMode: 'Formula' })
              : undefined
          }
        />
      )}
      {sheet === 'mode' && modeEditable && (
        <ManualTdeeSheet
          open
          onOpenChange={() => setSheet(null)}
          copy={MODE_COPY}
          savedKcal={staticKcal}
          hasProgram
          onSave={(kcal) => setMode.mutateAsync({ mode: 'Static', staticTdeeKcal: kcal })}
          onUseDefault={() => setMode.mutateAsync({ mode: 'Dynamic' })}
        />
      )}
    </div>
  )
}
