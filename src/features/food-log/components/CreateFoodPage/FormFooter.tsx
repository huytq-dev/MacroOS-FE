'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FormFooterProps {
  readonly isPending: boolean
  readonly onCreate: () => void
  readonly onCreateAndAdd: () => void
}

/** Hai nút dính đáy (trên thanh tab): "Create" xám và "Create & Add" trắng (tạo rồi ghi luôn một khẩu phần vào nhật ký hôm nay). */
export function FormFooter({ isPending, onCreate, onCreateAndAdd }: FormFooterProps) {
  return (
    <div className="bg-background sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 -mx-4 space-y-2 px-4 pt-3 pb-3 shadow-[0_-1px_0_var(--border)] in-data-[keyboard=open]:bottom-(--kb-bottom)">
      <Button
        variant="secondary"
        className="h-14 w-full rounded-lg text-base"
        disabled={isPending}
        aria-busy={isPending}
        onClick={onCreate}
      >
        {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Create
      </Button>
      <Button
        className="bg-foreground text-background h-14 w-full rounded-lg text-base"
        disabled={isPending}
        onClick={onCreateAndAdd}
      >
        Create &amp; Add
      </Button>
    </div>
  )
}
