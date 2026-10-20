'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { NumericKeypad } from '@/components/shared/NumericKeypad'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { useFullBody, useSaveFullBody } from '@/features/shortcuts/hooks/use-body-metrics'
import { fullBodySchema } from '@/features/shortcuts/schemas/full-body.schema'
import type { TapeMeasurements } from '@/features/shortcuts/types/body-metrics.types'
import { useDeleteWeight, useUpsertWeight, useWeights } from '@/features/weight/hooks/use-weights'
import { logWeightSchema } from '@/features/weight/schemas/log-weight.schema'
import type { WeightEntry } from '@/features/weight/types/weight.types'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'

type Field = 'weight' | 'bodyFat'

/** Tối đa 3 chữ số nguyên và 1 số lẻ; dấu thập phân luôn là ".". */
const DECIMAL_TEXT = /^\d{0,3}(\.\d?)?$/
const toNumber = (text: string) => (text === '' || text === '.' ? null : Number(text))
const toText = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)

interface EntryFormProps {
  readonly date: string
  readonly entry: WeightEntry | undefined
  readonly bodyFat: number | null
  readonly tape: TapeMeasurements | null
  readonly onSaved: () => void
}

/** Form của một ngày: Weight (kg) + Body Fat (%), Save, bàn phím số riêng trên cảm ứng. Dựng lại (key) khi dữ liệu của ngày tải xong. */
function EntryForm({ date, entry, bodyFat, tape, onSaved }: EntryFormProps) {
  const coarse = useCoarsePointer()
  const upsert = useUpsertWeight()
  const saveBody = useSaveFullBody()
  const [texts, setTexts] = useState<Record<Field, string>>({
    weight: toText(entry?.weightKg),
    bodyFat: toText(bodyFat),
  })
  const [active, setActive] = useState<Field>('weight')
  const [error, setError] = useState<string | null>(null)
  const isSaving = upsert.isPending || saveBody.isPending

  const setField = (field: Field, next: string) => {
    if (!DECIMAL_TEXT.test(next)) return
    setError(null)
    setTexts((current) => ({ ...current, [field]: next }))
  }

  const submit = async () => {
    if (isSaving) return
    const weight = toNumber(texts.weight)
    const fat = toNumber(texts.bodyFat)
    if (weight === null && fat === null) {
      setError('Enter a weight or body fat')
      return
    }
    if (weight !== null) {
      const result = logWeightSchema.safeParse({ logDate: date, weightKg: weight })
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? 'Check your weight')
        return
      }
    }
    if (fat !== null) {
      const result = fullBodySchema.safeParse({ date, visualBodyFatPercent: fat, tape })
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? 'Check your body fat')
        return
      }
    }
    try {
      if (weight !== null)
        await upsert.mutateAsync({ logDate: date, weightKg: weight, notes: entry?.notes ?? null })
      // Ghi body fat kèm số đo cm sẵn có của ngày để không xoá mất
      if (fat !== null) await saveBody.mutateAsync({ date, visualBodyFatPercent: fat, tape })
      onSaved()
    } catch (caught) {
      setError(getFormErrorMessage(caught))
    }
  }

  const fieldProps = (field: Field) => ({
    type: 'text' as const,
    inputMode: coarse ? ('none' as const) : ('decimal' as const),
    autoComplete: 'off',
    value: texts[field],
    autoFocus: field === 'weight',
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setField(field, event.target.value),
    onFocus: () => setActive(field),
  })
  const box = (field: Field) =>
    cn(
      'bg-secondary flex h-14 items-center gap-2 rounded-lg px-4 transition-shadow duration-200',
      active === field && 'ring-foreground ring-2'
    )

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="space-y-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <FormErrorAlert title="Couldn't save" message={error} />
      <div className="grid grid-cols-[3fr_2fr] gap-3">
        <label className="min-w-0 space-y-1.5 text-sm">
          <span className="text-muted-foreground">Weight</span>
          <span className={box('weight')}>
            <input
              {...fieldProps('weight')}
              aria-label="Weight in kilograms"
              className="w-0 min-w-0 flex-1 bg-transparent text-right text-lg tabular-nums outline-none"
            />
            <span className="text-muted-foreground text-base">kg</span>
          </span>
        </label>
        <label className="min-w-0 space-y-1.5 text-sm">
          <span className="text-muted-foreground">Body Fat</span>
          <span className={box('bodyFat')}>
            <input
              {...fieldProps('bodyFat')}
              aria-label="Body fat percent"
              className="w-0 min-w-0 flex-1 bg-transparent text-right text-lg tabular-nums outline-none"
            />
            <span className="text-muted-foreground text-base">%</span>
          </span>
        </label>
      </div>
      <Button
        type="submit"
        className="bg-foreground text-background h-12 w-full rounded-lg text-base"
        disabled={isSaving}
        aria-busy={isSaving}
      >
        {isSaving && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Save
      </Button>
      {coarse && (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300">
          <NumericKeypad
            allowFraction={false}
            onKey={(key) => setField(active, texts[active] + key)}
            onBackspace={() => setField(active, texts[active].slice(0, -1))}
          />
        </div>
      )}
    </form>
  )
}

interface ScaleWeightSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Ngày đang nhập (yyyy-MM-dd). */
  readonly date: string
}

/**
 * Bảng nhập cân của một ngày (bấm một ngày trên lịch Habits): tiêu đề là ngày, phụ đề "Scale Weight", ô Weight (kg) + Body Fat (%),
 * Save, nút thùng rác ở góc phải chỉ khi ngày đó đã có bản ghi cân (xoá có xác nhận). Điền sẵn từ bản ghi sẵn có.
 */
export function ScaleWeightSheet({ open, onOpenChange, date }: ScaleWeightSheetProps) {
  const weights = useWeights(open ? date : null, open ? date : null)
  const body = useFullBody(date, open)
  const remove = useDeleteWeight()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const entry = weights.data?.items.find((item) => item.logDate === date)
  const loading = weights.isLoading || body.isLoading

  return (
    <>
      <SheetFrame
        open={open}
        onOpenChange={onOpenChange}
        title={formatDate(date)}
        subtitle="Scale Weight"
        showDone={false}
        headerAction={
          entry && (
            <button
              type="button"
              aria-label="Delete weigh-in"
              onClick={() => setConfirmOpen(true)}
              className="text-destructive focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <Trash2 aria-hidden="true" className="size-5" />
            </button>
          )
        }
      >
        {loading ? (
          <div className="space-y-3 p-4" aria-busy="true">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        ) : (
          <EntryForm
            key={`${date}-${weights.dataUpdatedAt}-${body.dataUpdatedAt}`}
            date={date}
            entry={entry}
            bodyFat={body.data?.visualBodyFatPercent ?? null}
            tape={body.data?.tape ?? null}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetFrame>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this weigh-in?"
        description={`Delete the weigh-in on ${formatDate(date)}. Trend weight and expenditure are recalculated from that day on.`}
        confirmLabel="Delete weigh-in"
        pendingLabel="Deleting..."
        isPending={remove.isPending}
        onConfirm={() =>
          remove.mutate(date, {
            onSuccess: () => {
              setConfirmOpen(false)
              onOpenChange(false)
            },
          })
        }
      />
    </>
  )
}
