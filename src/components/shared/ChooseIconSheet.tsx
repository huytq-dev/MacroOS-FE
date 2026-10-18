'use client'

import { useRef, useState } from 'react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFoodIconCatalog } from '@/hooks/use-food-icon-catalog'
import { FOOD_ICON_TABS, foodIconTab } from '@/lib/food-icons'
import { cn } from '@/lib/utils'

const ALL = 'All'

interface ChooseIconSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Khoá icon đang dùng; null = icon mặc định (emoji tự suy). */
  readonly value: string | null
  /** Emoji hiện ở ô "mặc định". */
  readonly emoji?: string | null
  readonly onSelect: (iconKey: string | null) => void
}

/**
 * Bảng "Choose Icon" (kiểu MacroFactor): hàng tab nhóm cuộn ngang (All, Vegetables…), lưới 7 cột icon (ô đầu là icon mặc định),
 * icon đang chọn có khung trắng; nút trắng "Select Icon" (chỉ bật khi đã đổi) và "Cancel" dính đáy. Mount mới mỗi lần mở
 * (key ở cha) nên lựa chọn tạm luôn bắt đầu từ `value`.
 */
export function ChooseIconSheet({
  open,
  onOpenChange,
  value,
  emoji,
  onSelect,
}: ChooseIconSheetProps) {
  const [selected, setSelected] = useState<string | null>(value)
  const [category, setCategory] = useState(ALL)
  // Hướng trượt của lưới khi đổi tab: sang tab bên phải thì lưới mới vào từ phải, ngược lại từ trái; null = chưa đổi tab nên không trượt
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const top = useRef<HTMLDivElement>(null)
  const catalog = useFoodIconCatalog(open)
  const icons = catalog.data ?? []
  const categories = [ALL, ...FOOD_ICON_TABS]
  const visible = category === ALL ? icons : icons.filter((icon) => foodIconTab(icon) === category)

  const selectCategory = (name: string, tab: HTMLElement) => {
    if (name === category) return
    setDirection(categories.indexOf(name) > categories.indexOf(category) ? 'right' : 'left')
    setCategory(name)
    tab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    top.current?.parentElement?.scrollTo({ top: 0 })
  }

  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="Choose Icon" showDone={false} tall>
      <div ref={top} className="flex min-h-full flex-col">
        <div
          role="tablist"
          aria-label="Icon categories"
          className="bg-popover border-border sticky top-0 z-10 flex [scrollbar-width:none] overflow-x-auto border-b [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={category === name}
              onClick={(event) => selectCategory(name, event.currentTarget)}
              className={cn(
                'focus-visible:ring-ring/50 relative min-h-12 shrink-0 px-4 text-base whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none',
                category === name ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              {name}
              <span
                aria-hidden="true"
                className={cn(
                  'bg-foreground absolute inset-x-0 bottom-0 h-0.5 origin-center transition-transform duration-300 ease-out motion-reduce:transition-none',
                  category === name ? 'scale-x-100' : 'scale-x-0'
                )}
              />
            </button>
          ))}
        </div>

        {catalog.isPending ? (
          <div className="grid grid-cols-7 gap-1 p-3" aria-busy="true">
            {Array.from({ length: 28 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : catalog.isError ? (
          <p className="text-muted-foreground px-6 py-10 text-center text-base">
            Couldn&apos;t load the icons. Check your connection and try again.
          </p>
        ) : (
          <div className="flex-1 overflow-x-hidden">
            <ul
              key={category}
              className={cn(
                'grid grid-cols-7 gap-1 p-3',
                direction &&
                  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300',
                direction === 'right' && 'motion-safe:slide-in-from-right-full',
                direction === 'left' && 'motion-safe:slide-in-from-left-full'
              )}
            >
              {category === ALL && (
                <li>
                  <IconCell
                    label="Default icon"
                    selected={selected === null}
                    onClick={() => setSelected(null)}
                  >
                    <FoodIcon iconKey={null} emoji={emoji} size={40} />
                  </IconCell>
                </li>
              )}
              {visible.map((icon) => (
                <li key={icon.key}>
                  <IconCell
                    label={icon.name}
                    selected={selected === icon.key}
                    onClick={() => setSelected(icon.key)}
                  >
                    <FoodIcon iconKey={icon.key} size={40} />
                  </IconCell>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-popover sticky bottom-0 mt-auto space-y-1 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            className="bg-foreground text-background h-12 w-full rounded-lg text-base"
            disabled={selected === value}
            onClick={() => {
              onSelect(selected)
              onOpenChange(false)
            }}
          >
            Select Icon
          </Button>
          <Button
            variant="ghost"
            className="h-12 w-full text-base"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </SheetFrame>
  )
}

function IconCell({
  label,
  selected,
  onClick,
  children,
}: {
  readonly label: string
  readonly selected: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 flex aspect-square w-full items-center justify-center rounded-xl border-2 transition-[border-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100',
        selected ? 'border-foreground' : 'border-transparent'
      )}
    >
      {children}
    </button>
  )
}
