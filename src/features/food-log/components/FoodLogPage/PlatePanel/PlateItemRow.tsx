'use client'

import { Flame, Trash2 } from 'lucide-react'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { cn } from '@/lib/utils'
import type { PlateItem } from '../../../types/food-log.types'

/** Tách nhãn khẩu phần của dòng plate ("2 × large slice", "1 large slice", "123.4 g") thành số lượng và đơn vị cho ô bên phải. */
function splitLabel(item: PlateItem): { quantity: string; unit: string } {
  const serving = item.servingLabel.match(/^([\d.]+) × (.+)$/)
  if (serving) return { quantity: serving[1], unit: serving[2] }
  const grams = item.servingLabel.match(/^([\d.]+) g$/)
  if (grams) return { quantity: grams[1], unit: 'g' }
  return { quantity: String(item.quantity), unit: item.servingLabel }
}

const oneDecimal = (value: number) => Number(value.toFixed(1))

interface PlateItemRowProps {
  readonly item: PlateItem
  /** Hàng đang mở phần thao tác (Remove). */
  readonly expanded: boolean
  readonly disabled: boolean
  readonly onToggle: () => void
  readonly onRemove: () => void
}

/**
 * Một món trong Your Plate (kiểu MacroFactor): emoji, tên, dòng "kcal P F C • gram" và ô số lượng + khẩu phần bên phải. Bấm ô
 * số lượng mở thêm hàng Remove (trượt xuống 300ms).
 */
export function PlateItemRow({ item, expanded, disabled, onToggle, onRemove }: PlateItemRowProps) {
  const { quantity, unit } = splitLabel(item)
  return (
    <div className="bg-card overflow-hidden rounded-xl">
      <div className="flex items-center gap-3 py-3 pr-3 pl-4">
        <FoodIcon iconKey={item.iconKey} emoji={item.emoji} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base leading-snug font-medium">{item.name}</p>
          <p className="text-muted-foreground flex items-center gap-x-2 text-[13px] whitespace-nowrap tabular-nums">
            <span className="inline-flex items-center">
              {Math.round(item.calories)}
              <Flame aria-hidden="true" fill="currentColor" className="size-3.5" />
            </span>
            <span>{Math.round(item.protein)}P</span>
            <span>{Math.round(item.fat)}F</span>
            <span>{Math.round(item.carbs)}C</span>
            {item.grams !== undefined && (
              <span className="truncate">• {oneDecimal(item.grams)} g</span>
            )}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={`${item.name}: ${quantity} ${unit}, show actions`}
          onClick={onToggle}
          className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex h-14 w-28 shrink-0 flex-col items-center justify-center rounded-lg px-2 leading-tight transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
        >
          <span className="text-base tabular-nums">{quantity}</span>
          <span className="text-muted-foreground w-full truncate text-center text-xs">{unit}</span>
        </button>
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden" inert={!expanded}>
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="text-destructive focus-visible:ring-ring/50 active:bg-foreground/10 border-border flex h-12 w-full items-center justify-center gap-2 border-t text-base transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Remove from plate
          </button>
        </div>
      </div>
    </div>
  )
}
