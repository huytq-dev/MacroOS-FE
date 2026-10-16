import { cn } from '@/lib/utils'

interface WordmarkProps {
  readonly className?: string
  /** Cỡ chữ theo px; chữ rộng nên 16px ở header, 28px ở màn auth. */
  readonly size?: number
}

/**
 * Chữ MacroOS (thay cho logo biểu tượng cũ): MACRO đậm, OS mảnh, font rộng Unbounded.
 * Chữ hoa chỉ là kiểu hiển thị; trình đọc màn hình đọc "MacroOS".
 */
export function Wordmark({ className, size = 20 }: WordmarkProps) {
  return (
    <span className={cn('text-foreground inline-flex leading-none', className)}>
      <span className="sr-only">MacroOS</span>
      <span
        aria-hidden="true"
        className="font-brand inline-flex items-baseline tracking-[0.02em] uppercase"
        style={{ fontSize: size }}
      >
        <span className="font-bold">Macro</span>
        <span className="font-light">OS</span>
      </span>
    </span>
  )
}
