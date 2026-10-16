'use client'

import { Pencil } from 'lucide-react'
import { IconButton } from '@/components/shared/IconButton'
import { cn } from '@/lib/utils'
import type { ChatItem } from '../../estimate-chat.utils'

interface ChatBubbleProps {
  readonly item: ChatItem
  readonly tdee: number
  readonly onEdit: () => void
}

/** Một dòng trong cuộc trò chuyện: bong bóng bot (đen), người dùng (xám) hoặc thẻ kcal có nút sửa. */
export function ChatBubble({ item, tdee, onEdit }: ChatBubbleProps) {
  if (item.kind === 'card')
    return (
      <div className="border-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-300 flex w-fit items-center gap-3 rounded-2xl border-2 px-5 py-3">
        <p className="text-2xl font-bold tabular-nums">{tdee} kcal</p>
        <IconButton
          icon={Pencil}
          label="Sửa mức tiêu hao"
          variant="secondary"
          className="size-11 rounded-full"
          onClick={onEdit}
        />
      </div>
    )
  return (
    <div
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300 flex',
        item.kind === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <p
        className={cn(
          'max-w-[85%] rounded-3xl px-4 py-3 text-base leading-snug',
          item.kind === 'user'
            ? 'bg-secondary rounded-br-md'
            : 'bg-foreground text-background rounded-bl-md'
        )}
      >
        {item.text}
      </p>
    </div>
  )
}

/** Ba chấm nhảy báo bot "đang gõ". */
export function TypingDots() {
  return (
    <div
      className="bg-foreground/90 flex w-fit gap-1 rounded-3xl rounded-bl-md px-4 py-4"
      aria-label="Đang gõ"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="bg-background size-2 rounded-full motion-safe:animate-bounce"
          style={{ animationDelay: `${dot * 120}ms` }}
        />
      ))}
    </div>
  )
}
