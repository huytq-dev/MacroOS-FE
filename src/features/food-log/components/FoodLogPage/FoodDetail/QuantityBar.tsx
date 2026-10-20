'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeftRight, Flame, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { cn, normalizeDecimal } from '@/lib/utils'
import { MACRO_KEYS, type EntryMode, type MacroKey, type QuantityUnit } from './food-detail.utils'
import { NumericKeypad } from '@/components/shared/NumericKeypad'

const UNIT_LABEL: Record<Exclude<QuantityUnit, 'serving'>, string> = { g: 'g', oz: 'oz' }

const CHIP =
  'focus-visible:ring-ring/50 h-11 min-w-11 shrink-0 rounded-full px-4 text-base transition-[background-color,color,transform] duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95 active:opacity-80 motion-reduce:active:scale-100'

/** Log Foods / Add / Done: cao 48px, phản hồi chạm tức thì (thu nhỏ nhẹ ≤100ms). */
const ACTION =
  'h-12 shrink-0 rounded-lg text-base transition-[background-color,transform] duration-100 active:scale-95 motion-reduce:active:scale-100'

const FIELD =
  'bg-secondary focus-within:ring-ring/50 flex h-12 min-w-0 items-center rounded-lg transition-shadow focus-within:ring-1'

const MACRO_LABEL: Record<MacroKey, string> = {
  calories: 'Calories',
  protein: 'P',
  fat: 'F',
  carbs: 'C',
}

interface QuantityBarProps {
  readonly quantity: string
  readonly onQuantityChange: (value: string) => void
  readonly unit: QuantityUnit
  readonly onUnitChange: (unit: Exclude<QuantityUnit, 'serving'>) => void
  /** Các khẩu phần của món (chip cuộn ngang); rỗng = món chỉ nhập gram / oz. */
  readonly servings: readonly { readonly id: string; readonly name: string }[]
  readonly servingId: string
  readonly onSelectServing: (id: string) => void
  /** Tên khẩu phần đang chọn; null = món chưa có khẩu phần. */
  readonly servingName: string | null
  /** Khối lượng của lượng đang nhập (g), hiện cạnh tên khẩu phần khi ô nhập đang focus. */
  readonly grams: number
  readonly valid: boolean
  readonly isLogging: boolean
  readonly onLogFoods: () => void
  readonly onAdd: () => void
  readonly mode: EntryMode
  readonly onModeChange: (mode: EntryMode) => void
  readonly macroKey: MacroKey
  readonly onMacroKeyChange: (key: MacroKey) => void
  /** Số calo / gram macro đang gõ ở chế độ macro. */
  readonly macroText: string
  readonly onMacroTextChange: (text: string) => void
  /** Chất nào món có dữ liệu (>0 trên 100 g); chip chất thiếu bị khoá vì không suy ngược ra lượng được. */
  readonly macroAvailable: Readonly<Record<MacroKey, boolean>>
  /** add = Log Foods + Add (thêm món); edit = chỉ nút Done (sửa món đã log, `onAdd` là hàm lưu). */
  readonly variant?: 'add' | 'edit'
  /** Hiện chip g / oz; tắt cho món không rõ khối lượng (dòng Quick Add / AI) — chỉ còn chip "serving" như MacroFactor. */
  readonly showWeightUnits?: boolean
}

/**
 * Thanh đáy dính của Food Detail. Chế độ lượng: ô số lượng + tên khẩu phần (bấm mở bảng chọn), chip g / oz / các khẩu phần mở ra
 * phía trên khi ô đang focus. Chế độ macro (nút đảo ↔): hai ô, trái là calo hoặc macro muốn ăn (chip 🔥 P F C), phải là lượng suy
 * ra theo khẩu phần; gõ 200 kcal thì lượng tự tính. Chip và nút đảo giữ focus của ô nhập khi bấm.
 */
