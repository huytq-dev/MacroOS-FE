'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from '@/components/shared/IconButton'

/** Thanh tiêu đề trang con: nút quay lại bên trái, tên trang ở giữa (h1 duy nhất của trang). */
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
    <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
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
