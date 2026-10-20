'use client'

import { cn } from '@/lib/utils'

interface KeypadFieldProps {
  readonly label: string
  /** "Required" / "Optional" bên phải nhãn; thiếu thì không hiện. */
  readonly hint?: string
  readonly value: string
  readonly placeholder: string
  /** Đơn vị nằm sát phải ô ("min", "g"). */
  readonly suffix?: string
  /** Đang nhập bằng bàn phím số riêng: viền trắng và con trỏ nhấp nháy. */
  readonly active: boolean
  readonly onPress: (button: HTMLElement) => void
}

/**
 * Ô số của Create Recipe nhập bằng bàn phím số riêng (như MacroFactor): trông như ô nhập nhưng là nút, bấm thì bàn phím trượt lên
 * từ đáy; không mở bàn phím hệ thống nên không bị che.
 */
export function KeypadField({
  label,
  hint,
  value,
  placeholder,
  suffix,
  active,
  onPress,
}: KeypadFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-lg">{label}</span>
        {hint && <span className="text-muted-foreground text-base">{hint}</span>}
      </div>
      <button
        type="button"
        aria-label={`${label}: ${value || 'empty'}, edit`}
        aria-pressed={active}
        onClick={(event) => onPress(event.currentTarget)}
        className={cn(
          'focus-visible:ring-ring/50 bg-secondary flex h-14 w-full items-center justify-between gap-3 rounded-lg px-4 text-left text-base transition-[box-shadow,background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-[0.99] motion-reduce:active:scale-100',
          active && 'ring-foreground ring-2'
        )}
      >
        <span className={cn('min-w-0 truncate', !value && !active && 'text-muted-foreground')}>
          {value || (active ? '' : placeholder)}
          {active && (
            <span
              aria-hidden="true"
              className="bg-foreground ml-0.5 inline-block h-5 w-0.5 translate-y-1 motion-safe:animate-pulse"
            />
          )}
        </span>
        {suffix && <span className="text-muted-foreground shrink-0">{suffix}</span>}
      </button>
    </div>
  )
}
