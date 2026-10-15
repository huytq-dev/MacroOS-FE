import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/shared/Logo'

interface AuthShellProps {
  readonly title: string
  readonly description?: string
  readonly children: React.ReactNode
  readonly footer?: React.ReactNode
}

/** Khung chung cho các trang auth: logo + card giữa màn hình; mobile full-width, lề 16px. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm space-y-6">
        <Logo height={28} />
        <Card className="shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="font-sans text-base font-semibold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
            {footer && <div className="text-muted-foreground text-center text-xs">{footer}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
