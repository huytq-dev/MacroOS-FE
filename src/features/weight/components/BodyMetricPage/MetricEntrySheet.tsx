'use client'

import { useState } from 'react'
import { Grid3x3, Loader2, Trash2 } from 'lucide-react'
import type { z } from 'zod'
import { SelectDateSheet } from './SelectDateSheet'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { NumericKeypad } from '@/components/shared/NumericKeypad'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { formatDate } from '@/lib/date'
import { cn, normalizeDecimal } from '@/lib/utils'

/** Tối đa 3 chữ số nguyên và 1 số lẻ; "," được đổi thành ".". */
const DECIMAL_TEXT = /^\d{0,3}(\.\d?)?$/

export interface MetricField {
  readonly key: string
  readonly label: string
  readonly unit: string
  /** Giá trị sẵn có của ngày (đang sửa); null = trống. */
  readonly initial: number | null
  readonly schema: z.ZodNumber
}

export type MetricValues = Record<string, number | null>

interface MetricEntrySheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Tên số đo dưới ngày ("Scale Weight" / "Visual Body Fat"). */
  readonly metric: string
  readonly date: string
  readonly today: string
  readonly onDateChange: (date: string) => void
  /** Ô nhập; ô đầu rộng hơn. Trang đặt `key` theo ngày + dữ liệu để điền lại khi đổi ngày. */
  readonly fields: readonly MetricField[]
  /** Nút "Reference" cạnh ô duy nhất (Visual Body Fat); giá trị chọn được trang đưa vào `initial` và đổi `key`. */
  readonly onReference?: () => void
  /** Ngày đã có bản ghi: hiện thùng rác (trang hỏi xác nhận). */
  readonly onDelete?: () => void
  readonly isPending: boolean
  readonly error: string | null
  readonly onSave: (values: MetricValues) => void
}

const toText = (value: number | null) => (value === null ? '' : String(value))

/**
 * Bảng nhập số đo của một ngày (kiểu MacroFactor): ✕, ngày ▾ mở "Select Date", tên số đo, thùng rác khi đang sửa;
 * các ô số (bàn phím số riêng trên màn cảm ứng, nhận "," và "."), nút Save phía trên bàn phím.
 */
export function MetricEntrySheet({
  open,
  onOpenChange,
  metric,
  date,
  today,
  onDateChange,
  fields,
  onReference,
  onDelete,
  isPending,
  error,
  onSave,
}: MetricEntrySheetProps) {
  const coarse = useCoarsePointer()
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, toText(field.initial)]))
  )
  const [active, setActive] = useState(fields[0]?.key ?? '')
  const [localError, setLocalError] = useState<string | null>(null)
  const [dateOpen, setDateOpen] = useState(false)

  const setField = (key: string, raw: string) => {
    const next = normalizeDecimal(raw)
    if (!DECIMAL_TEXT.test(next)) return
    setLocalError(null)
    setTexts((current) => ({ ...current, [key]: next }))
  }

  const submit = () => {
    if (isPending) return
    const values: MetricValues = {}
    for (const field of fields) {
      const text = texts[field.key] ?? ''
      if (text === '' || text === '.') {
        values[field.key] = null
        continue
      }
      const parsed = field.schema.safeParse(Number(text))
      if (!parsed.success) {
        setLocalError(parsed.error.issues[0]?.message ?? `Check ${field.label}`)
        return
      }
      values[field.key] = parsed.data
    }
    if (Object.values(values).every((value) => value === null)) {
      setLocalError(`Enter ${fields[0]?.label.toLowerCase() ?? 'a value'}`)
      return
    }
    onSave(values)
  }

  return (
    <>
      <SheetFrame
        open={open}
        onOpenChange={onOpenChange}
        title={formatDate(date)}
        onTitleClick={() => setDateOpen(true)}
        subtitle={metric}
        showDone={false}
        headerAction={
          onDelete && (
            <button
              type="button"
              aria-label={`Delete ${metric} entry`}
              onClick={onDelete}
              className="focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <Trash2 aria-hidden="true" className="size-5" />
            </button>
          )
        }
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
          className="space-y-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <FormErrorAlert title="Couldn't save" message={localError ?? error} />
          <div
            className={cn(
              'grid items-end gap-3',
              fields.length > 1 || onReference ? 'grid-cols-[3fr_2fr]' : 'grid-cols-1'
            )}
          >
            {fields.map((field, index) => (
              <label key={field.key} className="min-w-0 space-y-1.5">
                <span className="block text-base font-semibold">{field.label}</span>
                <span
                  className={cn(
                    'bg-secondary flex h-14 items-center gap-2 rounded-lg px-4 transition-shadow duration-200 motion-reduce:transition-none',
                    active === field.key && 'ring-foreground ring-2'
                  )}
                >
                  <input
                    type="text"
                    inputMode={coarse ? 'none' : 'decimal'}
                    autoComplete="off"
                    autoFocus={index === 0}
                    value={texts[field.key] ?? ''}
                    onChange={(event) => setField(field.key, event.target.value)}
                    onFocus={() => setActive(field.key)}
                    aria-label={`${field.label} (${field.unit})`}
                    className="w-0 min-w-0 flex-1 bg-transparent text-lg tabular-nums outline-none"
                  />
                  <span className="text-muted-foreground text-base">{field.unit}</span>
                </span>
              </label>
            ))}
            {onReference && (
              <button
                type="button"
                onClick={onReference}
                className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex h-14 items-center justify-center gap-2 rounded-lg px-3 text-base transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                <Grid3x3 aria-hidden="true" className="size-5" />
                Reference
              </button>
            )}
          </div>
          <Button
            type="submit"
            className="bg-foreground text-background h-12 w-full rounded-lg text-base"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            Save
          </Button>
          {coarse && (
            <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300">
              <NumericKeypad
                allowFraction={false}
                onKey={(key) => setField(active, (texts[active] ?? '') + key)}
                onBackspace={() => setField(active, (texts[active] ?? '').slice(0, -1))}
              />
            </div>
          )}
        </form>
      </SheetFrame>
      <SelectDateSheet
        key={date}
        open={dateOpen}
        onOpenChange={setDateOpen}
        value={date}
        today={today}
        onSelect={onDateChange}
      />
    </>
  )
}
