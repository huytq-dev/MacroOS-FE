'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { FocusPreview } from './FocusPreview'
import { useFlip } from '../../hooks/use-flip'
import { FOCUS_LABEL, type FocusKey } from '../../dashboard-layout'
import { IconButton } from '@/components/shared/IconButton'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface FocusPickerProps {
  /** Thứ tự cả ba trang (kể cả trang ẩn). */
  readonly order: readonly FocusKey[]
  readonly hidden: readonly FocusKey[]
  readonly onToggle: (key: FocusKey, visible: boolean) => void
  /** Đổi chỗ với trang kế bên. */
  readonly onMove: (index: number, delta: -1 | 1) => void
}

/**
 * "Tiêu điểm chính": dải xám bao ba thẻ cuộn ngang (như MacroFactor). Mỗi thẻ có công tắc bật/tắt và hai mũi tên dời vị trí;
 * khi đổi chỗ, hai thẻ trượt sang vị trí mới (FLIP: đo vị trí cũ → mới rồi chạy transform), tắt khi người dùng bật "giảm chuyển động".
 */
export function FocusPicker({ order, hidden, onToggle, onMove }: FocusPickerProps) {
  const item = useFlip(order, 'x')

  return (
    <section
      aria-labelledby="focus-heading"
      className="min-w-0 space-y-3 pt-3 pb-5 [contain:inline-size]"
    >
      <h2 id="focus-heading" className="px-4 text-xl font-bold">
        Primary Focus
      </h2>
      <ul className="relative flex [scrollbar-width:none] gap-3 overflow-x-auto px-4 [overflow-anchor:none] [&::-webkit-scrollbar]:hidden">
        {order.map((key, index) => {
          const visible = !hidden.includes(key)
          return (
            <li key={key} ref={item(key)} className="w-48 shrink-0 space-y-1">
              <div
                className={cn(
                  'bg-background space-y-2 rounded-xl border-2 p-3 transition-[border-color,opacity] duration-200',
                  visible ? 'border-foreground' : 'border-border opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 min-h-9 text-sm leading-[1.15] font-semibold">
                    {FOCUS_LABEL[key]}
                  </h3>
                  <Switch
                    checked={visible}
                    onCheckedChange={(next) => onToggle(key, next)}
                    aria-label={`Show ${FOCUS_LABEL[key]}`}
                    className="h-6! w-10! data-[state=checked]:bg-white! data-[state=unchecked]:bg-zinc-600! [&>span]:size-5! [&>span]:bg-black! [&>span]:data-[state=checked]:translate-x-[16px]!"
                  />
                </div>
                <FocusPreview kind={key} />
              </div>
              <div className="flex justify-center gap-6">
                <IconButton
                  icon={ArrowLeft}
                  label={`Move ${FOCUS_LABEL[key]} left`}
                  className={cn('size-11', index === 0 && 'invisible')}
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                />
                <IconButton
                  icon={ArrowRight}
                  label={`Move ${FOCUS_LABEL[key]} right`}
                  className={cn('size-11', index === order.length - 1 && 'invisible')}
                  disabled={index === order.length - 1}
                  onClick={() => onMove(index, 1)}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
