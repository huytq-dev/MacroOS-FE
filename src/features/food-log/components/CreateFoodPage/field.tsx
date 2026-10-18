import { cn } from '@/lib/utils'

/** Ô nhập của trang Create Food: nền thẻ, cao 56px, bo 8px (kiểu MacroFactor). */
export const FIELD_CLASS =
  'bg-secondary text-base placeholder:text-muted-foreground/70 focus-visible:ring-ring/50 h-14 w-full min-w-0 rounded-lg px-4 outline-none focus-visible:ring-1 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive disabled:opacity-50'

interface FieldLabelProps {
  readonly htmlFor?: string
  readonly children: React.ReactNode
  /** Chữ nhỏ mờ ở bên phải ("Required"). */
  readonly hint?: string
}

/** Nhãn 16px trên ô nhập, có gợi ý "Required" căn phải. */
export function FieldLabel({ htmlFor, children, hint }: FieldLabelProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-2">
      <label htmlFor={htmlFor} className="text-base">
        {children}
      </label>
      {hint && <span className="text-muted-foreground text-sm">{hint}</span>}
    </div>
  )
}

export function FieldError({
  message,
  className,
}: {
  readonly message?: string
  readonly className?: string
}) {
  if (!message) return null
  return (
    <p role="alert" className={cn('text-destructive pt-1.5 text-sm', className)}>
      {message}
    </p>
  )
}
