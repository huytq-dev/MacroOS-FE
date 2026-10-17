import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
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
  className,
}: MetricTileProps) {
  const body = (
    <>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-lg leading-tight font-medium">{title}</h3>
        <p className="text-muted-foreground truncate text-base">{subtitle}</p>
      </div>
      <div className="flex min-h-12 flex-1 flex-col justify-end">{visual}</div>
      <div className="border-border/70 flex items-center justify-between border-t pt-3">
        <p className="min-w-0 truncate text-xl tabular-nums">
          {value}
          {unit && <span className="text-muted-foreground ml-1 text-base">{unit}</span>}
        </p>
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
