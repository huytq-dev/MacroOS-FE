'use client'

import { NumericKeypad } from '@/components/shared/NumericKeypad'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type IngredientUnit } from '../../recipe.utils'

const CHIP =
  'focus-visible:ring-ring/50 h-11 min-w-11 shrink-0 rounded-full px-4 text-base whitespace-nowrap transition-[background-color,color,transform] duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95 active:opacity-80 motion-reduce:active:scale-100'

interface IngredientEditorBarProps {
  /** Mọi đơn vị của món (g, oz | khẩu phần | tbsp… | lb). */
  readonly units: readonly IngredientUnit[]
  readonly unitId: string
  readonly text: string
  readonly valid: boolean
  /** Chuỗi lượng mới (đã lọc ký tự). */
  readonly onText: (text: string) => void
  readonly onUnit: (unit: IngredientUnit) => void
  readonly onDone: () => void
}

/** Chỉ chữ số, "." (nhận cả ","), "/" và khoảng trắng cho phân số "1 1/2"; không cho hai khoảng trắng liền nhau. */
export const sanitizeIngredientText = (raw: string) =>
  raw
    .replace(/,/g, '.')
    .replace(/[^0-9./ ]/g, '')
    .replace(/ {2,}/g, ' ')

/**
 * Thanh sửa lượng một nguyên liệu (như MacroFactor): hàng chip mọi đơn vị của món cuộn ngang (đang chọn tô trắng) và bàn phím số
 * riêng có "/" và khoảng trắng cho phân số, nút Done ở ô cuối. Giữ focus ô lượng khi chạm chip / phím (xử lý ở NumericKeypad).
 */
export function IngredientEditorBar({
  units,
  unitId,
  text,
  valid,
  onText,
  onUnit,
  onDone,
}: IngredientEditorBarProps) {
  return (
    <div
      onMouseDown={(event) => event.preventDefault()}
      className="bg-card border-border motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in-0 motion-safe:animation-duration-300 fixed inset-x-0 bottom-0 z-[60] border-t px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex [scrollbar-width:none] items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {units.map((unit) => (
          <button
            key={unit.id}
            type="button"
            aria-pressed={unit.id === unitId}
            onClick={() => onUnit(unit)}
            className={cn(
              CHIP,
              unit.id === unitId ? 'bg-foreground text-background font-medium' : 'bg-secondary'
            )}
          >
            {unit.label}
          </button>
        ))}
      </div>
      <NumericKeypad
        allowFraction
        onKey={(key) => onText(sanitizeIngredientText(text + key))}
        onBackspace={() => onText(text.slice(0, -1))}
        actions={
          <Button
            className="h-12 flex-1 rounded-lg transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
            disabled={!valid}
            onClick={onDone}
          >
            Done
          </Button>
        }
      />
    </div>
  )
}
