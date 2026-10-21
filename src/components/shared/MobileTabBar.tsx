'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Apple, CircleEllipsis, LayoutDashboard, Plus, type LucideIcon } from 'lucide-react'
import { routePath } from '@/config/route-path'
import { useUiStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'

/** Ba vòng tròn xếp tam giác: biểu tượng "Strategy" của MacroFactor (lucide không có sẵn). */
const StrategyIcon = (({
  className,
  strokeWidth = 1.8,
}: {
  className?: string
  strokeWidth?: number
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    className={className}
  >
    <circle cx="12" cy="5.5" r="2.6" />
    <circle cx="6" cy="17" r="2.6" />
    <circle cx="18" cy="17" r="2.6" />
  </svg>
)) as unknown as LucideIcon

interface TabItem {
  icon: LucideIcon
  label: string
  href: string
}

// 4 tab + nút "+" ở giữa (thêm món ở mọi trang), như MacroFactor: Dashboard, Food Log, +, Strategy, More.
// Hồ sơ, thực phẩm của tôi, giao diện, đăng xuất nằm trong trang More.
const LEFT_TABS: readonly TabItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: routePath.dashboard },
  { icon: Apple, label: 'Food Log', href: routePath.foodLog },
]
const RIGHT_TABS: readonly TabItem[] = [
  { icon: StrategyIcon, label: 'Strategy', href: routePath.program },
  { icon: CircleEllipsis, label: 'More', href: routePath.more },
]

export function MobileTabBar() {
  const pathname = usePathname()
  const setShortcutsOpen = useUiStore((state) => state.setShortcutsOpen)

  const renderTab = ({ icon: Icon, label, href }: TabItem) => {
    const active = pathname === href || pathname.startsWith(`${href}/`)
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex flex-1 flex-col items-center justify-start gap-1 pt-3 text-xs transition-colors',
          active ? 'text-foreground font-semibold' : 'text-muted-foreground'
        )}
      >
        <Icon
          className="size-6"
          strokeWidth={active ? 2.2 : 1.7}
          fill={active && Icon === LayoutDashboard ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {label}
      </Link>
    )
  }

  return (
    <nav
      className="bg-card fixed inset-x-0 bottom-0 z-50 flex h-[calc(3.75rem+env(safe-area-inset-bottom))] items-start border-t pb-[env(safe-area-inset-bottom)] in-data-[keyboard=open]:hidden md:hidden"
      aria-label="Main navigation"
      data-bottom-nav=""
    >
      {LEFT_TABS.map(renderTab)}
      <div className="flex flex-1 justify-center">
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          aria-label="Shortcuts"
          aria-haspopup="dialog"
          className="bg-primary text-primary-foreground focus-visible:ring-ring/50 mt-2 flex size-11 items-center justify-center rounded-full transition-transform focus-visible:ring-1 focus-visible:outline-none active:scale-95"
        >
          <Plus className="size-6" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      {RIGHT_TABS.map(renderTab)}
    </nav>
  )
}
