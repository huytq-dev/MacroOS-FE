'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { NumericKeypad } from '@/components/shared/NumericKeypad'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SelectDateSheet } from '@/features/weight/components/BodyMetricPage/SelectDateSheet'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { formatDate } from '@/lib/date'
import { cn, normalizeDecimal } from '@/lib/utils'
import { TAPE_GROUPS } from '../full-body.config'
import type { FullBodyData, FullBodyRequest, TapeMeasurements } from '../types/body-metrics.types'
import { BodyFatReferenceSheet } from './BodyFatReferenceSheet'

interface FullBodySheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly date: string
  readonly today: string
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

/** Thùng rác đặc như MacroFactor. */
function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  )
}

const text = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)
const parse = (value: string) => (value.trim() === '' || value === '.' ? null : Number(value))
/** Tối đa 3 chữ số nguyên và 1 số lẻ ("26", "26.", "26.5"); dấu thập phân luôn là ".". */
const DECIMAL_TEXT = /^\d{0,3}(\.\d?)?$/
const BODY_FAT = 'bodyFat'

/** Mỗi nhóm hiện dần, lệch nhau một nhịp khi bảng mở. */
const SECTION_IN =
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-300'

interface FormProps {
  readonly date: string
  readonly data: FullBodyData | null | undefined
  readonly isSaving: boolean
  readonly error: string | null
  readonly onSave: (payload: FullBodyRequest) => void
}

/** Form của một ngày; dựng lại (key) khi đổi ngày hoặc dữ liệu của ngày đó tải xong để ô được điền sẵn. */
function FullBodyForm({ date, data: initial, isSaving, error, onSave }: FormProps) {
  const [bodyFat, setBodyFat] = useState(text(initial?.visualBodyFatPercent))
  const [tape, setTape] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      TAPE_GROUPS.flatMap((group) =>
        group.fields.map((field) => [field.key, text(initial?.tape?.[field.key])])
      )
    )
  )
  const [referenceOpen, setReferenceOpen] = useState(false)
  // Cảm ứng: bàn phím số riêng (như Food Detail) thay cho bàn phím iOS có dấu ","; `active` là ô đang nhập
  const coarse = useCoarsePointer()
  const [active, setActive] = useState<string | null>(null)

  const valueOf = (key: string) => (key === BODY_FAT ? bodyFat : (tape[key] ?? ''))
  const setField = (key: string, raw: string) => {
    const next = normalizeDecimal(raw)
    if (!DECIMAL_TEXT.test(next)) return
    if (key === BODY_FAT) setBodyFat(next)
    else setTape((current) => ({ ...current, [key]: next }))
  }
  const keypadOpen = coarse && active !== null

  const field = (key: string, label: string, unit: string) => (
    <label className="block min-w-0 space-y-1.5">
      <span className="block text-base font-semibold">{label}</span>
      <span
        className={cn(
          'bg-secondary flex h-14 items-center gap-2 rounded-lg px-4 transition-shadow duration-200 motion-reduce:transition-none',
          active === key && 'ring-foreground ring-2'
        )}
      >
        <input
          type="text"
          inputMode={coarse ? 'none' : 'decimal'}
          autoComplete="off"
          value={valueOf(key)}
          onChange={(event) => setField(key, event.target.value)}
          onFocus={(event) => {
            setActive(key)
            // Bàn phím số trượt ra che nửa dưới: cuộn ô đang nhập vào giữa vùng nhìn thấy
            const input = event.currentTarget
            window.setTimeout(
              () => input.scrollIntoView({ block: 'center', behavior: 'smooth' }),
              220
            )
          }}
          onBlur={() => setActive((current) => (current === key ? null : current))}
          aria-label={`${label} (${unit})`}
          className="w-0 min-w-0 flex-1 bg-transparent text-right text-lg tabular-nums outline-none"
        />
        <span className="text-muted-foreground text-base">{unit}</span>
      </span>
    </label>
  )

  const submit = () => {
    const tapeValues: Partial<TapeMeasurements> = {}
    for (const group of TAPE_GROUPS)
      for (const item of group.fields) tapeValues[item.key] = parse(tape[item.key] ?? '')
    const hasTape = Object.values(tapeValues).some((value) => value !== null)
    onSave({ date, visualBodyFatPercent: parse(bodyFat), tape: hasTape ? tapeValues : null })
  }

  return (
    <>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="space-y-7 px-4 pt-5"
      >
        <FormErrorAlert title="Couldn't save metrics" message={error} />
        <section aria-labelledby="body-fat-heading" className={cn('space-y-3', SECTION_IN)}>
          <h2 id="body-fat-heading" className="text-xl font-semibold">
            Body Fat
          </h2>
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            {field(BODY_FAT, 'Visual Body Fat', '%')}
            <button
              type="button"
              onClick={() => setReferenceOpen(true)}
              className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex h-14 items-center justify-center gap-2 rounded-lg px-4 text-base transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
                <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
              </svg>
              Reference
            </button>
          </div>
        </section>

        {TAPE_GROUPS.map((group, index) => (
          <section
            key={group.title}
            aria-labelledby={`${group.title}-heading`}
            style={{ animationDelay: `${(index + 1) * 60}ms` }}
            className={cn('space-y-4', SECTION_IN)}
          >
            <h2 id={`${group.title}-heading`} className="text-xl font-semibold">
              {group.title}
            </h2>
            {group.fields.map((item) => (
              <div key={item.key}>{field(item.key, item.label, 'cm')}</div>
            ))}
          </section>
        ))}

        {/* Giữ focus ở ô đang nhập khi bấm Save / bàn phím: blur làm bàn phím thu lại, Save trượt xuống và cú bấm trượt khỏi nút */}
        <div
          onMouseDown={(event) => event.preventDefault()}
          className="bg-popover sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
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
            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
                keypadOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden" inert={!keypadOpen}>
                <div className="pt-3">
                  <NumericKeypad
                    allowFraction={false}
                    onKey={(key) => active && setField(active, valueOf(active) + key)}
                    onBackspace={() => active && setField(active, valueOf(active).slice(0, -1))}
                  />
                </div>
              </div>
            </div>
          )}
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

