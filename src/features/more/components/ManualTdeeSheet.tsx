'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { TDEE_BOUNDS_HINT, tdeeError } from '@/features/program/utils/tdee.utils'
import { cn } from '@/lib/utils'

interface OptionCopy {
  readonly label: string
  readonly description: string
}

/** Chữ của bảng: Estimation Method (Default / Manual) và Calculation Mode (Dynamic / Static) cùng một khuôn. */
export interface DefaultOrValueCopy {
  readonly title: string
  readonly subtitle: string
  readonly first: OptionCopy
  readonly second: OptionCopy & { readonly placeholder: string; readonly inputLabel: string }
  readonly needsProgram?: string
}

interface ManualTdeeSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly copy: DefaultOrValueCopy
  /** Số kcal nhập tay đang lưu; null = đang ở lựa chọn thứ nhất (mặc định / Dynamic). */
  readonly savedKcal: number | null
  /** false: BE từ chối lưu (vd. chưa có program đang chạy, 404) nên không cho lưu; `copy.needsProgram` là dòng giải thích. */
  readonly hasProgram: boolean
  readonly onSave: (kcal: number) => Promise<unknown>
  /** Có thì lựa chọn thứ nhất bấm được (BE cho quay về mặc định); không có thì chỉ hiển thị. */
  readonly onUseDefault?: () => Promise<unknown>
}

const RADIO = 'flex size-7 shrink-0 items-center justify-center rounded-full border-2'

/**
 * Bảng hai lựa chọn "mặc định / nhập số kcal" + ô kcal + Save. Save khoá tới khi số hợp lệ (nguyên 1000–6000) và khác số đã lưu; lỗi BE hiện trong bảng và KHÔNG
 * đóng (không "đã lưu" giả); đang gửi thì khoá mọi thứ. Lựa chọn thứ nhất chỉ chọn được khi có `onUseDefault`.
 */
export function ManualTdeeSheet({
  open,
  onOpenChange,
  copy,
  savedKcal,
  hasProgram,
  onSave,
  onUseDefault,
}: ManualTdeeSheetProps) {
  const [text, setText] = useState(savedKcal === null ? '' : String(savedKcal))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const manualSaved = savedKcal !== null
  const invalid = tdeeError(text) !== undefined
  const unchanged = manualSaved && Number(text) === savedKcal
  const canSave = hasProgram && !invalid && !unchanged && !pending
  const canUseDefault = onUseDefault !== undefined && manualSaved && !pending

  const run = async (action: () => Promise<unknown>) => {
    setPending(true)
    setError(null)
    try {
      await action()
      onOpenChange(false)
    } catch (caught) {
      setError(getFormErrorMessage(caught))
    } finally {
      setPending(false)
    }
  }
  const save = () => {
    if (canSave) void run(() => onSave(Number(text)))
  }

  return (
    <SheetFrame
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setError(null)
        setText(savedKcal === null ? '' : String(savedKcal))
        onOpenChange(next)
      }}
      title={copy.title}
      subtitle={copy.subtitle}
      showDone={false}
    >
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div role="radiogroup" aria-label={copy.title}>
          <div
            role="radio"
            aria-checked={!manualSaved}
            aria-disabled={!canUseDefault || undefined}
            tabIndex={canUseDefault ? 0 : undefined}
            onClick={() => canUseDefault && void run(onUseDefault)}
            onKeyDown={(event) => {
              if (canUseDefault && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                void run(onUseDefault)
              }
            }}
            className={cn(
              'border-border flex min-h-16 items-center justify-between gap-3 border-b py-3',
              manualSaved && !canUseDefault && 'opacity-50',
              canUseDefault && 'cursor-pointer'
            )}
          >
            <span>
              <span className="block text-base">{copy.first.label}</span>
              <span className="text-muted-foreground block text-sm">{copy.first.description}</span>
            </span>
            <span
              aria-hidden="true"
              className={cn(RADIO, !manualSaved ? 'border-white bg-white' : 'border-zinc-600')}
            >
              {!manualSaved && <span className="size-2 rounded-full bg-black" />}
            </span>
          </div>
          <div
            role="radio"
            aria-checked={manualSaved}
            className="flex min-h-16 items-center justify-between gap-3 py-3"
          >
            <span>
              <span className="block text-base">{copy.second.label}</span>
              <span className="text-muted-foreground block text-sm">{copy.second.description}</span>
            </span>
            <span
              aria-hidden="true"
              className={cn(RADIO, manualSaved ? 'border-white bg-white' : 'border-zinc-600')}
            >
              {manualSaved && <span className="size-2 rounded-full bg-black" />}
            </span>
          </div>
        </div>
        <div className="bg-secondary mt-1 flex h-14 items-center gap-2 rounded-lg px-4">
          <input
            inputMode="numeric"
            aria-label={copy.second.inputLabel}
            aria-invalid={text !== '' && invalid}
            placeholder={copy.second.placeholder}
            disabled={!hasProgram || pending}
            value={text}
            onChange={(event) => setText(event.target.value.replace(/[^\d]/g, ''))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') save()
            }}
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-base outline-none disabled:opacity-60"
          />
          <span className="text-muted-foreground text-base">kcal</span>
        </div>
        {!hasProgram ? (
          <p className="text-muted-foreground mt-2 text-sm">{copy.needsProgram}</p>
        ) : (
          text !== '' &&
          invalid && <p className="text-destructive mt-2 text-sm">{TDEE_BOUNDS_HINT}</p>
        )}
        <FormErrorAlert title="Couldn't save" message={error} />
        <Button
          type="button"
          disabled={!canSave}
          aria-busy={pending}
          onClick={save}
          className="bg-foreground text-background mt-3 h-14 w-full rounded-lg text-base"
        >
          {pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          Save
        </Button>
      </div>
    </SheetFrame>
  )
}
