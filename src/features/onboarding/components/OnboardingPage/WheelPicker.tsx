'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const ITEM_HEIGHT = 44
const VISIBLE_ITEMS = 5

export interface WheelItem<T extends string | number> {
  readonly value: T
  readonly label: string
}

interface WheelPickerProps<T extends string | number> {
  readonly items: readonly WheelItem<T>[]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly ariaLabel: string
  readonly className?: string
}

/**
 * Bánh xe chọn kiểu iOS: cuộn dọc có scroll-snap, dòng giữa là giá trị đang chọn.
 * Chọn khi cuộn dừng (debounce 100 ms); bàn phím: mũi tên lên/xuống.
 */
export function WheelPicker<T extends string | number>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: WheelPickerProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const index = Math.max(
    0,
    items.findIndex((item) => item.value === value)
  )

  // Đưa vòng cuộn về đúng dòng khi giá trị đổi từ ngoài (đổi đơn vị, số ngày của tháng thay đổi...)
  useEffect(() => {
    const element = listRef.current
    if (element && Math.abs(element.scrollTop - index * ITEM_HEIGHT) > 1) {
      element.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'auto' })
    }
  }, [index, items.length])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const settle = () => {
    const element = listRef.current
    if (!element) return
    const nearest = Math.min(
      items.length - 1,
      Math.max(0, Math.round(element.scrollTop / ITEM_HEIGHT))
    )
    const next = items[nearest]
    if (next && next.value !== value) onChange(next.value)
  }

  const onScroll = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(settle, 100)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = items[Math.min(items.length - 1, Math.max(0, index + step))]
    if (next) onChange(next.value)
  }

  return (
    <div className={cn('relative', className)} style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
      <div
        ref={listRef}
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className="focus-visible:ring-ring/50 h-full snap-y snap-mandatory [scrollbar-width:none] overflow-y-auto overscroll-contain rounded-xl [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)] focus-visible:ring-1 focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        <div style={{ paddingBlock: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }}>
          {items.map((item, itemIndex) => (
            <div
              key={item.value}
              role="option"
              aria-selected={itemIndex === index}
              className={cn(
                'flex snap-center items-center justify-center text-xl tabular-nums transition-colors duration-150',
                itemIndex === index ? 'text-foreground font-semibold' : 'text-muted-foreground/60'
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="border-border pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-y"
        style={{ height: ITEM_HEIGHT }}
      />
    </div>
  )
}
