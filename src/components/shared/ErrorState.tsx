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
    title: 'Bạn chưa có quyền xem nội dung này',
    description:
      'Tài khoản của bạn chưa được cấp quyền truy cập mục này. Vui lòng liên hệ quản trị viên để được cấp quyền.',
    retryable: false,
  },
  unauthorized: {
    icon: ShieldAlert,
    title: 'Phiên đăng nhập đã hết hạn',
    description: 'Vui lòng đăng nhập lại để tiếp tục.',
    retryable: false,
  },
  notFound: {
    icon: SearchX,
    title: 'Không tìm thấy dữ liệu',
    description: 'Dữ liệu bạn yêu cầu không tồn tại hoặc đã bị xóa.',
    retryable: false,
  },
  network: {
    icon: WifiOff,
    title: 'Không thể kết nối đến hệ thống',
    description: 'Vui lòng kiểm tra kết nối mạng rồi thử lại.',
    retryable: true,
  },
  server: {
    icon: ServerCrash,
    title: 'Hệ thống đang gặp sự cố',
    description: 'Chúng tôi chưa tải được dữ liệu. Vui lòng thử lại sau ít phút.',
    retryable: true,
  },
  unknown: {
    icon: CircleAlert,
    title: 'Không thể tải dữ liệu',
    description: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
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
      {isRetrying ? 'Đang thử lại…' : 'Thử lại'}
    </Button>
  )
  const technical = (
    <details className="text-muted-foreground text-xs">
      <summary className="hover:text-foreground cursor-pointer select-none">
        Chi tiết kỹ thuật
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
          'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs',
          className
        )}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="min-w-0 flex-1">
          <strong className="font-medium">{title}.</strong>{' '}
          <span className="text-muted-foreground">Một phần dữ liệu có thể chưa đầy đủ.</span>
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
            <Link href={backHref}>Quay lại</Link>
          </Button>
        )}
        {kind === 'unauthorized' && (
          <Button size="sm" asChild>
            <Link href={routePath.login}>Đăng nhập lại</Link>
          </Button>
        )}
        {retryButton}
      </div>
      {technical}
    </div>
  )
}
