'use client'

import Link from 'next/link'
import { ScanBarcode, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { colorClass, enabledShortcuts, shortcutHref, shortcutMeta } from '../shortcuts.config'
import type { ShortcutItem, ToolbarStyle } from '../types/shortcuts.types'

interface ShortcutToolbarContentProps {
  readonly style: ToolbarStyle
  readonly items: readonly ShortcutItem[]
  readonly onSearch: () => void
  readonly onScan: () => void
  readonly onRun: (key: string) => void
}

const CIRCLE =
  'focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100'

/**
 * Phần ruột của toolbar phía trên thanh tab, theo Toolbar Style: Search and Barcode (ô tìm + mã vạch), Search, Barcode, and Custom
 * (thêm một nút tròn = shortcut bật thứ 3), Four Custom (bốn nút tròn = bốn shortcut bật đầu), None (không có). Nút tròn mang màu
 * user chọn cho shortcut. Dùng cho toolbar thật và cho phần preview ở trang Customize.
 */
export function ShortcutToolbarContent({
  style,
  items,
  onSearch,
  onScan,
  onRun,
}: ShortcutToolbarContentProps) {
  if (style === 'None') return null
  const enabled = enabledShortcuts({ toolbarStyle: style, items: [...items], isDefault: false })
  const circle = (item: ShortcutItem) => {
    const meta = shortcutMeta(item.key)
    if (!meta) return null
    const Icon = meta.icon
    const href = shortcutHref(item.key)
    const className = cn(
      CIRCLE,
      item.color ? colorClass(item.color) : 'bg-foreground/12 active:bg-foreground/20'
    )
    const icon = <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
    return href ? (
      <Link key={item.key} href={href} aria-label={meta.label} className={className}>
        {icon}
      </Link>
    ) : (
      <button
        key={item.key}
        type="button"
        aria-label={meta.label}
        onClick={() => onRun(item.key)}
        className={className}
      >
        {icon}
      </button>
    )
  }

  if (style === 'FourCustom')
    return (
      <div className="flex w-full justify-between gap-3">{enabled.slice(0, 4).map(circle)}</div>
    )

  const third = style === 'SearchBarcodeCustom' ? enabled[2] : undefined
  return (
    <>
      <div className="bg-foreground/12 flex h-11 min-w-0 flex-1 items-center rounded-full">
        <button
          type="button"
          onClick={onSearch}
          className="text-muted-foreground focus-visible:ring-ring/50 flex h-full min-w-0 flex-1 items-center gap-3 rounded-full pl-5 text-left text-base font-normal focus-visible:ring-1 focus-visible:outline-none"
        >
          <Search
            aria-hidden="true"
            className="text-foreground/80 size-5 shrink-0"
            strokeWidth={2}
          />
          <span className="truncate">Search for a food</span>
        </button>
        <button
          type="button"
          aria-label="Scan barcode"
          onClick={onScan}
          className="focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
        >
          <ScanBarcode aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </button>
      </div>
      {third && circle(third)}
    </>
  )
}
