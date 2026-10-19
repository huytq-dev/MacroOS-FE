'use client'

import { Brush, Equal } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { colorClass, shortcutMeta } from '../shortcuts.config'
import type { ShortcutItem } from '../types/shortcuts.types'

interface SortableShortcutRowProps {
  readonly item: ShortcutItem
  /** Bốn dòng đầu ghi "Top Shortcut" (đã tính theo vị trí đang kéo). */
  readonly top: boolean
  /** Order: tay cầm "=" để kéo; Color: nút cọ mở Choose Color. */
  readonly mode: 'order' | 'color'
  readonly onChooseColor: () => void
}

/**
 * Một hàng shortcut của trang Customize. Order: kéo bằng tay cầm "=" bên phải (chuột / chạm giữ ngắn / bàn phím: Space rồi mũi tên);
 * hàng đang kéo nổi lên, các hàng khác dịch chỗ mượt (tắt khi người dùng giảm chuyển động). Color: nút cọ.
 */
export function SortableShortcutRow({ item, top, mode, onChooseColor }: SortableShortcutRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key, disabled: mode !== 'order' })
  const meta = shortcutMeta(item.key)
  if (!meta) return null
  const Icon = meta.icon

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'bg-card flex min-h-16 items-center gap-3 px-4 py-2 motion-reduce:transition-none!',
        isDragging && 'relative z-10 shadow-lg'
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
          colorClass(item.color)
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base">{meta.label}</span>
        {top && <span className="text-muted-foreground block text-sm">Top Shortcut</span>}
      </span>
      {mode === 'order' ? (
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={`Reorder ${meta.label}`}
          {...attributes}
          {...listeners}
          className="text-muted-foreground focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 cursor-grab touch-none items-center justify-center rounded-full transition-colors select-none focus-visible:ring-1 focus-visible:outline-none active:cursor-grabbing"
        >
          <Equal aria-hidden="true" className="size-6" />
        </button>
      ) : (
        <button
          type="button"
          aria-label={`Choose color for ${meta.label}`}
          onClick={onChooseColor}
          className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          <Brush aria-hidden="true" className="size-5" />
        </button>
      )}
    </li>
  )
}
