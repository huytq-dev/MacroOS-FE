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
import { SelectDateSheet } from '@/features/weight/components/BodyMetricPage/SelectDateSheet'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { formatDate } from '@/lib/date'
import { cn, normalizeDecimal } from '@/lib/utils'
import { useUiStore } from '@/stores/ui.store'
import type { NutritionDay, SaveNutritionDayRequest } from '../types/nutrition-data.types'

type FieldKey = 'calories' | 'protein' | 'fat' | 'carbs'

/** Energy là số nguyên ≤ 99999; macro tối đa 4 chữ số nguyên và 1 số lẻ ("," được đổi thành "."). */
const PATTERN: Record<FieldKey, RegExp> = {
  calories: /^\d{0,5}$/,
  protein: /^\d{0,4}(\.\d?)?$/,
  fat: /^\d{0,4}(\.\d?)?$/,
  carbs: /^\d{0,4}(\.\d?)?$/,
}
const SWITCH = 'h-7! w-12! [&_[data-slot=switch-thumb]]:size-6'

const toText = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)
const toNumber = (text: string) => (text === '' || text === '.' ? null : Number(text))

interface NutritionDaySheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly date: string
  readonly today: string
  readonly onDateChange: (date: string) => void
  /** Dữ liệu đã có của ngày (đang sửa); thiếu = ngày mới, không có thùng rác. Trang đặt `key` theo ngày + dữ liệu. */
  readonly existing: NutritionDay | undefined
  readonly onDelete: () => void
  readonly isPending: boolean
  readonly error: string | null
  readonly onSave: (payload: SaveNutritionDayRequest) => void
}

/** Ô số có nhãn, đơn vị ở bên phải; ô đang nhập viền trắng (như MacroFactor). */
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
  /** Ngày đã log từ Food Log: chỉ đọc (sửa món ở Food Log). */
  readonly disabled?: boolean
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
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          aria-label={`${label} (${unit})`}
          className="w-0 min-w-0 flex-1 bg-transparent text-lg tabular-nums outline-none"
        />
        <span className="text-muted-foreground text-base">{unit}</span>
      </span>
    </label>
  )
}

/**
 * Bảng nhập dinh dưỡng một ngày của Nutrition Data Manager (như MacroFactor): ✕, ngày ▾ mở "Select Date", phụ đề "Nutrition", thùng
 * rác khi ngày đã có dữ liệu; Energy (kcal), Protein / Fat / Carbs (g), công tắc "Are you fasting?" (bật thì hiện khung xanh giải
 * thích) và "Is this day incomplete?", nút Save và bàn phím số riêng trên màn cảm ứng.
 */
