import { AvatarMenu } from '@/components/shared/AvatarMenu'

interface PageHeaderProps {
  readonly title: string
  /** Dòng nhỏ phía trên tiêu đề (ngày, ngữ cảnh). */
  readonly eyebrow?: string
  /** Nút hành động bên phải (vd. "Ghi cân"). */
  readonly action?: React.ReactNode
}

/**
 * Tiêu đề trang kiểu app: chữ lớn bên trái, ảnh đại diện bên phải (chỉ mobile; desktop đã có ở header).
 * Mỗi trang có đúng một `h1`.
 */
export function PageHeader({ title, eyebrow, action }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-3 pb-1 md:pb-2">
      <div className="min-w-0">
        {eyebrow && <p className="text-muted-foreground text-sm md:text-xs">{eyebrow}</p>}
        <h1 className="text-[28px] leading-tight font-bold tracking-tight md:text-xl">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <AvatarMenu className="md:hidden" />
      </div>
    </header>
  )
}
