'use client'

import { useState } from 'react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AmountUnit {
  readonly label: string
  /** Bao nhiêu gram một đơn vị này (g = 1); dùng để đổi qua lại giữa các đơn vị. */
  readonly gramsPerUnit: number
}

interface AmountSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly units: readonly AmountUnit[]
  /** Lượng hiện tại tính bằng gram (đổi sang đơn vị đang chọn khi hiện). */
  readonly grams: number
  /** Lưu: trả về số gram mới. */
  readonly onSave: (grams: number) => void
}

const CHIP =
  'focus-visible:ring-ring/50 h-11 shrink-0 rounded-full px-5 text-base transition-colors focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100'

const trim = (value: number) => String(Number(value.toFixed(2)))

/**
 * Bảng sửa lượng của một nguyên liệu / món AI: ô số lớn, hàng chip đơn vị (khẩu phần AI chọn, gram) và nút Save dính đáy. Đổi đơn vị
 * thì số trong ô được quy đổi để lượng thật không đổi; Save trả về gram.
 */
export function AmountSheet({ open, onOpenChange, title, units, grams, onSave }: AmountSheetProps) {
  const [unitIndex, setUnitIndex] = useState(0)
  const [text, setText] = useState(trim(grams / units[0].gramsPerUnit))
  const unit = units[unitIndex]
  const amount = Number(text)
  const valid = text.trim() !== '' && amount > 0

  const changeUnit = (index: number) => {
    // Giữ nguyên lượng thật khi đổi đơn vị
    const currentGrams = valid ? amount * unit.gramsPerUnit : grams
    setUnitIndex(index)
    setText(trim(currentGrams / units[index].gramsPerUnit))
  }

  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title={title} showDone={false}>
      <form
        noValidate
        className="flex min-h-full flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          if (!valid) return
          onSave(amount * unit.gramsPerUnit)
          onOpenChange(false)
        }}
      >
        <div className="space-y-4 p-4">
          <div className="bg-secondary focus-within:ring-foreground flex h-14 items-center gap-3 rounded-lg px-4 transition-shadow focus-within:ring-2">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              autoFocus
              aria-label="Amount"
              aria-invalid={!valid}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-2xl tabular-nums outline-none"
            />
            <span className="text-muted-foreground text-base">{unit.label}</span>
          </div>
          {units.length > 1 && (
            <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Unit">
              {units.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={index === unitIndex}
                  onClick={() => changeUnit(index)}
                  className={cn(
                    CHIP,
                    index === unitIndex
                      ? 'bg-foreground text-background font-medium'
                      : 'bg-secondary'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {valid && units.length > 1 && (
            <p className="text-muted-foreground text-sm tabular-nums">
              ≈ {Math.round(amount * unit.gramsPerUnit)} g
            </p>
          )}
        </div>
        <div className="bg-popover sticky bottom-0 mt-auto space-y-1 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={!valid}
            className="bg-foreground text-background h-12 w-full rounded-lg text-base"
          >
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full text-base"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </SheetFrame>
  )
}
