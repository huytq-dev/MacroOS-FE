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
import { cn } from '@/lib/utils'

interface SheetFrameProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly subtitle?: string
  /** Có nút "Xong" trắng bo nhẹ ở đáy; bảng chỉ có danh sách chọn một thì bỏ. */
  readonly showDone?: boolean
  /** Bấm "Xong" thì gọi hàm này (áp dụng thay đổi) rồi đóng; không có thì "Xong" chỉ đóng. Đóng bằng X/vuốt/Esc không gọi. */
  readonly onDone?: () => void
  /** Bảng cao gần hết màn hình (chỉ chừa mép trên) thay vì cao theo nội dung; dùng cho bảng có lưới dài như Choose Icon. */
  readonly tall?: boolean
  /** Nút ở góc phải tiêu đề (vd. biểu tượng thanh trượt mở Customize); chừa chỗ để tiêu đề căn giữa không bị đè. */
  readonly headerAction?: React.ReactNode
  /** Tiêu đề bấm được kèm ▾ (vd. ngày của bảng nhập số đo mở "Select Date"). */
  readonly onTitleClick?: () => void
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
  tall = false,
  headerAction,
  onTitleClick,
  children,
}: SheetFrameProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[88dvh] flex-col gap-0 p-0 sm:max-w-md',
          tall &&
            'max-sm:h-[calc(100dvh-env(safe-area-inset-top)-0.75rem)] max-sm:max-h-none sm:h-[85dvh] sm:max-h-[85dvh]'
        )}
      >
        {/* Tay nắm trên đầu bảng như MacroFactor (chỉ trên điện thoại, nơi bảng trượt từ đáy) */}
        <span
          aria-hidden="true"
          className="bg-foreground/30 mx-auto mt-2 block h-1 w-10 shrink-0 rounded-full sm:hidden"
        />
        <DialogHeader className="border-border relative space-y-0 border-b px-4 pt-2 pb-4 text-center sm:pt-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="focus-visible:ring-ring/50 absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
          {headerAction && (
            <div className="absolute top-1/2 right-2 -translate-y-1/2">{headerAction}</div>
          )}
          <DialogTitle className="font-sans text-xl font-semibold">
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                // -my-2: vùng chạm vẫn 44px nhưng phụ đề nằm sát dưới ngày như MacroFactor
                className="focus-visible:ring-ring/50 -my-2 inline-flex min-h-11 items-center gap-0.5 rounded-md px-2 focus-visible:ring-1 focus-visible:outline-none"
              >
                {title}
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
            ) : (
              title
            )}
          </DialogTitle>
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
