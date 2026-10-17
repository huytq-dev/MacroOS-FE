'use client'

import { cn } from '@/lib/utils'

export interface UnderlineTab<T extends string> {
  readonly value: T
  readonly label: string
  readonly icon: React.ReactNode
}

interface UnderlineTabsProps<T extends string> {
  readonly tabs: readonly [UnderlineTab<T>, UnderlineTab<T>]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly ariaLabel: string
}

/** Hai tab ngang bằng nhau: vạch trắng trượt (300ms) dưới tab đang chọn trên đường kẻ xám; tab đang chọn chữ đậm hơn. */
export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: UnderlineTabsProps<T>) {
  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} className="grid grid-cols-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={tab.value === value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'focus-visible:ring-ring/50 flex min-h-14 items-center justify-center gap-3 text-lg transition-colors focus-visible:ring-1 focus-visible:outline-none',
              tab.value === value ? 'text-foreground font-semibold' : 'text-muted-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-border relative h-1">
        <span
          aria-hidden="true"
          style={{ transform: `translateX(${value === tabs[1].value ? 100 : 0}%)` }}
          className="bg-foreground absolute inset-y-0 left-0 w-1/2 transition-transform duration-300 ease-out motion-reduce:transition-none"
        />
      </div>
    </div>
  )
}
