'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

interface NumberFieldProps {
  readonly label: string
  readonly value: number
  readonly unit: string
  readonly onChange: (value: number) => void
  readonly hint?: string
  readonly error?: string
}

/** Ô nhập số có nhãn (kcal, gram…): giữ đúng chữ đang gõ, gọi `onChange` mỗi khi gõ ra số hợp lệ; rời ô thì hiện lại số chuẩn. */
export function NumberField({ label, value, unit, onChange, hint, error }: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <div className="bg-secondary space-y-2 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-lg font-medium">
          {label}
        </label>
        <div
          className={cn(
            'bg-background focus-within:ring-ring/50 flex h-11 w-36 items-center gap-2 rounded-lg px-3 transition-shadow focus-within:ring-1',
            error && 'ring-destructive ring-1'
          )}
        >
          <input
            id={id}
            type="number"
            inputMode="decimal"
            aria-invalid={Boolean(error)}
            value={draft ?? String(Math.round(value * 10) / 10)}
            onChange={(event) => {
              setDraft(event.target.value)
              const next = Number(event.target.value)
              if (event.target.value.trim() !== '' && Number.isFinite(next)) onChange(next)
            }}
            onBlur={() => setDraft(null)}
            className="min-w-0 flex-1 bg-transparent text-right text-base tabular-nums outline-none"
          />
          <span className="text-muted-foreground text-base">{unit}</span>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-sm">{hint}</p>
      )}
    </div>
  )
}
