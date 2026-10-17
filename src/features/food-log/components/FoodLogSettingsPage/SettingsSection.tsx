import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/** Nhóm cài đặt: tiêu đề lớn phía trên, các dòng nằm trong một thẻ bo góc ngăn bằng đường kẻ mảnh. */
export function SettingsSection({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}) {
  return (
    <section aria-label={title} className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
        {children}
      </div>
    </section>
  )
}

interface SettingRowProps {
  readonly title: string
  /** Giá trị hiện tại hoặc mô tả ngắn, hiện mờ dưới tiêu đề. */
  readonly detail: string
  /** Có `onEdit`: nút "Edit" bo tròn bên phải. Có `onOpen`: cả dòng bấm được kèm mũi tên (mở trang con). */
  readonly onEdit?: () => void
  readonly onOpen?: () => void
  /** Mở trang con bằng liên kết (ưu tiên hơn `onOpen`). */
  readonly href?: string
}

/** Một dòng cài đặt kiểu MacroFactor. */
export function SettingRow({ title, detail, onEdit, onOpen, href }: SettingRowProps) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-base">{title}</span>
        <span className="text-muted-foreground block text-sm">{detail}</span>
      </span>
      {onEdit && (
        <span className="bg-secondary flex h-10 items-center rounded-full px-5 text-sm">Edit</span>
      )}
      {(onOpen || href) && (
        <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
      )}
    </>
  )
  const className =
    'flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left focus-visible:ring-ring/50 focus-visible:ring-1 focus-visible:outline-none'
  if (href)
    return (
      <Link href={href} className={`${className} active:bg-muted transition-colors`}>
        {body}
      </Link>
    )
  return onEdit || onOpen ? (
    <button
      type="button"
      aria-label={onEdit ? `Edit ${title}` : title}
      onClick={onEdit ?? onOpen}
      className={`${className} active:bg-muted transition-colors`}
    >
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}
