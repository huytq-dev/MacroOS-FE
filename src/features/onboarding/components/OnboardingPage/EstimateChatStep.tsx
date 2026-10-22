'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ChatBubble, TypingDots } from './ChatBubbles'
import { ErrorState } from '@/components/shared/ErrorState'
import { PickerSheet } from '@/components/shared/PickerSheet'
import { isClientError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  buildChatItems,
  buildChatNodes,
  pauseBefore,
  typingDuration,
  type ChatReply,
} from '../../estimate-chat.utils'
import type { TdeeEstimate } from '../../types/onboarding.types'

interface EstimateChatStepProps {
  readonly estimate: TdeeEstimate | null
  readonly isLoading: boolean
  /** TDEE người dùng tự sửa (thay cho số ước tính). */
  readonly manualTdee: number | null
  readonly onManualTdeeChange: (value: number) => void
  readonly onNext: () => void
  /** Lỗi tải ước tính (vd. 400 thiếu câu trả lời): hiện lỗi + Try again thay cho vòng quay vô tận; không bịa số. */
  readonly error?: unknown
  readonly isRetrying?: boolean
  readonly onRetry?: () => void
}

/** Màn trò chuyện giải thích TDEE (kiểu MacroFactor): bot gõ từng bong bóng, người dùng chọn câu trả lời gợi ý hoặc bỏ qua. */
export function EstimateChatStep({
  estimate,
  isLoading,
  manualTdee,
  onManualTdeeChange,
  onNext,
  error = null,
  isRetrying = false,
  onRetry,
}: EstimateChatStepProps) {
  const tdee = manualTdee ?? estimate?.tdeeKcal ?? null
  const [path, setPath] = useState<readonly string[]>(['start'])
  const [replies, setReplies] = useState<readonly string[]>([])
  const [revealed, setRevealed] = useState(0)
  const [typing, setTyping] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const nodes = useMemo(
    () => (estimate && tdee ? buildChatNodes(tdee, estimate) : null),
    [estimate, tdee]
  )
  const items = useMemo(
    () => (nodes ? buildChatItems(nodes, path, replies) : []),
    [nodes, path, replies]
  )

  // Mỗi bong bóng của bot: nghỉ một nhịp → hiện "đang gõ" → hiện chữ sau thời gian tỉ lệ độ dài câu.
  // Bong bóng của người dùng hiện ngay khi bấm.
  useEffect(() => {
    if (revealed >= items.length) return
    const item = items[revealed]
    if (item.kind === 'user') {
      const timer = setTimeout(() => setRevealed((count) => count + 1), 0)
      return () => clearTimeout(timer)
    }
    const pause = pauseBefore(items, revealed)
    const showTyping = setTimeout(() => setTyping(true), pause)
    const reveal = setTimeout(
      () => {
        setTyping(false)
        setRevealed((count) => count + 1)
      },
      pause + typingDuration(item)
    )
    return () => {
      clearTimeout(showTyping)
      clearTimeout(reveal)
    }
  }, [revealed, items])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [revealed, typing])

  if (error && !estimate)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <ErrorState error={error} variant="inline" onRetry={onRetry} isRetrying={isRetrying} />
        {isClientError(error) && (
          <p className="text-muted-foreground max-w-sm px-6 text-center text-sm">
            Some of your answers may be missing. Go back, complete them, then try again.
          </p>
        )}
      </div>
    )
  if (isLoading || !estimate || !tdee || !nodes)
    return (
      <div className="flex flex-1 items-center justify-center" aria-busy="true">
        <Loader2 aria-label="Estimating" className="text-muted-foreground size-8 animate-spin" />
      </div>
    )

  const current = nodes[path[path.length - 1]]
  const settled = revealed >= items.length
  const isEnd = settled && current.replies.length === 0

  const reply = (choice: ChatReply) => {
    setReplies((list) => [...list, choice.label])
    setPath((list) => [...list, choice.next])
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 pb-4" aria-live="polite">
        {items.slice(0, revealed).map((item, index) => (
          <ChatBubble
            key={`${item.kind}-${index}`}
            item={item}
            tdee={tdee}
            onEdit={() => {
              setDraft(String(tdee))
              setEditing(true)
            }}
          />
        ))}
        {typing && !settled && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      <div className="bg-background sticky bottom-0 -mx-4 space-y-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] in-data-[keyboard=open]:bottom-(--kb-bottom)">
        {settled && !isEnd && (
          <div className="space-y-2">
            <p className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 text-base [animation-fill-mode:backwards]">
              Choose a reply
            </p>
            <div className="flex flex-wrap gap-2">
              {current.replies.map((choice, index) => (
                <button
                  key={choice.label}
                  type="button"
                  onClick={() => reply(choice)}
                  style={{ animationDelay: `${250 + index * 120}ms` }}
                  className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300 border-border focus-visible:ring-ring/50 active:bg-muted min-h-11 rounded-xl border-2 px-4 py-2 text-left text-base transition-colors [animation-fill-mode:backwards] focus-visible:ring-1 focus-visible:outline-none"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <Button
          variant={isEnd ? 'default' : 'secondary'}
          className="h-12 w-full rounded-full text-base"
          onClick={onNext}
        >
          {isEnd ? 'Next' : 'Skip'}
        </Button>
      </div>

      <PickerSheet
        open={editing}
        onOpenChange={(open) => {
          if (!open) {
            const value = Math.round(Number(draft))
            if (value >= 1000 && value <= 6000) onManualTdeeChange(value)
          }
          setEditing(open)
        }}
        title="Edit expenditure"
        description="Enter your TDEE if you already know it (1,000 – 6,000 kcal). MacroOS will still fine-tune it using your real data."
      >
        <Input
          type="number"
          inputMode="numeric"
          min={1000}
          max={6000}
          value={draft}
          aria-label="Expenditure (kcal)"
          onChange={(event) => setDraft(event.target.value)}
          className="h-12 text-center text-xl font-semibold"
        />
      </PickerSheet>
    </div>
  )
}
