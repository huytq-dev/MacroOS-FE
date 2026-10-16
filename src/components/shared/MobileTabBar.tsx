'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { NotebookPen, Plus, Scale, Sun, Target, type LucideIcon } from 'lucide-react'
import { routePath } from '@/config/route-path'
import { useUiStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'

interface TabItem {
  icon: LucideIcon
  label: string
  href: string
}

// 4 tab + nút "+" ở giữa (thêm món ở mọi trang). Hồ sơ, thực phẩm, giao diện nằm trong menu ảnh đại diện.
const LEFT_TABS: readonly TabItem[] = [
  { icon: Sun, label: 'Hôm nay', href: routePath.dashboard },
  { icon: NotebookPen, label: 'Nhật ký', href: routePath.foodLog },
]
const RIGHT_TABS: readonly TabItem[] = [
  { icon: Scale, label: 'Cân nặng', href: routePath.weight },
  { icon: Target, label: 'Program', href: routePath.program },
]

export function MobileTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const setAddFoodOpen = useUiStore((state) => state.setAddFoodOpen)

  const openAddFood = () => {
    setAddFoodOpen(true)
    if (pathname !== routePath.foodLog) router.push(routePath.foodLog)
  }

  const renderTab = ({ icon: Icon, label, href }: TabItem) => {
    const active = pathname === href || pathname.startsWith(`${href}/`)
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 pt-1 text-[11px] transition-colors',
          active ? 'text-foreground font-bold' : 'text-muted-foreground'
        )}
      >
        <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
        {label}
      </Link>
    )
  }

  return (
    <nav
      className="bg-card/95 fixed inset-x-0 bottom-0 z-50 flex h-[calc(3.75rem+env(safe-area-inset-bottom))] items-start border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Điều hướng chính"
    >
      {LEFT_TABS.map(renderTab)}
      <div className="flex flex-1 justify-center">
        <button
          type="button"
          onClick={openAddFood}
          aria-label="Thêm món"
          className="bg-primary text-primary-foreground focus-visible:ring-ring/50 -mt-3 flex size-14 items-center justify-center rounded-full shadow-[0_4px_14px_rgb(0_0_0/0.18)] transition-transform focus-visible:ring-1 focus-visible:outline-none active:scale-95"
        >
          <Plus className="size-7" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
      {RIGHT_TABS.map(renderTab)}
    </nav>
  )
}
