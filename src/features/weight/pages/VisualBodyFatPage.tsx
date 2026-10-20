'use client'

import { useState } from 'react'
import {
  BodyMetricView,
  MetricEntrySheet,
  MEASUREMENT_TUTORIAL,
} from '../components/BodyMetricPage'
import {
  useDeleteVisualBodyFat,
  useUpsertVisualBodyFat,
  useVisualBodyFat,
} from '../hooks/use-weights'
import { bodyFatValueSchema } from '../schemas/body-metric.schema'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { usePersistedChoice } from '@/features/dashboard/hooks/use-dashboard'
import { BodyFatReferenceSheet } from '@/features/shortcuts/components/BodyFatReferenceSheet'
import { useProfile } from '@/features/users/hooks/use-profile'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { useIsClient } from '@/hooks/use-is-client'
import { formatDate, todayIso } from '@/lib/date'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/**
 * Trang Visual Body Fat (bấm ô Visual Body Fat ở Dashboard): % mỡ ước lượng bằng mắt, cùng bố cục với Scale Weight;
 * bảng nhập có nút Reference mở lưới 3×3 hình thân (nam/nữ theo hồ sơ), chọn một ô thì điền % giữa khoảng.
 */
export function VisualBodyFatPage() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const history = useVisualBodyFat(today)
  const profile = useProfile()
  const [tutorial, setTutorial] = usePersistedChoice(
    'visual-body-fat.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [referenceOpen, setReferenceOpen] = useState(false)
  // Giá trị chọn từ Reference: thay giá trị sẵn có của ô cho tới khi đổi ngày / mở lại
  const [picked, setPicked] = useState<number | null>(null)
  const [confirmDate, setConfirmDate] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const upsert = useUpsertVisualBodyFat()
  const remove = useDeleteVisualBodyFat()

  const items = history.data?.items ?? []
  const points = [...items]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({ date: item.date, value: item.percent }))
  const entry = items.find((item) => item.date === sheetDate)

  const openSheet = (date: string) => {
    setSaveError(null)
    setPicked(null)
    setSheetDate(date)
    setSheetOpen(true)
  }

  if (history.isError)
    return <ErrorState error={history.error} onRetry={() => void history.refetch()} />

  return (
    <>
      <BodyMetricView
        title="Visual Body Fat"
        unit="%"
        points={points}
        today={today}
        isLoading={history.isLoading}
        tutorial={tutorial === 'show' ? MEASUREMENT_TUTORIAL : null}
        onDismissTutorial={() => setTutorial('hidden')}
        onAdd={() => today && openSheet(today)}
        onEdit={openSheet}
      />

      {today && (
        <MetricEntrySheet
          key={`${sheetDate}-${history.dataUpdatedAt}-${picked}`}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          metric="Visual Body Fat"
          date={sheetDate ?? today}
          today={today}
          onDateChange={openSheet}
          fields={[
            {
              key: 'percent',
              label: 'Visual Body Fat',
              unit: '%',
              initial: picked ?? entry?.percent ?? null,
              schema: bodyFatValueSchema,
            },
          ]}
          onReference={() => setReferenceOpen(true)}
          onDelete={entry ? () => setConfirmDate(entry.date) : undefined}
          isPending={upsert.isPending}
          error={saveError}
          onSave={(values) =>
            sheetDate &&
            values.percent !== null &&
            upsert.mutate(
              { date: sheetDate, percent: values.percent },
              {
                onSuccess: () => setSheetOpen(false),
                onError: (error) => setSaveError(getFormErrorMessage(error)),
              }
            )
          }
        />
      )}

      <BodyFatReferenceSheet
        open={referenceOpen}
        onOpenChange={setReferenceOpen}
        body={profile.data?.gender === 'Female' ? 'female' : 'male'}
        onSelect={setPicked}
      />

      <ConfirmDialog
        open={confirmDate !== null}
        onOpenChange={(open) => !open && setConfirmDate(null)}
        title="Delete this entry?"
        description={confirmDate ? `Delete the visual body fat on ${formatDate(confirmDate)}.` : ''}
        confirmLabel="Delete entry"
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
