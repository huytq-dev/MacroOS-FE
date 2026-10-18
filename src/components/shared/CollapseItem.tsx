import { cn } from '@/lib/utils'

interface CollapseItemProps {
  /** Đang bị gỡ (từ `useExitingList`): co chiều cao về 0 và mờ dần 300ms; không bấm được nữa. */
  readonly leaving?: boolean
  /** Vừa được thêm: trượt vào từ phải và hiện dần. */
  readonly entering?: boolean
  /** Khoảng cách phía trên (trừ mục đầu) nằm trong mục để co cùng lúc với mục bị xoá. */
  readonly gap?: boolean
  readonly className?: string
  /** Thẻ bao ngoài: `li` trong `<ul>`, `div` trong danh sách không phải ul (vd. ListSection). */
  readonly as?: 'li' | 'div'
  readonly children: React.ReactNode
}

/**
 * Một mục (mặc định `<li>`) của danh sách có hoạt ảnh vào / ra (dùng với `useExitingList`). Chiều cao chuyển bằng grid-rows 1fr ↔ 0fr nên
 * không cần đo; khoảng cách giữa các mục nằm trong mục (`gap`) để co cùng lúc.
 */
export function CollapseItem({
  leaving = false,
  entering = false,
  gap = false,
  className,
  as: Tag = 'li',
  children,
}: CollapseItemProps) {
  return (
    <Tag
      inert={leaving}
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
        leaving ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
        entering &&
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-6 motion-safe:duration-300',
        className
      )}
    >
      <div className={cn('min-h-0 overflow-hidden', gap && 'pt-2 [li:first-child>&]:pt-0')}>
        {children}
      </div>
    </Tag>
  )
}
