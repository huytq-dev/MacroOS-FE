import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface MetricTileProps {
  readonly title: string
  readonly subtitle: string
  /** Hình nhỏ ở giữa ô (đường xu hướng, lưới thói quen, thanh target...). */
  readonly visual?: React.ReactNode
  readonly value: string
  readonly unit?: string
  /** Chưa có trang chi tiết thì không có đường dẫn: ô vẫn hiện, chevron mờ, không bấm được. */
  readonly href?: string
  /** Đang tải: khung xám thay hình và số (không hiện 0). */
  readonly loading?: boolean
  readonly className?: string
}

/** Ô số liệu kiểu MacroFactor: tên + kỳ, hình nhỏ, đường kẻ, giá trị + đơn vị, chevron. Cả ô là một liên kết khi có `href`. */
export function MetricTile({
  title,
  subtitle,
  visual,
  value,
  unit,
  href,
  loading,
  className,
}: MetricTileProps) {
  const body = (
    <>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-lg leading-tight font-medium">{title}</h3>
        <p className="text-muted-foreground truncate text-sm leading-snug">{subtitle}</p>
      </div>
      <div className="flex min-h-14 flex-1 flex-col justify-end">
        {loading ? <Skeleton className="h-14 w-full rounded-lg" aria-busy="true" /> : visual}
      </div>
      <div className="border-border/70 flex items-center justify-between border-t pt-3">
        {loading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <p className="min-w-0 text-lg leading-6 tabular-nums">
            {value}
            {unit && <span className="text-muted-foreground ml-1 text-sm">{unit}</span>}
          </p>
        )}
        <ChevronRight
          aria-hidden="true"
          className={cn(
            'size-5 shrink-0',
            href ? 'text-muted-foreground' : 'text-muted-foreground/40'
          )}
        />
      </div>
    </>
  )
  const classes = cn(
    'bg-card flex min-w-0 flex-col gap-3 rounded-2xl p-4 transition-colors',
    href &&
      'active:bg-muted focus-visible:ring-ring/50 motion-safe:active:scale-[0.99] focus-visible:ring-1 focus-visible:outline-none',
    className
  )
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  )
}
