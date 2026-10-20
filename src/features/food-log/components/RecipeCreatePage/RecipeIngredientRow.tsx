'use client'

import { Flame } from 'lucide-react'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { SwipeToDelete } from '@/components/shared/SwipeToDelete'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface IngredientRowData {
  readonly name: string
  readonly iconKey?: string | null
  readonly emoji?: string | null
  /** null = chi tiết món chưa tải xong (hiện khung chờ, chưa sửa được lượng). */
  readonly macros: {
    readonly calories: number
    readonly protein: number
    readonly fat: number
    readonly carbs: number
    readonly grams: number | null
  } | null
  readonly text: string
  readonly unitLabel: string
}

interface RecipeIngredientRowProps {
  readonly data: IngredientRowData
  /** Đang sửa lượng: ô bên phải viền trắng có con trỏ nhấp nháy. */
  readonly editing: boolean
  readonly onEdit: (button: HTMLElement) => void
  readonly onRemove: () => void
}

const oneDecimal = (value: number) => Number(value.toFixed(1))

/**
 * Một nguyên liệu của công thức (như MacroFactor): icon, tên, "kcal P F C • gram" và ô lượng + đơn vị bên phải (bấm để sửa bằng bàn phím
 * số riêng). Vuốt sang trái để xoá nguyên liệu.
 */
export function RecipeIngredientRow({ data, editing, onEdit, onRemove }: RecipeIngredientRowProps) {
  const { macros } = data
  return (
    <SwipeToDelete
      onDelete={onRemove}
      disabled={editing}
      className="flex items-center gap-3 py-3 pr-3 pl-4"
    >
      <FoodIcon iconKey={data.iconKey} emoji={data.emoji ?? null} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base leading-snug font-medium">{data.name}</p>
        {macros ? (
          <p className="text-muted-foreground flex items-center gap-x-1.5 text-[13px] whitespace-nowrap tabular-nums">
            <span className="inline-flex items-center">
              {Math.round(macros.calories)}
              <Flame aria-hidden="true" fill="currentColor" className="size-3.5" />
            </span>
            <span>{Math.round(macros.protein)}P</span>
            <span>{Math.round(macros.fat)}F</span>
            <span>{Math.round(macros.carbs)}C</span>
            {macros.grams !== null && (
              <span className="truncate">• {oneDecimal(macros.grams)} g</span>
            )}
          </p>
        ) : (
          <Skeleton className="mt-1 h-3.5 w-3/4" aria-busy="true" />
        )}
      </div>
      <button
        type="button"
        disabled={!macros}
        aria-label={`${data.name}: ${data.text || '0'} ${data.unitLabel}, edit amount`}
        aria-pressed={editing}
        onClick={(event) => onEdit(event.currentTarget)}
        className={cn(
          'flex h-14 w-24 shrink-0 flex-col items-center justify-center rounded-lg px-2 leading-tight transition-[background-color,transform,box-shadow] duration-200 focus-visible:outline-none disabled:opacity-60 motion-reduce:active:scale-100',
          editing
            ? 'bg-background ring-foreground ring-2'
            : 'bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 focus-visible:ring-1 active:scale-95'
        )}
      >
        <span className="max-w-full truncate text-base tabular-nums">
          {data.text || ' '}
          {editing && (
            <span
              aria-hidden="true"
              className="bg-foreground ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 motion-safe:animate-pulse"
            />
          )}
        </span>
        <span className="text-muted-foreground w-full truncate text-center text-xs">
          {data.unitLabel}
        </span>
      </button>
    </SwipeToDelete>
  )
}
