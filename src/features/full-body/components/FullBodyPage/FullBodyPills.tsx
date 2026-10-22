import Link from 'next/link'
import { routePath } from '@/config/route-path'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { ArticleIcon, CompareIcon } from './FullBodyHeader'

const PILL =
  'focus-visible:ring-ring/50 flex h-11 items-center justify-center gap-2 rounded-full px-4 text-base transition-[background-color,color,opacity,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none'

/** Cỡ chữ theo bề ngang (tối đa 15px) để hai nút luôn nằm một dòng ở 375px, không xuống dòng. */
const LINK_TEXT = 'gap-1.5 px-3 text-[length:min(15px,3.6vw)] whitespace-nowrap'

/** Hai nút đầu trang Full Body; nút nào chưa đủ dữ liệu thì mờ, không bấm được (Compare cần 2 ngày). */
export function FullBodyLinks({
  canView,
  canCompare,
}: {
  readonly canView: boolean
  readonly canCompare: boolean
}) {
  const link = (href: string, label: string, Icon: typeof ArticleIcon, enabled: boolean) =>
    enabled ? (
      <Link href={href} className={cn(PILL, LINK_TEXT, 'bg-secondary active:bg-secondary/70')}>
        <Icon aria-hidden="true" className="size-[1.2em] shrink-0" />
        {label}
      </Link>
    ) : (
      <span
        aria-disabled="true"
        className={cn(PILL, LINK_TEXT, 'bg-background text-muted-foreground')}
      >
        <Icon aria-hidden="true" className="size-[1.2em] shrink-0" />
        {label}
      </span>
    )
  return (
    <div className="flex justify-center gap-2">
      {link(routePath.fullBodyAll, 'View All Metrics', ArticleIcon, canView)}
      {link(routePath.fullBodyCompare, 'Compare All Metrics', CompareIcon, canCompare)}
    </div>
  )
}

export type CompareSide = 'from' | 'to'

interface ComparePillsProps {
  readonly from: string
  readonly to: string
  /** Pill trắng = ngày mà tab / lịch đang sửa. */
  readonly active: CompareSide
  readonly onActiveChange: (side: CompareSide) => void
}

/** "Comparing [A] to [B]": bấm một pill để chọn ngày mà tab / lịch sẽ đổi; nền trắng ↔ xám chuyển màu 200ms, ngày mới hiện dần. */
export function ComparePills({ from, to, active, onActiveChange }: ComparePillsProps) {
  const pill = (side: CompareSide, date: string) => (
    <button
      type="button"
      aria-pressed={active === side}
      aria-label={`${side === 'from' ? 'Compare from' : 'Compare to'} ${formatDate(date)}`}
      onClick={() => onActiveChange(side)}
      className={cn(
        PILL,
        'px-3 text-[15px] whitespace-nowrap tabular-nums active:scale-95 motion-reduce:active:scale-100',
        active === side ? 'bg-foreground text-background' : 'bg-secondary'
      )}
    >
      <span
        key={date}
        className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
      >
        {formatDate(date)}
      </span>
    </button>
  )
  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-[15px]">
      <span>Comparing</span>
      {pill('from', from)}
      <span>to</span>
      {pill('to', to)}
    </div>
  )
}
