'use client'

import { useState } from 'react'
import {
  BodyMetricView,
  MetricEntrySheet,
  SCALE_WEIGHT_TUTORIAL,
  type MetricValues,
} from '../components/BodyMetricPage'
import { useDeleteWeight, useUpsertWeight, useWeightHistory } from '../hooks/use-weights'
import { bodyFatValueSchema, LB_PER_KG, weightValueSchema } from '../schemas/body-metric.schema'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { ScaleIcon } from '@/features/dashboard/components/DetailPage'
import { usePersistedChoice } from '@/features/dashboard/hooks/use-dashboard'
import { useProfile } from '@/features/users/hooks/use-profile'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { useIsClient } from '@/hooks/use-is-client'
import { formatDate, todayIso } from '@/lib/date'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const
const round1 = (value: number) => Math.round(value * 10) / 10

/**
 * Trang Scale Weight (bấm ô Scale Weight ở Dashboard): biểu đồ + lịch sử số cân, bảng nhập Weight + Body Fat (% mỡ đo bằng cân,
 * BE lưu kèm ngày cân, tách khỏi Visual Body Fat). kg/lb theo hồ sơ, chỉ đổi khi hiển thị/nhập; BE luôn nhận kg.
 */
export function ScaleWeightPage() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const history = useWeightHistory(today)
  const profile = useProfile()
  const [tutorial, setTutorial] = usePersistedChoice(
    'scale-weight.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  // Ngày giữ nguyên khi đóng để bảng không đổi nội dung lúc đang trượt xuống
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmDate, setConfirmDate] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const upsert = useUpsertWeight()
  const remove = useDeleteWeight()

  const unit = profile.data?.unitPreference === 'Imperial' ? 'lb' : 'kg'
  const toDisplay = (kg: number) => (unit === 'kg' ? kg : round1(kg * LB_PER_KG))
  const toKg = (value: number) => (unit === 'kg' ? value : round1(value / LB_PER_KG))

  const items = history.data?.items ?? []
  const points = [...items]
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .map((item) => ({ date: item.logDate, value: toDisplay(item.weightKg) }))
  const entry = items.find((item) => item.logDate === sheetDate)

  const openSheet = (date: string) => {
    setSaveError(null)
    setSheetDate(date)
    setSheetOpen(true)
  }

  const save = (values: MetricValues) => {
    if (!sheetDate) return
    // BE gắn % mỡ cân vào lần cân của ngày: không có số cân thì không lưu được
    if (values.weight === null) {
      setSaveError('Enter your weight to save body fat for this day')
      return
    }
    upsert.mutate(
      {
        logDate: sheetDate,
        weightKg: toKg(values.weight),
        notes: entry?.notes ?? null,
        ...(values.bodyFat !== null
          ? { bodyFatPercent: values.bodyFat }
          : entry?.bodyFatPercent != null && { clearBodyFat: true }),
      },
      {
        onSuccess: () => setSheetOpen(false),
        onError: (error) => setSaveError(getFormErrorMessage(error)),
      }
    )
  }

  if (history.isError)
    return <ErrorState error={history.error} onRetry={() => void history.refetch()} />

  return (
    <>
      <BodyMetricView
        title="Scale Weight"
        unit={unit}
        points={points}
        today={today}
        isLoading={history.isLoading}
        tutorial={tutorial === 'show' ? SCALE_WEIGHT_TUTORIAL : null}
        onDismissTutorial={() => setTutorial('hidden')}
        historyIcon={
          <span className="bg-foreground text-background flex size-10 shrink-0 items-center justify-center rounded-lg">
            <ScaleIcon className="size-6" />
          </span>
        }
        onAdd={() => today && openSheet(today)}
        onEdit={openSheet}
      />

      {today && (
        <MetricEntrySheet
          key={`${sheetDate}-${history.dataUpdatedAt}`}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          metric="Scale Weight"
          date={sheetDate ?? today}
          today={today}
          onDateChange={openSheet}
          fields={[
            {
              key: 'weight',
              label: 'Weight',
              unit,
              initial: entry ? toDisplay(entry.weightKg) : null,
              schema: weightValueSchema(unit),
            },
            {
              key: 'bodyFat',
              label: 'Body Fat',
              unit: '%',
              initial: entry?.bodyFatPercent ?? null,
              schema: bodyFatValueSchema,
            },
          ]}
          onDelete={entry ? () => setConfirmDate(entry.logDate) : undefined}
          isPending={upsert.isPending}
          error={saveError}
          onSave={save}
        />
      )}

      <ConfirmDialog
        open={confirmDate !== null}
        onOpenChange={(open) => !open && setConfirmDate(null)}
        title="Delete this weigh-in?"
        description={
          confirmDate
            ? `Delete the weigh-in on ${formatDate(confirmDate)} and its body fat. Trend weight and expenditure are recalculated from that day on.`
            : ''
        }
        confirmLabel="Delete weigh-in"
        pendingLabel="Deleting..."
        isPending={remove.isPending}
        onConfirm={() =>
          confirmDate &&
          remove.mutate(confirmDate, {
            onSuccess: () => {
              setConfirmDate(null)
              setSheetOpen(false)
            },
          })
        }
      />
    </>
  )
}
