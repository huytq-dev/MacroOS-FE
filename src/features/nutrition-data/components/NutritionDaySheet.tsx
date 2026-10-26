'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Coffee, Loader2, Trash2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { NumericKeypad } from '@/components/shared/NumericKeypad'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { routePath } from '@/config/route-path'
import { useUnits } from '@/features/users/hooks/use-units'
import { SelectDateSheet } from '@/features/weight/components/BodyMetricPage/SelectDateSheet'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { formatDate } from '@/lib/date'
import { cn, normalizeDecimal } from '@/lib/utils'
import { useUiStore } from '@/stores/ui.store'
import {
  buildSavePayload,
  eligibilityNotice,
  FIELD_PATTERN,
  initialTexts,
  overrideNotice,
  SOURCE_LABEL,
  type FieldKey,
  type FieldTexts,
} from '../nutrition-data.utils'
import type { NutritionDay, SaveNutritionDayRequest } from '../types/nutrition-data.types'

const SWITCH = 'h-7! w-12! [&_[data-slot=switch-thumb]]:size-6'

interface NutritionDaySheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly date: string
  readonly today: string
  readonly onDateChange: (date: string) => void
  /** Dữ liệu đã có của ngày (đang sửa); thiếu = ngày mới. Trang đặt `key` theo ngày + trạng thái tải của ngày đó. */
  readonly existing: NutritionDay | undefined
  /** Đang hỏi riêng ngày này (ngày cũ hơn các trang đã tải): chưa biết ngày đã có số nhập tay hay chưa nên chưa cho sửa / lưu. */
  readonly loadingExisting: boolean
  /** Delete Nutrition Data (số nhập tay + cờ nhịn ăn). */
  readonly onDelete: () => void
  /** Remove Manual Override (chỉ số nhập tay). */
  readonly onRemoveOverride: () => void
  readonly isPending: boolean
  readonly error: string | null
  readonly onSave: (payload: SaveNutritionDayRequest) => void
}

/** Ô số có nhãn, đơn vị ở bên phải; ô đang nhập viền trắng (như MacroFactor). Ô macro trống hiện "—" (chưa có dữ liệu, không phải 0). */
function NumberField({
  label,
  unit,
  value,
  active,
  coarse,
  onChange,
  onFocus,
  tall = false,
  autoFocus = false,
  disabled = false,
  unknownHint,
}: {
  readonly label: string
  readonly unit: string
  readonly value: string
  readonly active: boolean
  readonly coarse: boolean
  readonly onChange: (text: string) => void
  readonly onFocus: () => void
  readonly tall?: boolean
  readonly autoFocus?: boolean
  readonly disabled?: boolean
  /** Có = ô trống được đọc là "chưa có dữ liệu" (macro): trình đọc màn hình nghe câu này thay vì một ô trống. */
  readonly unknownHint?: string
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="block text-base font-semibold">{label}</span>
      <span
        className={cn(
          'bg-secondary flex items-center gap-2 rounded-lg px-4 transition-shadow duration-200 motion-reduce:transition-none',
          tall ? 'h-14' : 'h-12',
          active && !disabled && 'ring-foreground ring-2',
          disabled && 'opacity-60'
        )}
      >
        <input
          type="text"
          inputMode={coarse ? 'none' : 'decimal'}
          autoComplete="off"
          autoFocus={autoFocus}
          readOnly={disabled}
          aria-disabled={disabled || undefined}
          value={value}
          placeholder="—"
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          aria-label={`${label} (${unit})${value === '' && unknownHint ? `, ${unknownHint}` : ''}`}
          className="placeholder:text-muted-foreground w-0 min-w-0 flex-1 bg-transparent text-lg tabular-nums outline-none"
        />
        <span className="text-muted-foreground text-base">{unit}</span>
      </span>
    </label>
  )
}

