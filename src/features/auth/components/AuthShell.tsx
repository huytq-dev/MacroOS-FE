import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/shared/Logo'

interface AuthShellProps {
  readonly title: string
  readonly description?: string
  readonly children: React.ReactNode
  readonly footer?: React.ReactNode
}

/**
 * Khung chung cho các trang auth. Mobile (iPhone 17 Pro Max): lề 16px, card full-width, căn trên để bàn phím
 * không che nút gửi; từ sm trở lên căn giữa màn hình. Một `h1` duy nhất theo TIEU-CHUAN-UI.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="bg-background flex min-h-dvh justify-center px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:items-center sm:px-8 sm:py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo height={32} />
        </div>
        <Card className="gap-5 rounded-2xl py-6 ring-1">
          <CardContent className="space-y-5 px-5 sm:px-6">
            <header className="space-y-1">
              <h1 className="text-base font-semibold">{title}</h1>
              {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </header>
            {children}
          </CardContent>
        </Card>
        {footer && <div className="text-muted-foreground text-center text-sm">{footer}</div>}
      </div>
    </div>
  )
}