export function QuantityBar({
  quantity,
  onQuantityChange,
  unit,
  onUnitChange,
  servings,
  servingId,
  onSelectServing,
  servingName,
  grams,
  valid,
  isLogging,
  onLogFoods,
  onAdd,
  mode,
  onModeChange,
  macroKey,
  onMacroKeyChange,
  macroText,
  onMacroTextChange,
  macroAvailable,
  variant = 'add',
  showWeightUnits = true,
}: QuantityBarProps) {
  const [focused, setFocused] = useState(false)
  // Cảm ứng: dùng bàn phím số riêng (có "/" cho phân số) thay cho bàn phím hệ thống, như MacroFactor
  const coarse = useCoarsePointer()
  // Bàn phím số đang mở thì Log Foods / Add nằm trong đó, hàng nhập không lặp lại hai nút
  const keypadOpen = coarse && focused
  const amountInput = useRef<HTMLInputElement>(null)
  const pressing = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  // Chạm ra ngoài thanh nhập thì đóng chip + bàn phím (iOS không tự blur khi chạm vùng không tương tác); chạm trong thanh thì giữ nguyên
  useEffect(() => {
    if (!focused) return
    const closeOnOutside = (event: PointerEvent) => {
      if (root.current?.contains(event.target as Node)) return
      const active = document.activeElement
      if (active instanceof HTMLElement && root.current?.contains(active)) active.blur()
      setFocused(false)
    }
    document.addEventListener('pointerdown', closeOnOutside, true)
    return () => document.removeEventListener('pointerdown', closeOnOutside, true)
  }, [focused])
  /** Blur do chạm vào chip / bàn phím trong thanh này: lấy lại focus (không đóng hàng chip + bàn phím); chạm ra ngoài thì đóng. */
  const onInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (pressing.current) {
      const input = event.currentTarget
      window.setTimeout(() => input.focus(), 0)
      return
    }
    setFocused(false)
  }
  const amountSuffix = useRef<HTMLSpanElement>(null)
  const mounted = useRef(false)

  // Đổi đơn vị / khẩu phần: con số và nhãn đơn vị hiện lại bằng hiệu ứng mờ-trượt ngắn để thấy rõ số vừa đổi (bỏ qua khi giảm chuyển động)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const frames = [
      { opacity: 0, transform: 'translateY(4px)' },
      { opacity: 1, transform: 'none' },
    ]
    amountInput.current?.animate(frames, { duration: 220, easing: 'ease-out' })
    amountSuffix.current?.animate(frames, { duration: 220, easing: 'ease-out' })
  }, [unit, servingId])
  const macroInput = useRef<HTMLInputElement>(null)
  const keepFocus = (event: React.PointerEvent) => event.preventDefault()
  const suffix = unit === 'serving' ? (servingName ?? '') : UNIT_LABEL[unit]

  // Đổi chế độ thì ô nhập đổi (gỡ ô cũ, dựng ô mới) nên chuyển focus sang ô mới để bàn phím và hàng chip không đóng.
  const toggleMode = () => {
    const next: EntryMode = mode === 'amount' ? 'macro' : 'amount'
    onModeChange(next)
    requestAnimationFrame(() => {
      const target = next === 'macro' ? macroInput.current : amountInput.current
      target?.focus()
      target?.select()
    })
  }

  // Chỉ nhận chữ số, dấu chấm, và ở chế độ lượng thêm "/" và khoảng trắng (phân số "1 1/2"); không cho hai khoảng trắng liền nhau
  const sanitize = (raw: string, allowFraction: boolean) => {
    const text = normalizeDecimal(raw)
    return (allowFraction ? text.replace(/[^0-9./ ]/g, '') : text.replace(/[^0-9.]/g, '')).replace(
      / {2,}/g,
      ' '
    )
  }
  const typeKey = (key: string) =>
    mode === 'amount'
      ? onQuantityChange(sanitize(quantity + key, true))
      : onMacroTextChange(sanitize(macroText + key, false))
  const backspace = () =>
    mode === 'amount'
      ? onQuantityChange(quantity.slice(0, -1))
      : onMacroTextChange(macroText.slice(0, -1))

  // `fill`: ở chế độ macro hai nút nằm hàng riêng và chia đều chiều ngang
  const actions = (fill: boolean) =>
    variant === 'edit' ? (
      <Button
        className={cn(ACTION, 'px-6', fill && 'flex-1')}
        disabled={!valid || isLogging}
        aria-busy={isLogging}
        onClick={onAdd}
      >
        {isLogging && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Done
      </Button>
    ) : (
      <>
        <Button
          variant="secondary"
          className={cn(ACTION, 'px-4', fill && 'flex-1')}
          disabled={!valid || isLogging}
          aria-busy={isLogging}
          onClick={onLogFoods}
        >
          {isLogging && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          Log Foods
        </Button>
        <Button
          className={cn(ACTION, 'px-5', fill && 'flex-1')}
          disabled={!valid || isLogging}
          onClick={onAdd}
        >
          Add
        </Button>
      </>
    )

  return (
    <div
      ref={root}
      // iOS Safari: chạm chip / bàn phím làm ô nhập mất focus (hàng chip co lại, lần chạm rơi vào chỗ trống). Chặn ở mousedown giả lập
      // (preventDefault ở pointerdown không đủ); `pressing` đỡ thêm: blur do chạm vào thanh này thì lấy lại focus thay vì đóng.
      onMouseDown={(event) => {
        if (!(event.target instanceof HTMLInputElement)) event.preventDefault()
      }}
      onPointerDownCapture={(event) => {
        pressing.current = !(event.target instanceof HTMLInputElement)
      }}
      onPointerUp={() => window.setTimeout(() => (pressing.current = false), 300)}
      onPointerCancel={() => (pressing.current = false)}
      className="bg-card border-border shrink-0 border-t px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
          focused ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden" inert={!focused}>
          <div
            key={mode}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:animation-duration-200 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              aria-label={mode === 'amount' ? 'Enter by calories or macros' : 'Enter by amount'}
              aria-pressed={mode === 'macro'}
              onPointerDown={keepFocus}
              onClick={toggleMode}
              className={cn(CHIP, 'flex items-center bg-transparent px-2')}
            >
              <ArrowLeftRight aria-hidden="true" className="size-4 rotate-90" />
            </button>
            {mode === 'amount' ? (
              <>
                {(showWeightUnits ? (['g', 'oz'] as const) : []).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={unit === item}
                    onPointerDown={keepFocus}
                    onClick={() => onUnitChange(item)}
                    className={cn(
                      CHIP,
                      unit === item ? 'bg-foreground text-background font-medium' : 'bg-secondary'
                    )}
                  >
                    {item}
                  </button>
                ))}
                {showWeightUnits && servings.length > 0 && (
                  <span aria-hidden="true" className="bg-border mx-1 h-8 w-px shrink-0" />
                )}
                {servings.map((item) => {
                  const selected = unit === 'serving' && servingId === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onPointerDown={keepFocus}
                      onClick={() => onSelectServing(item.id)}
                      className={cn(
                        CHIP,
                        'whitespace-nowrap',
                        selected ? 'bg-foreground text-background font-medium' : 'bg-secondary'
                      )}
                    >
                      {item.name}
                    </button>
                  )
                })}
              </>
            ) : (
              MACRO_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={macroKey === key}
                  aria-label={MACRO_LABEL[key]}
                  disabled={!macroAvailable[key]}
                  onPointerDown={keepFocus}
                  onClick={() => onMacroKeyChange(key)}
                  className={cn(
                    CHIP,
                    'min-w-14 disabled:opacity-40',
                    macroKey === key ? 'bg-foreground text-background font-medium' : 'bg-secondary'
                  )}
                >
                  {key === 'calories' ? (
                    <Flame aria-hidden="true" fill="currentColor" className="mx-auto size-5" />
                  ) : (
                    MACRO_LABEL[key]
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {mode === 'amount' ? (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-200 flex items-center gap-2">
          {/* Cả ô là một nhãn: chạm đâu cũng focus ô số; đơn vị nằm bên phải, chọn đơn vị bằng chip phía trên */}
          <label
            onClick={() => amountInput.current?.focus()}
            className={cn(FIELD, 'flex-1 cursor-text gap-2 px-4')}
          >
            <input
              ref={amountInput}
              type="text"
              inputMode={coarse ? 'none' : 'decimal'}
              autoComplete="off"
              aria-label="Amount"
              aria-invalid={!valid}
              value={quantity}
              onChange={(event) => onQuantityChange(sanitize(event.target.value, true))}
              onFocus={() => setFocused(true)}
              onBlur={onInputBlur}
              className="w-16 shrink-0 bg-transparent text-base tabular-nums outline-none"
            />
            <span
              ref={amountSuffix}
              className="text-muted-foreground min-w-0 flex-1 truncate text-right text-base"
            >
              {suffix}
              {focused && unit === 'serving' && valid && (
                <span className="tabular-nums"> • {Math.round(grams)} g</span>
              )}
            </span>
          </label>
          {/* Log Foods / Add thu lại mượt (rộng + mờ 200ms) khi bàn phím mở vì hai nút đã nằm trong bàn phím; không nhảy bố cục */}
          <div
            inert={keypadOpen}
            aria-hidden={keypadOpen}
            className={cn(
              'flex shrink-0 gap-2 overflow-hidden transition-[max-width,opacity] duration-200 ease-out motion-reduce:transition-none',
              keypadOpen ? 'max-w-0 opacity-0' : 'max-w-64 opacity-100'
            )}
          >
            {actions(false)}
          </div>
        </div>
      ) : (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-200">
          <div className="flex items-center gap-2">
            <div className={cn(FIELD, 'w-32 shrink-0 pl-4')}>
              <input
                ref={macroInput}
                type="text"
                inputMode={coarse ? 'none' : 'decimal'}
                autoComplete="off"
                aria-label={`${MACRO_LABEL[macroKey]} to eat`}
                aria-invalid={!valid}
                value={macroText}
                onChange={(event) => onMacroTextChange(sanitize(event.target.value, false))}
                onFocus={() => setFocused(true)}
                onBlur={onInputBlur}
                className="min-w-0 flex-1 bg-transparent text-base tabular-nums outline-none"
              />
              <span className="text-muted-foreground flex w-9 shrink-0 items-center justify-center text-base">
                {macroKey === 'calories' ? (
                  <Flame
                    aria-hidden="true"
                    fill="currentColor"
                    className="text-foreground size-5"
                  />
                ) : (
                  'g'
                )}
              </span>
            </div>
            {/* Lượng suy ra theo macro (chỉ đọc): số bên trái, đơn vị đang chọn bên phải, như MacroFactor */}
            <div className={cn(FIELD, 'text-muted-foreground flex-1 gap-3 px-4 text-base')}>
              <span className="text-foreground tabular-nums">{quantity || '0'}</span>
              <span className="min-w-0 flex-1 truncate text-right">{suffix}</span>
            </div>
          </div>
          <div
            inert={keypadOpen}
            aria-hidden={keypadOpen}
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
              keypadOpen ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 pt-2">{actions(true)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bàn phím số riêng (cảm ứng): trượt ra khi ô nhập đang focus */}
      {coarse && (
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
            focused ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden" inert={!focused}>
            <NumericKeypad
              onKey={typeKey}
              onBackspace={backspace}
              allowFraction={mode === 'amount'}
              actions={actions(true)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