/**
 * Bảng nhập dinh dưỡng một ngày của Nutrition Data Manager (như MacroFactor): ✕, ngày ▾ mở "Select Date", phụ đề "Nutrition", thùng rác khi ngày có số nhập tay hoặc
 * nhịn ăn; Energy (kcal), Protein / Fat / Carbs (g) — số user ĐÃ NHẬP, ô trống = chưa nhập (không phải 0), cho nhập chỉ macro hoặc chỉ calories, kể cả ngày đã có món
 * (override không đụng món) —, công tắc "Are you fasting?" và "Is this day incomplete?", Save, "Remove manual entry", bàn phím số riêng trên màn cảm ứng. Số hiệu lực, nguồn và
 * điều kiện thuật toán là của BE, hiện đúng như BE trả.
 */
export function NutritionDaySheet({
  open,
  onOpenChange,
  date,
  today,
  onDateChange,
  existing,
  loadingExisting,
  onDelete,
  onRemoveOverride,
  isPending,
  error,
  onSave,
}: NutritionDaySheetProps) {
  const coarse = useCoarsePointer()
  const { energy } = useUnits()
  const openFoodLogDate = useUiStore((state) => state.openFoodLogDate)
  const [texts, setTexts] = useState<FieldTexts>(() => initialTexts(existing))
  const [fasting, setFasting] = useState(existing?.isFasting ?? false)
  const [incomplete, setIncomplete] = useState(existing?.isIncomplete ?? false)
  const [active, setActive] = useState<FieldKey>('calories')
  const [localError, setLocalError] = useState<string | null>(null)
  const [dateOpen, setDateOpen] = useState(false)

  const hasFoods = (existing?.entryCount ?? 0) > 0
  // Bật nhịn ăn cần ngày KHÔNG có món (BE trả 409 nếu không): công tắc khoá, không để user bấm rồi mới nhận lỗi
  const fastingBlocked = hasFoods && !existing?.isFasting
  const notice = existing ? overrideNotice(existing) : null
  const eligibility = existing ? eligibilityNotice(existing) : null

  const set = (key: FieldKey, raw: string) => {
    const next = normalizeDecimal(raw)
    if (!FIELD_PATTERN[key].test(next)) return
    setLocalError(null)
    setTexts((current) => ({ ...current, [key]: next }))
  }

  const submit = () => {
    if (isPending || loadingExisting) return
    const outcome = buildSavePayload({ date, texts, fasting, incomplete, existing })
    if (!outcome.ok) {
      setLocalError(outcome.error)
      return
    }
    onSave(outcome.payload)
  }

  return (
    <>
      <SheetFrame
        open={open}
        onOpenChange={onOpenChange}
        title={formatDate(date)}
        subtitle="Nutrition"
        onTitleClick={() => setDateOpen(true)}
        showDone={false}
        headerAction={
          existing &&
          (existing.hasOverride || existing.isFasting) && (
            <button
              type="button"
              aria-label="Delete this day's nutrition data"
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
          aria-busy={loadingExisting || undefined}
        >
          <FormErrorAlert title="Couldn't save" message={localError ?? error} />
          {existing && (hasFoods || notice || eligibility) && (
            <div
              role="note"
              className="bg-secondary motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 space-y-2 rounded-lg px-4 py-3"
            >
              {notice && <p className="text-sm leading-snug">{notice}</p>}
              {hasFoods && existing.hasOverride && (
                <dl className="text-muted-foreground grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-sm tabular-nums">
                  <dt>Effective calories</dt>
                  <dd className="text-foreground text-right">
                    {existing.calories === null ? '—' : energy.text(existing.calories)}
                  </dd>
                  <dt>Food Log total</dt>
                  <dd className="text-foreground text-right">
                    {energy.text(existing.foodLogCalories)}
                  </dd>
                  <dt>Data source</dt>
                  <dd className="text-foreground text-right">{SOURCE_LABEL[existing.source]}</dd>
                </dl>
              )}
              {hasFoods && !existing.hasOverride && (
                <p className="text-muted-foreground text-sm leading-snug tabular-nums">
                  Food Log total: {energy.text(existing.foodLogCalories)}. Entering values here
                  replaces it for this day; your foods are kept.
                </p>
              )}
              {eligibility && (
                <p className="text-muted-foreground text-sm leading-snug">{eligibility}</p>
              )}
              {hasFoods && (
                <Link
                  href={routePath.foodLog}
                  onClick={() => openFoodLogDate(date)}
                  className="bg-background focus-visible:ring-ring/50 inline-flex min-h-11 items-center rounded-full px-4 text-sm whitespace-nowrap transition-transform duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
                >
                  Open Food Log
                </Link>
              )}
            </div>
          )}

          <div
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
              fasting ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className="min-h-0 overflow-hidden" inert={!fasting}>
              <div className="bg-mf-tile-calories/25 flex items-center gap-4 rounded-lg px-4 py-4">
                <span className="border-mf-tile-calories/70 flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed">
                  <Coffee aria-hidden="true" className="size-5" />
                </span>
                <p className="text-sm leading-snug">
                  If you leave the energy field blank or set it to zero on a fasting day, it will
                  count as a zero calorie day for your expenditure. Fasting days do not break your
                  streak.
                </p>
              </div>
            </div>
          </div>

          <NumberField
            label="Energy"
            unit="kcal"
            value={texts.calories}
            active={active === 'calories'}
            coarse={coarse}
            onChange={(text) => set('calories', text)}
            onFocus={() => setActive('calories')}
            tall
            autoFocus
            disabled={loadingExisting}
          />
          <div className="grid grid-cols-3 gap-3">
            <NumberField
              label="Protein"
              unit="g"
              value={texts.protein}
              active={active === 'protein'}
              coarse={coarse}
              onChange={(text) => set('protein', text)}
              onFocus={() => setActive('protein')}
              disabled={loadingExisting}
              unknownHint="no macro data"
            />
            <NumberField
              label="Fat"
              unit="g"
              value={texts.fat}
              active={active === 'fat'}
              coarse={coarse}
              onChange={(text) => set('fat', text)}
              onFocus={() => setActive('fat')}
              disabled={loadingExisting}
              unknownHint="no macro data"
            />
            <NumberField
              label="Carbs"
              unit="g"
              value={texts.carbs}
              active={active === 'carbs'}
              coarse={coarse}
              onChange={(text) => set('carbs', text)}
              onFocus={() => setActive('carbs')}
              disabled={loadingExisting}
              unknownHint="no macro data"
            />
          </div>

          <label className="flex min-h-12 items-center justify-between gap-3 text-base">
            <span className="min-w-0">
              Are you fasting?
              {fastingBlocked && (
                <span className="text-muted-foreground block text-sm leading-snug">
                  Not available while foods are logged on this day.
                </span>
              )}
            </span>
            <Switch
              checked={fasting}
              onCheckedChange={(next) => {
                setLocalError(null)
                setFasting(next)
              }}
              aria-label="Are you fasting?"
              disabled={loadingExisting || fastingBlocked}
              className={SWITCH}
            />
          </label>
          <label className="flex min-h-12 items-center justify-between gap-3 text-base">
            Is this day incomplete?
            <Switch
              checked={incomplete}
              onCheckedChange={setIncomplete}
              aria-label="Is this day incomplete?"
              disabled={loadingExisting}
              className={SWITCH}
            />
          </label>

          <Button
            type="submit"
            className="bg-foreground text-background h-14 w-full rounded-lg text-base transition-transform duration-100 active:scale-[0.98] motion-reduce:active:scale-100"
            disabled={isPending || loadingExisting}
            aria-busy={isPending || loadingExisting}
          >
            {(isPending || loadingExisting) && (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            )}
            Save
          </Button>
          {existing?.hasOverride && (
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full rounded-lg text-base"
              disabled={isPending}
              onClick={onRemoveOverride}
            >
              Remove manual entry
            </Button>
          )}
          {coarse && (
            <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300">
              <NumericKeypad
                allowFraction={false}
                onKey={(key) => set(active, texts[active] + key)}
                onBackspace={() => set(active, texts[active].slice(0, -1))}
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
