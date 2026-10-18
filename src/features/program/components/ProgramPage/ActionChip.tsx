import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const CHIP =
  'bg-secondary active:bg-muted focus-visible:ring-ring/50 inline-flex h-11 items-center gap-2 rounded-full px-4 text-base transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100'

interface ActionChipProps {
  readonly icon: LucideIcon
  readonly label: string
  readonly onClick?: () => void
  readonly href?: string
  readonly className?: string
}

/** Nút viên thuốc có icon của các thẻ Strategy (New Program, Edit Goal…): link khi có `href`, nút khi có `onClick`. */
export function ActionChip({ icon: Icon, label, onClick, href, className }: ActionChipProps) {
  const content = (
    <>
      <Icon aria-hidden="true" className="size-5" />
      {label}
    </>
  )
  return href ? (
    <Link href={href} className={cn(CHIP, className)}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cn(CHIP, className)}>
      {content}
    </button>
  )
}
