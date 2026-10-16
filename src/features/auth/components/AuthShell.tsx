import { Flame } from 'lucide-react'

interface AuthShellProps {
  readonly title: string
  readonly description?: string
  readonly children: React.ReactNode
  readonly footer?: React.ReactNode
}

/**
 * Khung chung cho các trang auth (mockup: docs/MOCKUP-AUTH.md, phương án B).
 * Điện thoại (iPhone 17 Pro Max): vùng thương hiệu ở trên, tờ form bo góc dính đáy màn hình để ô nhập và nút
 * nằm trong tầm ngón cái, đệm theo safe area. Từ sm trở lên: thương hiệu rồi thẻ căn giữa màn hình.
 * Một `h1` duy nhất theo TIEU-CHUAN-UI.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="bg-background flex min-h-dvh flex-col sm:items-center sm:justify-center sm:px-8 sm:py-10">
      <div className="flex w-full flex-1 flex-col sm:max-w-sm sm:flex-none">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-8 text-center sm:flex-none sm:pt-0">
          <span
            className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl"
            aria-hidden="true"
          >
            <Flame className="size-8" />
          </span>
          <div className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight">MacroOS</p>
            <p className="text-muted-foreground text-sm">Theo dõi calo và macro, nhẹ nhàng</p>
          </div>
        </div>

        <div className="bg-card sm:ring-foreground/10 rounded-t-3xl px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgb(0_0_0/0.06)] sm:rounded-3xl sm:px-7 sm:py-7 sm:shadow-none sm:ring-1">
          <div
            className="bg-border mx-auto mb-5 h-1 w-10 rounded-full sm:hidden"
            aria-hidden="true"
          />
          <div className="space-y-6">
            <header className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </header>
            {children}
            {footer && <div className="text-muted-foreground text-center text-sm">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
