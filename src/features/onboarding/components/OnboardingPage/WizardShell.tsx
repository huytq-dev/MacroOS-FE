'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WizardShellProps {
  readonly sectionTitle: string
  /** 0–1 trong phần hiện tại; null = ẩn thanh tiến độ (giới thiệu, trang cuối). */
  readonly progress: number | null
  readonly canGoBack: boolean
  readonly onBack: () => void
  readonly stepKey: string
  readonly direction: 'forward' | 'back'
  readonly nextLabel: string
  readonly nextDisabled: boolean
  readonly isPending: boolean
  readonly pendingLabel: string
  readonly onNext: () => void
  readonly error: string | null
  /** Thay nút chính mặc định; false = ẩn hẳn (màn chat và màn điều khoản tự có thanh đáy). */
  readonly footer?: React.ReactNode | false
  readonly children: React.ReactNode
}

/**
 * Khung wizard kiểu app: tiêu đề phần + thanh tiến độ ở đầu, nội dung chuyển bước trượt theo hướng đi/lùi,
 * nút chính dính đáy (tầm ngón cái, chừa safe-area). Tôn trọng prefers-reduced-motion.
 */
export function WizardShell({
  sectionTitle,
  progress,
  canGoBack,
  onBack,
  stepKey,
  direction,
  nextLabel,
  nextDisabled,
  isPending,
  pendingLabel,
  onNext,
  error,
  footer,
  children,
}: WizardShellProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Sang bước mới thì đưa focus về nội dung để bàn phím/trình đọc màn hình đi tiếp từ đầu bước
  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true })
  }, [stepKey])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background sticky top-0 z-10 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 in-data-[keyboard=open]:top-(--kb-top)">
        <div className="relative flex h-11 items-center justify-center">
          {canGoBack && (
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className="focus-visible:ring-ring/50 active:bg-muted absolute left-0 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <ChevronLeft aria-hidden="true" className="size-6" />
            </button>
          )}
          <p className="text-base font-medium">{sectionTitle}</p>
        </div>
        {progress !== null && (
          <div
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="bg-muted h-1 overflow-hidden rounded-full"
          >
            <div
              className="bg-foreground h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </header>

      <div
        key={stepKey}
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 flex flex-1 flex-col px-4 pt-4 pb-6 outline-none',
          direction === 'forward'
            ? 'motion-safe:slide-in-from-right-6'
            : 'motion-safe:slide-in-from-left-6'
        )}
      >
        {children}
      </div>

      {(footer !== false || error) && (
        <footer className="bg-background sticky bottom-0 space-y-2 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] in-data-[keyboard=open]:bottom-(--kb-bottom)">
          {error && <FormErrorAlert title="Could not save" message={error} />}
          {footer === false
            ? null
            : (footer ?? (
                <Button
                  className="h-12 w-full rounded-full text-base"
                  disabled={nextDisabled || isPending}
                  aria-busy={isPending}
                  onClick={() => {
                    if (!isPending) onNext()
                  }}
                >
                  {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                  {isPending ? pendingLabel : nextLabel}
                </Button>
              ))}
        </footer>
      )}
    </div>
  )
}