export function NutritionDaySheet({
  open,
  onOpenChange,
  date,
  today,
  onDateChange,
  existing,
  onDelete,
  isPending,
  error,
  onSave,
}: NutritionDaySheetProps) {
  const coarse = useCoarsePointer()
  const openFoodLogDate = useUiStore((state) => state.openFoodLogDate)
  // Ngày có món trong Food Log (source App): BE không cho đổi kcal / macro / fasting, chỉ cờ incomplete
  const locked = existing?.source === 'App'
  const [texts, setTexts] = useState<Record<FieldKey, string>>({
    calories: toText(existing?.calories),
    protein: toText(existing?.proteinG),
    fat: toText(existing?.fatG),
    carbs: toText(existing?.carbsG),
  })
  const [fasting, setFasting] = useState(existing?.isFasting ?? false)
  const [incomplete, setIncomplete] = useState(existing?.isIncomplete ?? false)
  const [active, setActive] = useState<FieldKey>('calories')
  const [localError, setLocalError] = useState<string | null>(null)
  const [dateOpen, setDateOpen] = useState(false)

  const set = (key: FieldKey, raw: string) => {
    const next = normalizeDecimal(raw)
    if (!PATTERN[key].test(next)) return
    setLocalError(null)
    setTexts((current) => ({ ...current, [key]: next }))
  }

  const submit = () => {
    if (isPending) return
    const values = {
      calories: toNumber(texts.calories),
      proteinG: toNumber(texts.protein),
      fatG: toNumber(texts.fat),
      carbsG: toNumber(texts.carbs),
    }
    const flags = { isFasting: fasting, isIncomplete: incomplete }
    const none = { calories: null, proteinG: null, fatG: null, carbsG: null }
    if (locked) {
      onSave({ date, ...none, isFasting: false, isIncomplete: incomplete })
      return
    }
    const typed = Object.values(values).filter((value) => value !== null)

    if (fasting) {
      if (typed.some((value) => value !== 0)) {
        setLocalError(
          "A fasting day can't have calories or macros. Clear them or turn fasting off."
        )
        return
      }
      onSave({ date, ...none, ...flags })
      return
    }
    if (values.calories === null && typed.length > 0) {
      setLocalError('Enter calories to save macros')
      return
    }
    if (values.calories !== null && values.calories > 10000) {
      setLocalError('Calories are at most 10000')
      return
    }
    if ([values.proteinG, values.fatG, values.carbsG].some((value) => (value ?? 0) > 1000)) {
      setLocalError('Macros are at most 1000 g')
      return
    }
    if (typed.length === 0) {
      // Không nhập số: chỉ đổi cờ của ngày đã có dữ liệu (ngày trống thì BE từ chối)
      if (!existing) {
        setLocalError('Enter calories, or turn on fasting')
        return
      }
      onSave({ date, ...none, ...flags })
      return
    }
    // Số không đổi thì chỉ gửi cờ (khỏi tạo lại món nhập tay)
    const unchanged =
      existing &&
      values.calories === existing.calories &&
      values.proteinG === (existing.proteinG ?? null) &&
      values.fatG === (existing.fatG ?? null) &&
      values.carbsG === (existing.carbsG ?? null)
    onSave({ date, ...(unchanged ? none : values), ...flags })
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
          !locked && (
            <button
              type="button"
              aria-label="Delete this day's nutrition"
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
          {locked && (
            <div
              role="note"
              className="bg-secondary motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 flex items-center justify-between gap-3 rounded-lg px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-base font-semibold">Logged in Food Log</p>
                <p className="text-muted-foreground text-sm leading-snug">
                  Calories and macros come from your foods, so edit them there. You can still mark
                  the day incomplete.
                </p>
              </div>
              <Link
                href={routePath.foodLog}
                onClick={() => openFoodLogDate(date)}
                className="bg-background focus-visible:ring-ring/50 min-h-11 shrink-0 rounded-full px-4 text-sm leading-[2.75rem] whitespace-nowrap transition-transform duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
              >
                Open Food Log
              </Link>
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
            autoFocus={!locked}
            disabled={locked}
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
              disabled={locked}
            />
            <NumberField
              label="Fat"
              unit="g"
              value={texts.fat}
              active={active === 'fat'}
              coarse={coarse}
              onChange={(text) => set('fat', text)}
              onFocus={() => setActive('fat')}
              disabled={locked}
            />
            <NumberField
              label="Carbs"
              unit="g"
              value={texts.carbs}
              active={active === 'carbs'}
              coarse={coarse}
              onChange={(text) => set('carbs', text)}
              onFocus={() => setActive('carbs')}
              disabled={locked}
            />
          </div>

          <label className="flex min-h-12 items-center justify-between gap-3 text-base">
            Are you fasting?
            <Switch
              checked={fasting}
              onCheckedChange={setFasting}
              aria-label="Are you fasting?"
              disabled={locked}
              className={SWITCH}
            />
          </label>
          <label className="flex min-h-12 items-center justify-between gap-3 text-base">
            Is this day incomplete?
            <Switch
              checked={incomplete}
              onCheckedChange={setIncomplete}
              aria-label="Is this day incomplete?"
              className={SWITCH}
            />
          </label>

          <Button
            type="submit"
            className="bg-foreground text-background h-14 w-full rounded-lg text-base transition-transform duration-100 active:scale-[0.98] motion-reduce:active:scale-100"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            Save
          </Button>
          {coarse && !locked && (
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
