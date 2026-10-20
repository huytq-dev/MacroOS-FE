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
  /** `phone`: lưới 3 cột kiểu bàn phím số iOS (chữ cái dưới số, "," gửi ".", xoá ở góc phải) như bảng nhập số đo của MacroFactor. */
  readonly layout?: 'grid' | 'phone'
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const
const LETTERS: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
}
const PHONE_KEY =
  'focus-visible:ring-ring/50 flex h-13 flex-col items-center justify-center rounded-lg text-2xl leading-none tabular-nums transition-[background-color,transform] duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100'

/** Bàn phím số kiểu iOS (3 cột) cho ô số đo; giữ focus ô nhập như bản lưới. */
function PhoneKeypad({ onKey, onBackspace }: Pick<NumericKeypadProps, 'onKey' | 'onBackspace'>) {
  const keep = (event: React.PointerEvent) => event.preventDefault()
  const digit = (key: string) => (
    <button
      key={key}
      type="button"
      aria-label={key}
      onPointerDown={keep}
      onClick={() => onKey(key)}
      className={cn(PHONE_KEY, 'bg-zinc-600/60 active:bg-zinc-500')}
    >
      {key}
      {LETTERS[key] && (
        <span className="mt-0.5 text-[10px] font-medium tracking-[0.2em]">{LETTERS[key]}</span>
      )}
    </button>
  )
  return (
    <div
      role="group"
      aria-label="Number pad"
      onMouseDown={(event) => event.preventDefault()}
      className="grid grid-cols-3 gap-1.5 rounded-t-3xl bg-zinc-800 p-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {DIGITS.map(digit)}
      <button
        type="button"
        aria-label="Decimal separator"
        onPointerDown={keep}
        onClick={() => onKey('.')}
        className={cn(PHONE_KEY, 'active:bg-zinc-600/60')}
      >
        ,
      </button>
      {digit('0')}
      <button
        type="button"
        aria-label="Delete"
        onPointerDown={keep}
        onClick={onBackspace}
        className={cn(PHONE_KEY, 'active:bg-zinc-600/60')}
      >
        <Delete aria-hidden="true" className="size-7" />
      </button>
    </div>
  )
}

/**
 * Bàn phím số riêng của Food Detail trên màn cảm ứng (như MacroFactor): chữ số, dấu chấm, "/" và khoảng trắng để gõ phân số, nút xoá.
 * Giữ focus của ô nhập khi bấm (chặn pointerdown) để bàn phím và hàng chip không đóng.
 */
export function NumericKeypad({
  onKey,
  onBackspace,
  allowFraction,
  actions,
  layout = 'grid',
}: NumericKeypadProps) {
  if (layout === 'phone') return <PhoneKeypad onKey={onKey} onBackspace={onBackspace} />
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
