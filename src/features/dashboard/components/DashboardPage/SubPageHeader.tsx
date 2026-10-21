'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from '@/components/shared/IconButton'

/**
 * Thanh tiêu đề trang con: nút quay lại bên trái, tên trang ở giữa (h1 duy nhất của trang). GHIM ở đầu màn hình khi cuộn (như MacroFactor):
 * nền trùng nền trang, phủ cả vùng tai thỏ (pt safe-area, bù bằng margin âm để vị trí lúc chưa cuộn không đổi), trải hết bề ngang main
 * (-mx cân với px của main; desktop: main cuộn và có padding 20px nên top -5 / -mt-5 / pt-5 để thanh dính sát mép trên khung cuộn) và nằm trên nội dung nhưng dưới thanh tab / bảng; không viền hay bóng. `data-page-header` để biểu đồ phóng to
 * biết phần bị thanh này che.
 */
export function SubPageHeader({
  title,
  action,
  onBack,
}: {
  readonly title: string
  /** Nút bên phải (vd. nút hướng dẫn); không có thì chừa trống để tiêu đề nằm giữa. */
  readonly action?: React.ReactNode
  /** Thay hành vi quay lại mặc định (`router.back()`), vd. hỏi xác nhận khi có thay đổi chưa lưu. */
  readonly onBack?: () => void
}) {
  const router = useRouter()
  return (
    <header
      data-page-header=""
      className="bg-background sticky top-0 z-30 -mx-4 -mt-[env(safe-area-inset-top)] grid grid-cols-[2.75rem_1fr_2.75rem] items-center px-4 pt-[env(safe-area-inset-top)] md:-top-5 md:-mx-5 md:-mt-5 md:px-5 md:pt-5"
    >
      <IconButton
        icon={ChevronLeft}
        label="Back"
        className="size-11"
        onClick={onBack ?? (() => router.back())}
      />
      <h1 className="text-center text-lg font-medium">{title}</h1>
      <div className="flex justify-end">{action}</div>
    </header>
  )
}
