'use client'

import { Loader2 } from 'lucide-react'
import { NumericKeypad } from '@/components/shared/NumericKeypad'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PlateItem } from '../../../types/food-log.types'
import { sanitizeQuantity, switchUnit, type PlateEdit } from './plate-edit.utils'

const CHIP =
  'focus-visible:ring-ring/50 h-11 min-w-11 shrink-0 rounded-full px-4 text-base whitespace-nowrap transition-[background-color,color,transform] duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95 active:opacity-80 motion-reduce:active:scale-100'

interface PlateQuantityEditorProps {
  readonly item: PlateItem
  readonly edit: PlateEdit
  /** Lượng đang gõ hợp lệ: Done / Log Foods mới bấm được. */
  readonly valid: boolean
  readonly isLogging: boolean
  readonly onChange: (edit: PlateEdit) => void
  readonly onDone: () => void
  readonly onLog: () => void
}

/**
 * Bàn phím sửa lượng một món trong Your Plate (như MacroFactor): hàng chip đơn vị (g, oz, các khẩu phần của món) và bàn phím số
 * riêng có "/" cho phân số, hai nút Log Foods + Done nằm ở hai ô cuối. Số đang gõ hiện ngay trong ô lượng của dòng.
 */
export function PlateQuantityEditor({
  item,
  edit,
  valid,
  isLogging,
  onChange,
  onDone,
  onLog,
}: PlateQuantityEditorProps) {
  const keepFocus = (event: React.PointerEvent) => event.preventDefault()
  const servings = item.servings ?? []
  const type = (text: string) =>
    onChange({ ...edit, text: sanitizeQuantity(text, edit.unit === 'serving') })

  const chip = (selected: boolean, label: string, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={selected}
      onPointerDown={keepFocus}
      onClick={onClick}
      className={cn(CHIP, selected ? 'bg-foreground text-background font-medium' : 'bg-secondary')}
    >
      {label}
    </button>
  )

  return (
    <div className="bg-card border-border motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in-0 motion-safe:animation-duration-300 border-t px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex [scrollbar-width:none] items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {chip(edit.unit === 'g', 'g', () => onChange(switchUnit(item, edit, 'g')))}
        {chip(edit.unit === 'oz', 'oz', () => onChange(switchUnit(item, edit, 'oz')))}
        {servings.length > 0 && (
          <span aria-hidden="true" className="bg-border mx-1 h-8 w-px shrink-0" />
        )}
        {servings.map((serving) =>
          chip(edit.unit === 'serving' && edit.servingId === serving.id, serving.name, () =>
            onChange(switchUnit(item, edit, 'serving', serving.id))
          )
        )}
      </div>
      <NumericKeypad
        allowFraction={edit.unit === 'serving'}
        onKey={(key) => type(edit.text + key)}
        onBackspace={() => type(edit.text.slice(0, -1))}
        actions={
          <>
            <Button
              variant="secondary"
              className="h-12 flex-1 rounded-lg transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
              disabled={!valid || isLogging}
              aria-busy={isLogging}
              onClick={onLog}
            >
              {isLogging && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              Log Foods
            </Button>
            <Button
              className="h-12 flex-1 rounded-lg transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
              disabled={!valid || isLogging}
              onClick={onDone}
            >
              Done
            </Button>
          </>
        }
      />
    </div>
  )
}
