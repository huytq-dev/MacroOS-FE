'use client'

import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

const KEY =
  'focus-visible:ring-ring/50 bg-secondary active:bg-foreground/20 flex h-12 items-center justify-center rounded-lg text-xl tabular-nums transition-[background-color,transform] duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100'

interface NumericKeypadProps {
  /** Phím ký tự: chữ số, ".", và (nếu cho phân số) "/" hoặc khoảng trắng. */
  readonly onKey: (key: string) => void
  readonly onBackspace: () => void
  /** Chế độ lượng cho phép phân số ("1/2", "1 1/2"); chế độ calo/macro thì ẩn "/" và khoảng trắng. */
  readonly allowFraction: boolean
  /** Hai nút hành động (Log Foods / Add hoặc Done) nằm ở hai ô cuối hàng dưới như MacroFactor; thiếu thì để trống. */
  readonly actions?: React.ReactNode
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

/**
 * Bàn phím số riêng của Food Detail trên màn cảm ứng (như MacroFactor): chữ số, dấu chấm, "/" và khoảng trắng để gõ phân số, nút xoá.
 * Giữ focus của ô nhập khi bấm (chặn pointerdown) để bàn phím và hàng chip không đóng.
 */
export function NumericKeypad({ onKey, onBackspace, allowFraction, actions }: NumericKeypadProps) {
  const press = (key: string) => (
    <button
      key={key}
      type="button"
      aria-label={key === ' ' ? 'Space' : key}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => onKey(key)}
      className={KEY}
    >
      {key === ' ' ? '␣' : key}
    </button>
  )
  const blank = <span aria-hidden="true" />
  return (
    // onMouseDown: iOS Safari không giữ focus nhờ preventDefault ở pointerdown, chỉ chặn được ở sự kiện chuột giả lập sau lần chạm
    <div
      role="group"
      aria-label="Number pad"
      onMouseDown={(event) => event.preventDefault()}
      className="grid grid-cols-4 gap-1.5 pt-2"
    >
      {DIGITS.slice(0, 3).map(press)}
      {allowFraction ? press('/') : blank}
      {DIGITS.slice(3, 6).map(press)}
      {allowFraction ? press(' ') : blank}
      {DIGITS.slice(6).map(press)}
      <button
        type="button"
        aria-label="Delete"
        onPointerDown={(event) => event.preventDefault()}
        onClick={onBackspace}
        className={cn(KEY, 'text-muted-foreground')}
      >
        <Delete aria-hidden="true" className="size-6" />
      </button>
      {press('.')}
      {press('0')}
      {actions ? (
        // Chặn pointerdown để bấm nút không làm ô nhập mất focus (bàn phím không đóng trước khi lệnh chạy)
        <div
          className="col-span-2 flex gap-1.5 [&_button]:min-w-0 [&_button]:basis-0 [&_button]:px-1 [&_button]:text-sm"
          onPointerDown={(event) => event.preventDefault()}
        >
          {actions}
        </div>
      ) : (
        <>
          {blank}
          {blank}
        </>
      )}
    </div>
  )
}
