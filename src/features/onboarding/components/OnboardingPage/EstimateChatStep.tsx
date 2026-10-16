'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ChatBubble, TypingDots } from './ChatBubbles'
import { PickerSheet } from '@/components/shared/PickerSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildChatItems, buildChatNodes, type ChatReply } from '../../estimate-chat.utils'
import type { TdeeEstimate } from '../../types/onboarding.types'

const TYPING_MS = 550

interface EstimateChatStepProps {
  readonly estimate: TdeeEstimate | null
  readonly isLoading: boolean
  /** TDEE người dùng tự sửa (thay cho số ước tính). */
  readonly manualTdee: number | null
  readonly onManualTdeeChange: (value: number) => void
  readonly onNext: () => void
}

/** Màn trò chuyện giải thích TDEE (kiểu MacroFactor): bot gõ từng bong bóng, người dùng chọn câu trả lời gợi ý hoặc bỏ qua. */
export function EstimateChatStep({
  estimate,
  isLoading,
  manualTdee,
  onManualTdeeChange,
  onNext,
}: EstimateChatStepProps) {
  const tdee = manualTdee ?? estimate?.tdeeKcal ?? null
  const [path, setPath] = useState<readonly string[]>(['start'])
  const [replies, setReplies] = useState<readonly string[]>([])
  const [revealed, setRevealed] = useState(0)
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

  // Mỗi lượt tiết lộ một bong bóng sau thời gian "đang gõ"; bong bóng của người dùng hiện ngay
  useEffect(() => {
    if (revealed >= items.length) return
    const delay = items[revealed].kind === 'user' ? 0 : TYPING_MS
    const timer = setTimeout(() => setRevealed((current) => current + 1), delay)
    return () => clearTimeout(timer)
  }, [revealed, items])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [revealed])

  if (isLoading || !estimate || !tdee || !nodes)
    return (
      <div className="flex flex-1 items-center justify-center" aria-busy="true">
        <Loader2 aria-label="Đang ước tính" className="text-muted-foreground size-8 animate-spin" />
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
        {!settled && items[revealed]?.kind !== 'user' && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      <div className="bg-background sticky bottom-0 -mx-4 space-y-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {settled && !isEnd && (
          <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-200 space-y-2">
            <p className="text-base">Chọn câu trả lời</p>
            <div className="flex flex-wrap gap-2">
              {current.replies.map((choice) => (
                <button
                  key={choice.label}
                  type="button"
                  onClick={() => reply(choice)}
                  className="border-border focus-visible:ring-ring/50 active:bg-muted min-h-11 rounded-xl border-2 px-4 py-2 text-left text-base transition-colors focus-visible:ring-1 focus-visible:outline-none"
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
          {isEnd ? 'Tiếp theo' : 'Bỏ qua'}
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
        title="Chỉnh mức tiêu hao"
        description="Nhập TDEE bạn đã biết (1.000 – 6.000 kcal). MacroOS vẫn tinh chỉnh theo dữ liệu thật."
      >
        <Input
          type="number"
          inputMode="numeric"
          min={1000}
          max={6000}
          value={draft}
          aria-label="Mức tiêu hao (kcal)"
          onChange={(event) => setDraft(event.target.value)}
          className="h-12 text-center text-xl font-semibold"
        />
      </PickerSheet>
    </div>
  )
}
