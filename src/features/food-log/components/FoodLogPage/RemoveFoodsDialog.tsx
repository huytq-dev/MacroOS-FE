'use client'

import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface RemoveFoodsDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly count: number
  readonly isPending: boolean
  readonly onConfirm: () => void
}

/**
 * Xác nhận "Remove Foods" của chế độ chọn nhiều món (như MacroFactor): "N food entries will be removed from the timeline…", nút
 * trắng "Remove" và "Go Back". Đang xoá thì khoá cả hai nút và không đóng được.
 */
export function RemoveFoodsDialog({
  open,
  onOpenChange,
  count,
  isPending,
  onConfirm,
}: RemoveFoodsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent showCloseButton={false} className="gap-5">
        <DialogHeader className="relative text-left">
          <DialogTitle className="font-sans text-2xl font-bold">Remove Foods</DialogTitle>
          <button
            type="button"
            aria-label="Close"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="focus-visible:ring-ring/50 absolute top-0 right-0 flex size-11 items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
          <DialogDescription className="text-foreground pt-2 text-base">
            {count} food {count === 1 ? 'entry' : 'entries'} will be removed from the timeline. Are
            you sure you want to continue? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Button
            className="bg-foreground text-background h-14 w-full rounded-lg text-base"
            disabled={isPending}
            aria-busy={isPending}
            onClick={onConfirm}
          >
            {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            Remove
          </Button>
          <Button
            variant="ghost"
            className="h-12 w-full text-base"
            disabled={isPending}
            autoFocus
            onClick={() => onOpenChange(false)}
          >
            Go Back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
