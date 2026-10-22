import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ListSectionProps {
  /** Mã neo cho liên kết `#id` (vd. More › Units → `/profile#units`). */
  readonly id?: string
  /** Nhãn nhóm nhỏ phía trên (câu thường, không chữ hoa). */
  readonly label?: string
  /** Giá trị bên phải của nhãn (vd. tổng kcal của bữa). */
  readonly labelEnd?: React.ReactNode
  /** Chú thích dưới nhóm. */
  readonly footer?: string
  readonly className?: string
  readonly children: React.ReactNode
}

/** Nhóm dòng kiểu danh sách của iOS: nền thẻ, bo mềm, vạch mảnh giữa các dòng, không viền ngoài. */
export function ListSection({
  id,
  label,
  labelEnd,
  footer,
  className,
  children,
}: ListSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-4 space-y-1.5', className)}>
      {label && (
        <div className="text-muted-foreground flex items-baseline justify-between px-1 text-sm md:text-xs">
          <h2>{label}</h2>
          {labelEnd && <span className="tabular-nums">{labelEnd}</span>}
        </div>
      )}
      <div className="bg-card divide-border/70 divide-y overflow-hidden rounded-2xl">
        {children}
      </div>
      {footer && <p className="text-muted-foreground px-1 text-xs">{footer}</p>}
    </section>
  )
}

interface ListRowProps {
  readonly label: string
  /** Dòng phụ nhỏ dưới nhãn. */
  readonly hint?: string
  /** Giá trị bên phải (màu muted). */
  readonly value?: React.ReactNode
  /** Đánh dấu giá trị còn thiếu: chữ cam đậm để mắt tìm ra ngay. */
  readonly attention?: boolean
  readonly leading?: React.ReactNode
  readonly onClick?: () => void
  readonly href?: string
  readonly destructive?: boolean
  readonly className?: string
}

const ROW_BASE =
  'flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left text-base md:min-h-10 md:text-sm'

/** Một dòng trong `ListSection`: có `onClick` hoặc `href` thì chạm được (mũi tên bên phải, vùng chạm ≥ 48px). */
export function ListRow({
  label,
  hint,
  value,
  attention,
  leading,
  onClick,
  href,
  destructive,
  className,
}: ListRowProps) {
  const interactive = Boolean(onClick || href)
  const content = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className={cn('block', destructive && 'text-destructive font-medium')}>{label}</span>
        {hint && <span className="text-muted-foreground block text-xs">{hint}</span>}
      </span>
      {value !== undefined && (
        <span
          className={cn(
            'max-w-[55%] truncate text-right',
            attention ? 'text-mf-calories font-semibold' : 'text-muted-foreground'
          )}
        >
          {value}
        </span>
      )}
      {interactive && !destructive && (
        <ChevronRight aria-hidden="true" className="text-muted-foreground/60 size-4 shrink-0" />
      )}
    </>
  )
  const classes = cn(
    ROW_BASE,
    interactive &&
      'active:bg-muted focus-visible:ring-ring/50 transition-colors focus-visible:ring-1 focus-visible:ring-inset focus-visible:outline-none',
    className
  )

  if (href)
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    )
  return <div className={classes}>{content}</div>
}
