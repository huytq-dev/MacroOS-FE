interface PageHeaderProps {
  readonly title: string
  /** Dòng nhỏ phía trên tiêu đề (ngày, ngữ cảnh). */
  readonly eyebrow?: string
  /** Nút hành động bên phải (vd. "Ghi cân"). */
  readonly action?: React.ReactNode
  /** Kiểu tiêu đề của app MacroFactor: chữ hoa, đậm, giãn chữ. */
  readonly display?: boolean
}

/**
 * Tiêu đề trang kiểu app: chữ lớn bên trái, nút hành động bên phải (tài khoản nằm ở tab More trên điện thoại, ở header trên desktop).
 * Mỗi trang có đúng một `h1`.
 */
export function PageHeader({ title, eyebrow, action, display = false }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-3 pb-1 md:pb-2">
      <div className="min-w-0">
        {eyebrow && <p className="text-muted-foreground text-sm md:text-xs">{eyebrow}</p>}
        <h1
          className={
            display
              ? 'text-[28px] leading-tight font-extrabold tracking-wider uppercase md:text-xl'
              : 'text-[28px] leading-tight font-bold tracking-tight md:text-xl'
          }
        >
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">{action}</div>
    </header>
  )
}
