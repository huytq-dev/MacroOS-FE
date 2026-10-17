import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckListItem {
  readonly key: string
  readonly label: string
  readonly checked: boolean
}

interface CheckListProps {
  readonly label: string
  readonly items: readonly CheckListItem[]
  readonly onToggle: (key: string, checked: boolean) => void
}

/** Danh sách ô tick (nhiều lựa chọn độc lập): tên bên trái, ô vuông bo nhẹ bên phải (trắng có dấu ✓ khi chọn). */
export function CheckList({ label, items, onToggle }: CheckListProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl"
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="checkbox"
          aria-checked={item.checked}
          onClick={() => onToggle(item.key, !item.checked)}
          className="active:bg-muted focus-visible:ring-ring/50 flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left text-base transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          {item.label}
          <span
            aria-hidden="true"
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
              item.checked ? 'border-white bg-white text-black' : 'border-zinc-500'
            )}
          >
            {item.checked && <Check className="size-5" strokeWidth={3} />}
          </span>
        </button>
      ))}
    </div>
  )
}
