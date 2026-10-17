'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from '@/components/shared/IconButton'

/** Thanh tiêu đề trang con: nút quay lại bên trái, tên trang ở giữa (h1 duy nhất của trang). */
export function SubPageHeader({ title }: { readonly title: string }) {
  const router = useRouter()
  return (
    <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
      <IconButton
        icon={ChevronLeft}
        label="Back"
        className="size-11"
        onClick={() => router.back()}
      />
      <h1 className="text-center text-lg font-semibold">{title}</h1>
    </header>
  )
}