/**
 * Bảng nhập Full Body kiểu MacroFactor: ✕, ngày ▾ (mở Select Date, ngày tương lai tắt), "Full Body", thùng rác khi ngày đã
 * có số đo (hỏi lại trước khi xoá); Body Fat (+ Reference), Upper Body, Arms, Legs — mọi ô tuỳ chọn, ô trống = xoá số đo đó.
 */
export function FullBodySheet({
  open,
  onOpenChange,
  date,
  today,
  onDateChange,
  dataVersion,
  isLoading,
  data,
  isSaving,
  isDeleting,
  error,
  onSave,
  onDelete,
}: FullBodySheetProps) {
  const [dateOpen, setDateOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <>
      <SheetFrame
        open={open}
        onOpenChange={onOpenChange}
        title={formatDate(date)}
        onTitleClick={() => setDateOpen(true)}
        subtitle="Full Body"
        showDone={false}
        tall
        headerAction={
          data?.hasData && (
            <button
              type="button"
              aria-label="Delete this day's metrics"
              disabled={isDeleting}
              onClick={() => setConfirmOpen(true)}
              className="focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <DeleteIcon />
            </button>
          )
        }
      >
        {isLoading ? (
          <div className="space-y-4 p-4" aria-busy="true">
            <Skeleton className="h-6 w-28 rounded" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : (
          <div
            key={`${date}-${dataVersion}`}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
          >
            <FullBodyForm
              date={date}
              data={data}
              isSaving={isSaving}
              error={error}
              onSave={onSave}
            />
          </div>
        )}
      </SheetFrame>
      <SelectDateSheet
        key={date}
        open={dateOpen}
        onOpenChange={setDateOpen}
        value={date}
        today={today}
        onSelect={onDateChange}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete metrics?"
        description={`All Full Body metrics for ${formatDate(date)} will be deleted.`}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        isPending={isDeleting}
        onConfirm={() => {
          setConfirmOpen(false)
          onDelete()
        }}
      />
    </>
  )
}
