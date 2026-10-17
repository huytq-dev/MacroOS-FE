'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from '@/components/shared/IconButton'

/** Thanh tiêu đề trang con: nút quay lại bên trái, tên trang ở giữa (h1 duy nhất của trang). */
export function SubPageHeader({
  title,
  action,
}: {
  readonly title: string
  /** Nút bên phải (vd. nút hướng dẫn); không có thì chừa trống để tiêu đề nằm giữa. */
  readonly action?: React.ReactNode
}) {
  const router = useRouter()
  return (
    <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
      <IconButton
        icon={ChevronLeft}
        label="Back"
        className="size-11"
        onClick={() => router.back()}
      />
      <h1 className="text-center text-lg font-medium">{title}</h1>
      <div className="flex justify-end">{action}</div>
    </header>
  )
}
