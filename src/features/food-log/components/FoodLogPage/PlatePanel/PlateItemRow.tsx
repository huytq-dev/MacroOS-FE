'use client'

import { Flame } from 'lucide-react'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { SwipeToDelete } from '@/components/shared/SwipeToDelete'
import { cn } from '@/lib/utils'
import type { PlateItem } from '../../../types/food-log.types'

/** Tách nhãn khẩu phần của dòng plate ("2 × large slice", "1 large slice", "123.4 g") thành số lượng và đơn vị cho ô bên phải. */
function splitLabel(item: PlateItem): { quantity: string; unit: string } {
  const serving = item.servingLabel.match(/^([\d.]+) × (.+)$/)
  if (serving) return { quantity: serving[1], unit: serving[2] }
  const grams = item.servingLabel.match(/^([\d.]+) g$/)
  if (grams) return { quantity: grams[1], unit: 'g' }
  const one = item.servingLabel.match(/^1 (.+)$/)
  if (one) return { quantity: '1', unit: one[1] }
  return { quantity: String(item.quantity), unit: item.servingLabel }
}

const oneDecimal = (value: number) => Number(value.toFixed(1))

interface PlateItemRowProps {
  readonly item: PlateItem
  readonly disabled: boolean
  /** Dòng đang được sửa lượng: ô bên phải thành ô nhập có viền hiện `editText` và `editUnit`. */
  readonly editing: boolean
  readonly editText: string
  readonly editUnit: string
  /** Bấm ô lượng để sửa; undefined = dòng không biết khối lượng nên không sửa được. */
  readonly onEdit?: (button: HTMLElement) => void
  readonly onRemove: () => void
}

/**
 * Một món trong Your Plate (kiểu MacroFactor): icon, tên, dòng "kcal P F C • gram" và ô số lượng + khẩu phần bên phải (bấm để sửa
 * bằng bàn phím số). Vuốt sang trái để xoá (`SwipeToDelete`).
 */
export function PlateItemRow({
  item,
  disabled,
  editing,
  editText,
  editUnit,
  onEdit,
  onRemove,
}: PlateItemRowProps) {
  const { quantity, unit } = splitLabel(item)
  return (
    <SwipeToDelete
      onDelete={onRemove}
      disabled={disabled || editing}
      className="flex items-center gap-3 py-3 pr-3 pl-4"
    >
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
        disabled={disabled || !onEdit}
        aria-label={`${item.name}: ${editing ? editText : quantity} ${editing ? editUnit : unit}, edit amount`}
        aria-pressed={editing}
        onClick={(event) => onEdit?.(event.currentTarget)}
        className={cn(
          'flex h-14 w-28 shrink-0 flex-col items-center justify-center rounded-lg px-2 leading-tight transition-[background-color,transform,box-shadow] duration-200 focus-visible:outline-none motion-reduce:active:scale-100',
          editing
            ? 'bg-background ring-foreground ring-2'
            : 'bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 focus-visible:ring-1 active:scale-95'
        )}
      >
        <span className="max-w-full truncate text-base tabular-nums">
          {editing ? editText || ' ' : quantity}
          {editing && (
            <span
              aria-hidden="true"
              className="bg-foreground ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 motion-safe:animate-pulse"
            />
          )}
        </span>
        <span className="text-muted-foreground w-full truncate text-center text-xs">
          {editing ? editUnit : unit}
        </span>
      </button>
    </SwipeToDelete>
  )
}
