import Link from 'next/link'
import {
  CircleAlert,
  Lock,
  RefreshCw,
  SearchX,
  ServerCrash,
  ShieldAlert,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getErrorKind, getErrorMessage, type ErrorKind } from '@/lib/api'
import { routePath } from '@/config/route-path'
import { cn } from '@/lib/utils'

interface ErrorCopy {
  icon: LucideIcon
  title: string
  description: string
  /** Thử lại chỉ có ý nghĩa khi lỗi có thể tự hết (mạng, máy chủ). */
  retryable: boolean
}

const copy: Record<ErrorKind, ErrorCopy> = {
  forbidden: {
    icon: Lock,
    title: "You don't have access to this content",
    description:
      'Your account does not have permission to view this section. Contact an administrator to request access.',
    retryable: false,
  },
  unauthorized: {
    icon: ShieldAlert,
    title: 'Your session has expired',
    description: 'Sign in again to continue.',
    retryable: false,
  },
  notFound: {
    icon: SearchX,
    title: 'Nothing found',
    description: 'The data you requested does not exist or has been deleted.',
    retryable: false,
  },
  network: {
    icon: WifiOff,
    title: 'Unable to connect',
    description: 'Check your internet connection and try again.',
    retryable: true,
  },
  server: {
    icon: ServerCrash,
    title: 'Something went wrong on our end',
    description: 'We could not load your data. Please try again in a few minutes.',
    retryable: true,
  },
  unknown: {
    icon: CircleAlert,
    title: 'Unable to load data',
    description: 'Something went wrong. Please try again.',
    retryable: true,
  },
}

interface ErrorStateProps {
  readonly error: unknown
  /** Ép loại lỗi khi không có AxiosError (vd. thiếu tham số URL → notFound). */
  readonly kind?: ErrorKind
  /** page: thay cả trang (lỗi quyền, không tìm thấy); inline: trong một khối; banner: thanh phía trên. */
  readonly variant?: 'page' | 'inline' | 'banner'
  readonly onRetry?: () => void
  readonly isRetrying?: boolean
  readonly backHref?: string
  readonly className?: string
}

export function ErrorState({
  error,
  kind: forcedKind,
  variant = 'page',
  onRetry,
  isRetrying = false,
  backHref,
  className,
}: ErrorStateProps) {
  const detected = getErrorKind(error)
  const kind = forcedKind ?? detected.kind
  const status = detected.status
  const { icon: Icon, title, description, retryable } = copy[kind]
  const canRetry = retryable && Boolean(onRetry)
  const retryButton = canRetry && (
    <Button variant="outline" size="sm" className="gap-1.5" disabled={isRetrying} onClick={onRetry}>
      <RefreshCw aria-hidden="true" className={cn('size-3.5', isRetrying && 'animate-spin')} />
      {isRetrying ? 'Retrying…' : 'Try again'}
    </Button>
  )
  const technical = (
    <details className="text-muted-foreground text-xs">
      <summary className="hover:text-foreground cursor-pointer select-none">
        Technical details
      </summary>
      <p className="mt-1 break-words">
        {status ? `HTTP ${status} · ` : ''}
        {getErrorMessage(error)}
      </p>
    </details>
  )

  if (variant === 'banner')
    return (
      <div
        role="alert"
        className={cn(
          'border-mf-warning-border bg-mf-warning-bg flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-xs',
          className
        )}
      >
        <Icon aria-hidden="true" className="text-mf-warning-text size-4 shrink-0" />
        <span className="min-w-0 flex-1">
          <strong className="font-medium">{title}.</strong>{' '}
          <span className="text-muted-foreground">Some data may be incomplete.</span>
        </span>
        {retryButton}
      </div>
    )

  if (variant === 'inline')
    return (
      <div
        role="alert"
        className={cn('flex flex-col items-center justify-center gap-3 p-6 text-center', className)}
      >
        <Icon aria-hidden="true" className="text-muted-foreground size-8" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground max-w-sm text-xs">{description}</p>
        </div>
        {retryButton}
        {technical}
      </div>
    )

  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-8 text-center',
        className
      )}
    >
      <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-base font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {backHref && (
          <Button variant="outline" size="sm" asChild>
            <Link href={backHref}>Go back</Link>
          </Button>
        )}
        {kind === 'unauthorized' && (
          <Button size="sm" asChild>
            <Link href={routePath.login}>Sign in again</Link>
          </Button>
        )}
        {retryButton}
      </div>
      {technical}
    </div>
  )
}
