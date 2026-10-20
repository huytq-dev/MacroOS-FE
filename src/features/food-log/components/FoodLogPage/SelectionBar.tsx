'use client'

import { ChevronLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SelectionMode } from '../../hooks/use-timeline-selection'

/** Đích của Copy / Move (thanh con). */
export type SelectionTarget = 'now' | 'today' | 'tomorrow' | 'dates' | 'datetime'

export type SelectionAction = 'view' | 'remove' | 'timestamp' | 'recipe'

const CHIP =
  'bg-secondary focus-visible:ring-ring/50 h-12 shrink-0 rounded-full px-5 text-base whitespace-nowrap transition-[background-color,transform,opacity] duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95 active:bg-foreground/20 disabled:pointer-events-none disabled:opacity-40 motion-reduce:active:scale-100'

const TITLE: Record<SelectionMode, string> = {
  select: 'Select',
  copy: 'Copy',
  move: 'Move',
  paste: 'Paste',
}

interface SelectionBarProps {
  readonly mode: SelectionMode
  /** Số món đang chọn ("3 Foods"). */
  readonly count: number
  /** ✕ ở thanh chính: thoát chế độ chọn. */
  readonly onExit: () => void
  /** ‹ ở thanh con: về thanh chính (Paste về Copy). */
  readonly onBack: () => void
  readonly onMode: (mode: SelectionMode) => void
  readonly onAction: (action: SelectionAction) => void
  readonly onCopyTo: (target: SelectionTarget) => void
  readonly onMoveTo: (target: Exclude<SelectionTarget, 'now' | 'dates'>) => void
}

/**
 * Thanh chọn nhiều món (như MacroFactor), thay thanh tìm món ở đáy Food Log: trái là ✕ (hoặc ‹ ở thanh con) kèm "Select / N Foods",
 * phải là hàng chip cuộn ngang. Chuyển thanh chính ↔ thanh con thì hàng chip trượt vào 200ms; chip khoá khi chưa chọn món nào.
 */
export function SelectionBar({
  mode,
  count,
  onExit,
  onBack,
  onMode,
  onAction,
  onCopyTo,
  onMoveTo,
}: SelectionBarProps) {
  const sub = mode !== 'select'
  const none = count === 0
  const chip = (label: string, onClick: () => void) => (
    <button key={label} type="button" disabled={none} onClick={onClick} className={CHIP}>
      {label}
    </button>
  )

  return (
    <div
      role="toolbar"
      aria-label="Selected foods"
      className="bg-card border-border motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in-0 motion-safe:animation-duration-300 fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 flex items-center border-t py-2.5 pl-4 in-data-[keyboard=open]:hidden md:hidden"
    >
      <button
        type="button"
        aria-label={sub ? 'Back' : 'Exit selection'}
        onClick={sub ? onBack : onExit}
        className="focus-visible:ring-ring/50 flex min-h-12 shrink-0 items-center gap-3 rounded-lg pr-3 focus-visible:ring-1 focus-visible:outline-none"
      >
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-full transition-colors duration-200',
            sub ? 'bg-transparent' : 'bg-foreground text-background'
          )}
        >
          {sub ? (
            <ChevronLeft aria-hidden="true" className="size-6" />
          ) : (
            <X aria-hidden="true" className="size-5" />
          )}
        </span>
        <span className="text-left leading-tight">
          <span className="block text-base">{TITLE[mode]}</span>
          <span className="text-muted-foreground block text-sm tabular-nums" aria-live="polite">
            {count} {count === 1 ? 'Food' : 'Foods'}
          </span>
        </span>
      </button>
      <span aria-hidden="true" className="bg-border h-10 w-px shrink-0" />
      <div
        key={mode}
        className="motion-safe:animate-in motion-safe:slide-in-from-right-6 motion-safe:fade-in-0 motion-safe:animation-duration-200 flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-2 overflow-x-auto pr-4 pl-3 [&::-webkit-scrollbar]:hidden"
      >
        {mode === 'select' && (
          <>
            {chip('View', () => onAction('view'))}
            {chip('Copy', () => onMode('copy'))}
            {chip('Move', () => onMode('move'))}
            {chip('Remove', () => onAction('remove'))}
            {chip('Modify Timestamp', () => onAction('timestamp'))}
            {chip('Create Recipe', () => onAction('recipe'))}
          </>
        )}
        {mode === 'copy' && (
          <>
            {chip('To Now', () => onCopyTo('now'))}
            {chip('To Today', () => onCopyTo('today'))}
            {chip('To Tomorrow', () => onCopyTo('tomorrow'))}
            {chip('To Dates', () => onCopyTo('dates'))}
            {chip('To Date & Time', () => onCopyTo('datetime'))}
            {chip('Multi-Paste Inline', () => onMode('paste'))}
          </>
        )}
        {mode === 'move' && (
          <>
            {chip('To Today', () => onMoveTo('today'))}
            {chip('To Tomorrow', () => onMoveTo('tomorrow'))}
            {chip('To Date & Time', () => onMoveTo('datetime'))}
          </>
        )}
        {mode === 'paste' && (
          <p className="text-muted-foreground text-sm">
            Tap a paste button on any hour to paste the selected foods there.
          </p>
        )}
      </div>
    </div>
  )
}
