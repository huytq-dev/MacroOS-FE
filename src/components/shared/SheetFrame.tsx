'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SheetFrameProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly subtitle?: string
  /** Có nút "Xong" trắng bo nhẹ ở đáy; bảng chỉ có danh sách chọn một thì bỏ. */
  readonly showDone?: boolean
  /** Bấm "Xong" thì gọi hàm này (áp dụng thay đổi) rồi đóng; không có thì "Xong" chỉ đóng. Đóng bằng X/vuốt/Esc không gọi. */
  readonly onDone?: () => void
  readonly children: React.ReactNode
}

/** Khung bảng trượt từ đáy kiểu MacroFactor: nút X trái, tiêu đề + phụ đề giữa, đường kẻ, nội dung cuộn, nút "Xong" đáy. */
export function SheetFrame({
  open,
  onOpenChange,
  title,
  subtitle,
  showDone = true,
  onDone,
  children,
}: SheetFrameProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[88dvh] flex-col gap-0 p-0 sm:max-w-md"
      >
        <DialogHeader className="border-border relative space-y-0 border-b px-4 py-4 text-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="focus-visible:ring-ring/50 absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
          <DialogTitle className="font-sans text-xl font-semibold">{title}</DialogTitle>
          {subtitle ? (
            <DialogDescription className="text-muted-foreground text-base">
              {subtitle}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {showDone && (
          <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              className="bg-foreground text-background h-12 w-full rounded-lg text-lg"
              onClick={() => {
                onDone?.()
                onOpenChange(false)
              }}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
