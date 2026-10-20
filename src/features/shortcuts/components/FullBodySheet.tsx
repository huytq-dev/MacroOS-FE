'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { DateField } from '@/components/shared/DateField'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { NumericKeypad } from '@/components/shared/NumericKeypad'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { cn } from '@/lib/utils'
import type {
  FullBodyData,
  FullBodyRequest,
  TapeField,
  TapeMeasurements,
} from '../types/body-metrics.types'
import { BodyFatReferenceSheet } from './BodyFatReferenceSheet'

interface FullBodySheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly date: string
  readonly onDateChange: (date: string) => void
  readonly data: FullBodyData | null | undefined
  /** Đổi mỗi lần dữ liệu của ngày tải xong, để form dựng lại và điền sẵn. */
  readonly dataVersion: number
  readonly isLoading: boolean
  readonly isSaving: boolean
  readonly isDeleting: boolean
  readonly error: string | null
  readonly onSave: (payload: FullBodyRequest) => void
  readonly onDelete: () => void
}

const GROUPS: readonly {
  readonly title: string
  readonly fields: readonly { readonly key: TapeField; readonly label: string }[]
}[] = [
  {
    title: 'Upper Body',
    fields: [
      { key: 'neckCm', label: 'Neck' },
      { key: 'shouldersCm', label: 'Shoulders' },
      { key: 'bustCm', label: 'Bust' },
      { key: 'chestCm', label: 'Chest' },
      { key: 'waistCm', label: 'Waist' },
      { key: 'hipCm', label: 'Hips' },
    ],
  },
  {
    title: 'Arms',
    fields: [
      { key: 'leftArmCm', label: 'Left Bicep' },
      { key: 'rightArmCm', label: 'Right Bicep' },
      { key: 'leftForearmCm', label: 'Left Forearm' },
      { key: 'rightForearmCm', label: 'Right Forearm' },
      { key: 'leftWristCm', label: 'Left Wrist' },
      { key: 'rightWristCm', label: 'Right Wrist' },
    ],
  },
  {
    title: 'Legs',
    fields: [
      { key: 'leftThighCm', label: 'Left Thigh' },
      { key: 'rightThighCm', label: 'Right Thigh' },
      { key: 'leftCalfCm', label: 'Left Calf' },
      { key: 'rightCalfCm', label: 'Right Calf' },
      { key: 'leftAnkleCm', label: 'Left Ankle' },
      { key: 'rightAnkleCm', label: 'Right Ankle' },
    ],
  },
]

const text = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)
const parse = (value: string) => (value.trim() === '' || value === '.' ? null : Number(value))
/** Tối đa 3 chữ số nguyên và 1 số lẻ ("26", "26.", "26.5"); dấu thập phân luôn là ".". */
const DECIMAL_TEXT = /^\d{0,3}(\.\d?)?$/
const BODY_FAT = 'bodyFat'

type FormProps = Omit<FullBodySheetProps, 'open' | 'onOpenChange' | 'dataVersion' | 'isLoading'>

