'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { cn } from '@/lib/utils'
import type { SettingChoice } from '../expenditure-settings.config'

interface SettingChoiceSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly subtitle: string
  readonly choices: readonly SettingChoice[]
  /** Giá trị đang lưu ở BE (null = chưa có). */
  readonly value: string | null
  /** Lưu lựa chọn lên BE; ném lỗi nếu BE từ chối (khi đó KHÔNG coi là đã lưu). */
  readonly onSave: (value: string) => Promise<unknown>
}

/**
 * Bảng chọn một của More › Expenditure (bảng trượt từ đáy, radio bên phải, không có nút Lưu như MacroFactor): chọn một dòng = gửi lên BE; đang gửi thì khoá
 * và hiện vòng quay, thành công mới đóng, LỖI thì ở lại với dòng lỗi và lựa chọn cũ (đóng bằng X giữ nguyên lựa chọn đã lưu). Không có "đã lưu" giả.
 */
export function SettingChoiceSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  choices,
  value,
  onSave,
}: SettingChoiceSheetProps) {
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const choose = async (next: string) => {
    if (pending !== null) return
    if (next === value) {
      onOpenChange(false)
      return
    }
    setPending(next)
    setError(null)
    try {
      await onSave(next)
      onOpenChange(false)
    } catch (caught) {
      setError(getFormErrorMessage(caught))
    } finally {
      setPending(null)
    }
  }

  return (
    <SheetFrame
      open={open}
      onOpenChange={(next) => {
        if (pending === null) {
          setError(null)
          onOpenChange(next)
        }
      }}
      title={title}
      subtitle={subtitle}
      showDone={false}
    >
      <div role="radiogroup" aria-label={title} aria-busy={pending !== null} className="pb-6">
        {choices.map((choice, index) => {
          const selected = (pending ?? value) === choice.value
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={pending !== null}
              onClick={() => void choose(choice.value)}
              className={cn(
                'focus-visible:ring-ring/50 mx-4 flex min-h-16 w-[calc(100%-2rem)] items-center justify-between gap-3 py-3 text-left focus-visible:ring-1 focus-visible:outline-none disabled:opacity-70',
                index > 0 && 'border-border border-t'
              )}
            >
              <span>
                <span className="block text-base">{choice.label}</span>
                {choice.description && (
                  <span className="text-muted-foreground block text-sm">{choice.description}</span>
                )}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                  selected ? 'border-white bg-white' : 'border-zinc-600'
                )}
              >
                {pending === choice.value ? (
                  <Loader2 className="size-4 animate-spin text-black" />
                ) : (
                  selected && <span className="size-2 rounded-full bg-black" />
                )}
              </span>
            </button>
          )
        })}
        <div className="px-4">
          <FormErrorAlert title="Couldn't save" message={error} />
        </div>
      </div>
    </SheetFrame>
  )
}
