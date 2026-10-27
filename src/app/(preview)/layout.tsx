'use client'

import { MobileTabBar } from '@/components/shared/MobileTabBar'

/**
 * Khung của các trang XEM TRƯỚC (chỉ có khi build bật NEXT_PUBLIC_EXPENDITURE_PREVIEW, xem `features/dashboard/expenditure-preview.ts`): cùng lề và thanh tab dưới như trang đã đăng nhập để kiểm
 * tra bố cục / chồng lấn, nhưng KHÔNG có đăng nhập, không gọi API.
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-5">
        {children}
      </main>
      <MobileTabBar />
    </div>
  )
}
