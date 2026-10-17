import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TileSectionProps {
  readonly title: string
  /** Có thì hiện liên kết "Xem tất cả" ở góc phải tiêu đề. */
  readonly seeAllHref?: string
  readonly children: React.ReactNode
  /** Thứ tự xuất hiện để các nhóm hiện lần lượt khi cuộn xuống. */
  readonly index?: number
  readonly className?: string
}

/** Một nhóm ô: tiêu đề (kèm "Xem tất cả") và lưới 2 cột. */
export function TileSection({
  title,
  seeAllHref,
  children,
  index = 0,
  className,
}: TileSectionProps) {
  const id = `section-${title.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 space-y-3 [animation-fill-mode:backwards]',
        className
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-xl font-bold">
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="focus-visible:ring-ring/50 flex min-h-11 items-center text-base underline underline-offset-4 focus-visible:ring-1 focus-visible:outline-none"
          >
            See All
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  )
}
