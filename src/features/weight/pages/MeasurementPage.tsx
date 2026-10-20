'use client'

import { useState } from 'react'
import {
  BodyMetricView,
  MEASUREMENT_TUTORIAL,
  MetricEntrySheet,
} from '../components/BodyMetricPage'
import { BODY_MEASUREMENTS, type MeasurementKey } from '../body-measurements'
import { useDeleteMeasurement, useMeasurement, useUpsertMeasurement } from '../hooks/use-weights'
import { measurementValueSchema } from '../schemas/body-metric.schema'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { usePersistedChoice } from '@/features/dashboard/hooks/use-dashboard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { useIsClient } from '@/hooks/use-is-client'
import { formatDate, todayIso } from '@/lib/date'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

interface MeasurementPageProps {
  readonly metricKey: MeasurementKey
}

/**
 * Trang một số đo vòng (Neck, Shoulders… Right Ankle) — một trang dùng chung theo khoá, cùng bố cục với Scale Weight;
 * bảng nhập một ô cm. Hướng dẫn 6 bước dùng chung (ẩn một lần là ẩn cho mọi trang số đo).
 */
export function MeasurementPage({ metricKey }: MeasurementPageProps) {
  const metric = BODY_MEASUREMENTS.find((item) => item.key === metricKey) ?? BODY_MEASUREMENTS[0]
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const history = useMeasurement(metric.key, today)
  const [tutorial, setTutorial] = usePersistedChoice(
    'body-measurement.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmDate, setConfirmDate] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const upsert = useUpsertMeasurement(metric.key)
  const remove = useDeleteMeasurement(metric.key)

  const items = history.data?.items ?? []
  const points = [...items]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({ date: item.date, value: item.valueCm }))
  const entry = items.find((item) => item.date === sheetDate)

  const openSheet = (date: string) => {
    setSaveError(null)
    setSheetDate(date)
    setSheetOpen(true)
  }

  if (history.isError)
    return <ErrorState error={history.error} onRetry={() => void history.refetch()} />

  return (
    <>
      <BodyMetricView
        title={metric.label}
        unit="cm"
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
          key={`${sheetDate}-${history.dataUpdatedAt}`}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          metric={metric.label}
          date={sheetDate ?? today}
          today={today}
          onDateChange={openSheet}
          fields={[
            {
              key: 'valueCm',
              label: metric.label,
              unit: 'cm',
              initial: entry?.valueCm ?? null,
              schema: measurementValueSchema(metric.min, metric.max),
            },
          ]}
          onDelete={entry ? () => setConfirmDate(entry.date) : undefined}
          isPending={upsert.isPending}
          error={saveError}
          onSave={(values) =>
            sheetDate &&
            values.valueCm !== null &&
            upsert.mutate(
              { date: sheetDate, valueCm: values.valueCm },
              {
                onSuccess: () => setSheetOpen(false),
                onError: (error) => setSaveError(getFormErrorMessage(error)),
              }
            )
          }
        />
      )}

      <ConfirmDialog
        open={confirmDate !== null}
        onOpenChange={(open) => !open && setConfirmDate(null)}
        title="Delete this entry?"
        description={
          confirmDate ? `Delete the ${metric.label} measurement on ${formatDate(confirmDate)}.` : ''
        }
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
