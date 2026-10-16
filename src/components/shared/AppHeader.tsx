'use client'

import Link from 'next/link'
import { routePath } from '@/config/route-path'
import { AvatarMenu } from '@/components/shared/AvatarMenu'
import { Wordmark } from '@/components/shared/Wordmark'

/** Thanh trên của desktop. Điện thoại không dùng: mỗi trang có tiêu đề lớn và ảnh đại diện riêng (PageHeader). */
export function AppHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 hidden h-12 w-full shrink-0 border-b backdrop-blur-md md:block">
      <div className="flex h-12 items-center px-4">
        <Link href={routePath.dashboard}>
          <Wordmark size={16} />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <AvatarMenu />
        </div>
      </div>
    </header>
  )
}
