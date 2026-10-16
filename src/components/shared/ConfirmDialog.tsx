'use client'

import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Câu hỏi cụ thể, ví dụ "Xoá thực phẩm?" (UI.md mục 14). */
  readonly title: string
  /** Nêu tên đối tượng và hậu quả chính xác, phần nào được giữ lại. */
  readonly description: string
  readonly confirmLabel: string
  readonly pendingLabel: string
  readonly isPending: boolean
  readonly onConfirm: () => void
}

/** Xác nhận hành động khó hoàn tác: focus mặc định vào "Huỷ", đang xử lý thì khoá cả hai nút và không đóng được. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  isPending,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-sans text-sm font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel autoFocus disabled={isPending}>
            Huỷ
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            aria-busy={isPending}
            onClick={() => {
              if (!isPending) onConfirm()
            }}
          >
            {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
