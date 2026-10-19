'use client'

import Link from 'next/link'
import { SlidersHorizontal } from 'lucide-react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { ListRow, ListSection } from '@/components/shared/ListGroup'
import { cn } from '@/lib/utils'
import { colorClass, enabledShortcuts, shortcutHref, shortcutMeta } from '../shortcuts.config'
import type { ShortcutConfig } from '../types/shortcuts.types'

interface ShortcutsSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly config: ShortcutConfig
  readonly onRun: (key: string) => void
  /** Trang Customize; là liên kết thật nên không cần callback điều hướng. */
  readonly customizeHref: string
}

const TOP_COUNT = 4

const TOP_ITEM =
  'focus-visible:ring-ring/50 group flex w-full flex-col items-center gap-2 rounded-2xl py-1 focus-visible:ring-1 focus-visible:outline-none'

/**
 * Sheet "Shortcuts" mở từ nút "+" (kiểu MacroFactor): bốn shortcut đầu là vòng tròn có nhãn (nhấn co nhẹ), các shortcut còn lại là
 * hàng có chevron, biểu tượng thanh trượt ở góc mở Customize. Chọn một shortcut chạy hành động; shortcut chỉ điều hướng (New Recipe,
 * New Food) là liên kết, sheet tự đóng khi đường dẫn đổi (ở `ShortcutHost`).
 */
export function ShortcutsSheet({
  open,
  onOpenChange,
  config,
  onRun,
  customizeHref,
}: ShortcutsSheetProps) {
  const items = enabledShortcuts(config)
  const top = items.slice(0, TOP_COUNT)
  const rest = items.slice(TOP_COUNT)
  const run = (key: string) => {
    onOpenChange(false)
    onRun(key)
  }

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Shortcuts"
      showDone={false}
      headerAction={
        <Link
          href={customizeHref}
          aria-label="Customize shortcuts"
          className="focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 items-center justify-center rounded-full transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
        >
          <SlidersHorizontal aria-hidden="true" className="size-6" />
        </Link>
      }
    >
      <div className="space-y-5 px-4 pt-5 pb-6">
        <ul className="grid grid-cols-4 gap-2" aria-label="Top shortcuts">
          {top.map((item, index) => {
            const meta = shortcutMeta(item.key)
            if (!meta) return null
            const Icon = meta.icon
            const href = shortcutHref(item.key)
            const content = (
              <>
                <span
                  className={cn(
                    'flex size-16 items-center justify-center rounded-full transition-transform duration-200 group-active:scale-90 motion-reduce:group-active:scale-100',
                    colorClass(item.color)
                  )}
                >
                  <Icon aria-hidden="true" className="size-7" />
                </span>
                <span className="text-base">{meta.label}</span>
              </>
            )
            return (
              <li
                key={item.key}
                style={{ animationDelay: `${index * 40}ms` }}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-90 motion-safe:fill-mode-both motion-safe:animation-duration-300"
              >
                {href ? (
                  <Link href={href} className={TOP_ITEM}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={() => run(item.key)} className={TOP_ITEM}>
                    {content}
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        {rest.length > 0 && (
          <ListSection>
            {rest.map((item) => {
              const meta = shortcutMeta(item.key)
              if (!meta) return null
              const Icon = meta.icon
              const href = shortcutHref(item.key)
              return (
                <ListRow
                  key={item.key}
                  label={meta.label}
                  leading={
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        colorClass(item.color)
                      )}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                  }
                  href={href}
                  onClick={href ? undefined : () => run(item.key)}
                />
              )
            })}
          </ListSection>
        )}
      </div>
    </SheetFrame>
  )
}
