import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface FormFieldControl {
  readonly id: string
  readonly 'aria-invalid': boolean
  readonly 'aria-describedby': string | undefined
}

interface FormFieldProps {
  readonly label: string
  /** Dòng gợi ý nằm ngay dưới nhãn (UI.md mục 2). */
  readonly hint?: string
  readonly error?: string
  readonly required?: boolean
  /** Bộ đếm "n/max" hiện trong dòng gợi ý khi trường có giới hạn ký tự. */
  readonly counter?: { readonly current: number; readonly max: number }
  readonly className?: string
  readonly children: (control: FormFieldControl) => React.ReactNode
}

/** Nhãn, gợi ý, ô nhập, lỗi — đúng thứ tự UI.md mục 2; truyền `control` vào ô nhập để nối id, aria-invalid, aria-describedby. */
export function FormField({ label, hint, error, required, counter, className, children }: FormFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint || counter ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </Label>
        {(hint || counter) && (
          <p id={hintId} className="text-muted-foreground text-[11px]">
            {hint}
            {counter && (
              <span className="tabular-nums">
                {hint ? ' · ' : ''}
                {counter.current}/{counter.max}
              </span>
            )}
          </p>
        )}
      </div>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-[11px]">
          {error}
        </p>
      )}
    </div>
  )
}