/** Form của một ngày; dựng lại (key) khi đổi ngày hoặc dữ liệu của ngày đó tải xong để ô được điền sẵn. */
function FullBodyForm({
  date,
  onDateChange,
  data: initial,
  isSaving,
  isDeleting,
  error,
  onSave,
  onDelete,
}: FormProps) {
  const [bodyFat, setBodyFat] = useState(text(initial?.visualBodyFatPercent))
  const [tape, setTape] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      GROUPS.flatMap((group) =>
        group.fields.map((field) => [field.key, text(initial?.tape?.[field.key])])
      )
    )
  )
  const [referenceOpen, setReferenceOpen] = useState(false)
  // Cảm ứng: bàn phím số riêng (như Food Detail) thay cho bàn phím iOS có dấu ","; `active` là ô đang nhập
  const coarse = useCoarsePointer()
  const [active, setActive] = useState<string | null>(null)

  const valueOf = (key: string) => (key === BODY_FAT ? bodyFat : (tape[key] ?? ''))
  const setField = (key: string, next: string) => {
    if (!DECIMAL_TEXT.test(next)) return
    if (key === BODY_FAT) setBodyFat(next)
    else setTape((current) => ({ ...current, [key]: next }))
  }
  const keypadOpen = coarse && active !== null
  const fieldProps = (key: string) => ({
    type: 'text' as const,
    inputMode: coarse ? ('none' as const) : ('decimal' as const),
    autoComplete: 'off',
    value: valueOf(key),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setField(key, event.target.value),
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      setActive(key)
      // Bàn phím số trượt ra che nửa dưới: cuộn ô đang nhập vào giữa vùng nhìn thấy
      const field = event.currentTarget
      window.setTimeout(() => field.scrollIntoView({ block: 'center', behavior: 'smooth' }), 220)
    },
    onBlur: () => setActive(null),
  })

  const submit = () => {
    const tapeValues: Partial<TapeMeasurements> = {}
    for (const group of GROUPS)
      for (const field of group.fields) tapeValues[field.key] = parse(tape[field.key] ?? '')
    const hasTape = Object.values(tapeValues).some((value) => value !== null)
    onSave({ date, visualBodyFatPercent: parse(bodyFat), tape: hasTape ? tapeValues : null })
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <DateField value={date} onValueChange={onDateChange} aria-describedby="metrics-date" />
        </div>
        {initial?.hasData && (
          <button
            type="button"
            aria-label="Delete this day's metrics"
            disabled={isDeleting}
            onClick={onDelete}
            className="text-destructive focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <Trash2 aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="space-y-6 px-4 pt-5 pb-4"
      >
        <FormErrorAlert title="Couldn't save metrics" message={error} />
        <section aria-labelledby="body-fat-heading" className="space-y-3">
          <h2 id="body-fat-heading" className="text-xl font-bold">
            Body Fat
          </h2>
          <div className="flex items-center gap-3">
            <label className="bg-secondary flex h-12 min-w-0 flex-1 items-center gap-2 rounded-lg px-4 text-base">
              <span className="text-muted-foreground shrink-0">Visual Body Fat</span>
              <input
                {...fieldProps(BODY_FAT)}
                className="min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none"
                aria-label="Visual body fat percent"
              />
              <span className="text-muted-foreground">%</span>
            </label>
            <Button
              type="button"
              variant="secondary"
              className="h-12 rounded-lg px-4 text-base"
              onClick={() => setReferenceOpen(true)}
            >
              Reference
            </Button>
          </div>
        </section>

        {GROUPS.map((group) => (
          <section
            key={group.title}
            aria-labelledby={`${group.title}-heading`}
            className="space-y-3"
          >
            <h2 id={`${group.title}-heading`} className="text-xl font-bold">
              {group.title}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {group.fields.map((field) => (
                <label key={field.key} className="space-y-1.5 text-base">
                  <span className="text-muted-foreground">{field.label}</span>
                  <span className="bg-secondary focus-within:ring-ring/50 flex h-12 items-center gap-2 rounded-lg px-3 transition-shadow focus-within:ring-1">
                    <Input
                      {...fieldProps(field.key)}
                      className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-right tabular-nums shadow-none focus-visible:ring-0"
                    />
                    <span className="text-muted-foreground text-sm">cm</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        ))}

        <div className="bg-popover sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {coarse && (
            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
                keypadOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden" inert={!keypadOpen}>
                <div className="pb-3">
                  <NumericKeypad
                    allowFraction={false}
                    onKey={(key) => active && setField(active, valueOf(active) + key)}
                    onBackspace={() => active && setField(active, valueOf(active).slice(0, -1))}
                  />
                </div>
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="bg-foreground text-background h-12 w-full rounded-lg text-base"
            disabled={isSaving}
            aria-busy={isSaving}
          >
            {isSaving && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>

      <BodyFatReferenceSheet
        open={referenceOpen}
        onOpenChange={setReferenceOpen}
        onSelect={(percent) => setBodyFat(String(percent))}
      />
    </>
  )
}

/** Shortcut Metrics: số đo cơ thể đầy đủ của một ngày (Body Fat + Reference, Upper Body, Arms, Legs, cm), mọi ô tuỳ chọn; lưu / xoá cả ngày một lần. */
export function FullBodySheet({
  open,
  onOpenChange,
  dataVersion,
  isLoading,
  ...form
}: FullBodySheetProps) {
  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="Metrics" showDone={false} tall>
      {isLoading ? (
        <div className="space-y-3 p-4" aria-busy="true">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <FullBodyForm key={`${form.date}-${dataVersion}`} {...form} />
      )}
    </SheetFrame>
  )
}
