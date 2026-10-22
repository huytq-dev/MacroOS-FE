'use client'

import { useState } from 'react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AmountUnit {
  readonly label: string
  /** Bao nhiêu gram một đơn vị này (g = 1); dùng để đổi qua lại giữa các đơn vị. */
  readonly gramsPerUnit: number
  /** Id khẩu phần của món khi đơn vị này là một khẩu phần thật (small/medium/large…); không có cho gram và "plate". */
  readonly servingId?: string
}

interface AmountSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  /** Danh sách có thể đổi sau khi mở (chip khẩu phần tải muộn): đơn vị đang chọn được giữ theo nhãn, không theo vị trí. */
  readonly units: readonly AmountUnit[]
  /** Đơn vị hiện lúc mở; không có thì đơn vị đầu danh sách. */
  readonly initialUnitLabel?: string
  /** Lượng hiện tại tính bằng gram (đổi sang đơn vị đang chọn khi hiện). */
  readonly grams: number
  /** Lưu: trả về số gram mới cùng đơn vị và số lượng user đang chọn (vd. 2 × medium). */
  readonly onSave: (grams: number, choice: { unit: AmountUnit; amount: number }) => void
}

const CHIP =
  'focus-visible:ring-ring/50 h-11 shrink-0 rounded-full px-5 text-base transition-colors focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100'

const trim = (value: number) => String(Number(value.toFixed(2)))

/**
 * Bảng sửa lượng của một nguyên liệu / món AI: ô số lớn, hàng chip đơn vị (khẩu phần AI chọn, gram) và nút Save dính đáy. Đổi đơn vị
 * thì số trong ô được quy đổi để lượng thật không đổi; Save trả về gram.
 */
export function AmountSheet({
  open,
  onOpenChange,
  title,
  units,
  initialUnitLabel,
  grams,
  onSave,
}: AmountSheetProps) {
  const initial = units.find((item) => item.label === initialUnitLabel) ?? units[0]
  const [unitLabel, setUnitLabel] = useState(initial.label)
  const [text, setText] = useState(trim(grams / initial.gramsPerUnit))
  // Chọn theo nhãn: chip khẩu phần tải muộn làm danh sách đổi thứ tự cũng không lệch lựa chọn
  const unit = units.find((item) => item.label === unitLabel) ?? units[0]
  const amount = Number(text)
  // Cùng khoảng BE chấp nhận cho một lượng (InclusiveBetween 0.01–10000): 0.004 g hay 50000 g không lưu được nên chặn ngay ở đây
  const valid =
    text.trim() !== '' &&
    Number.isFinite(amount) &&
    amount * unit.gramsPerUnit >= 0.01 &&
    amount >= 0.01 &&
    amount <= 10000

  const changeUnit = (next: AmountUnit) => {
    setUnitLabel(next.label)
    // Đổi giữa hai khẩu phần thật (3 large → 3 medium) giữ nguyên số lượng, gram và macro đổi theo cỡ như MacroFactor;
    // đổi từ/sang gram hay plate thì giữ nguyên lượng thật và quy đổi con số
    if (unit.servingId && next.servingId) return
    const currentGrams = valid ? amount * unit.gramsPerUnit : grams
    setText(trim(currentGrams / next.gramsPerUnit))
  }

  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title={title} showDone={false}>
      <form
        noValidate
        className="flex min-h-full flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          if (!valid) return
          onSave(amount * unit.gramsPerUnit, { unit, amount })
          onOpenChange(false)
        }}
      >
        <div className="space-y-4 p-4">
          <div className="bg-secondary focus-within:ring-ring/50 flex h-14 items-center gap-3 rounded-lg px-4 transition-shadow focus-within:ring-1">
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
              {units.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={item.label === unit.label}
                  onClick={() => changeUnit(item)}
                  className={cn(
                    CHIP,
                    item.label === unit.label
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
