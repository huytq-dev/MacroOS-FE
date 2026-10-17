import { Switch } from '@/components/ui/switch'

interface ToggleListItem {
  readonly key: string
  readonly label: string
  readonly checked: boolean
}

interface ToggleListProps {
  readonly label: string
  readonly items: readonly ToggleListItem[]
  readonly onToggle: (key: string, checked: boolean) => void
}

/** Danh sách công tắc bật/tắt (UI.md mục 26: trắng khi bật, xám khi tắt, núm đen, 56×32) trong một thẻ ngăn bằng đường kẻ mảnh. */
export function ToggleList({ label, items, onToggle }: ToggleListProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl"
    >
      {items.map((item) => (
        <div key={item.key} className="flex min-h-16 items-center justify-between gap-4 px-4 py-3">
          <span className="text-base">{item.label}</span>
          <Switch
            checked={item.checked}
            onCheckedChange={(next) => onToggle(item.key, next)}
            aria-label={item.label}
            className="h-8! w-14! data-[state=checked]:bg-white! data-[state=unchecked]:bg-zinc-600! [&>span]:size-7! [&>span]:bg-black! [&>span]:data-[state=checked]:translate-x-[26px]!"
          />
        </div>
      ))}
    </div>
  )
}
